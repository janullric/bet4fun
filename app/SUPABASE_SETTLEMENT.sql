-- ================================================================
-- Bet4Fun — Motore di chiusura giornata (Art. 8-11) — v2 HARDENED
--
-- Crea/ripara le tabelle del settlement e le RPC. Idempotente.
-- Fix principali rispetto alla v1 documentata in SUPABASE_SETUP.md §7:
--   • bet_scores.bet_id era `uuid` ma bets.id è `bigint` → la v1 non
--     poteva nemmeno essere creata. Qui è bigint.
--   • bonus Art.8 calcolato PER UTENTE (non globale).
--   • distribute_round_pot rifiuta la doppia distribuzione.
--   • admin_close_round: UNA chiamata fa tutto — risultati dalle
--     fixtures, punti, montepremi (base + iscritti × quota), payout.
--   • list_my_bets esteso con punti e vincite.
-- ================================================================

-- ---------- Tabelle ----------

create table if not exists public.match_results (
  event_id         text primary key,
  league_id        text not null,
  round            int,
  kind             text not null check (kind in ('match','score','race')),
  outcome          text,
  home_goals       int,
  away_goals       int,
  race_positions   jsonb,
  settled_at       timestamptz default now(),
  created_at       timestamptz default now()
);
alter table public.match_results enable row level security;
drop policy if exists "results are public" on public.match_results;
create policy "results are public" on public.match_results for select using (true);

-- bet_scores è dato derivato (ricalcolabile con settle_round): drop sicuro.
drop table if exists public.bet_scores cascade;
create table public.bet_scores (
  bet_id       bigint not null references public.bets(id) on delete cascade,
  event_id     text not null,
  outcome      text not null,
  points       int  not null default 0,
  is_exact     boolean not null default false,
  user_id      uuid not null references auth.users(id) on delete cascade,
  round_key    text not null,
  settled_at   timestamptz default now(),
  primary key (bet_id, event_id, outcome)
);
alter table public.bet_scores enable row level security;
drop policy if exists "own scores visible" on public.bet_scores;
create policy "own scores visible" on public.bet_scores for select
  using (user_id = auth.uid());

create table if not exists public.round_pots (
  round_key      text primary key,
  league_id      text not null,
  round          int  not null,
  prize_pool     bigint not null default 0,
  distributed    boolean not null default false,
  distributed_at timestamptz,
  created_at     timestamptz default now()
);
alter table public.round_pots enable row level security;
drop policy if exists "pot public read" on public.round_pots;
create policy "pot public read" on public.round_pots for select using (true);

create table if not exists public.bet_payouts (
  id            bigserial primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  round_key     text,
  kind          text not null,
  rank          int,
  amount        bigint not null,
  note          text,
  created_at    timestamptz default now()
);
alter table public.bet_payouts enable row level security;
drop policy if exists "own payouts visible" on public.bet_payouts;
create policy "own payouts visible" on public.bet_payouts for select
  using (user_id = auth.uid());

-- ---------- Helper admin ----------

create or replace function public.is_admin(p_user uuid default auth.uid())
returns boolean
language sql stable
security definer
set search_path = public
as $func$
  select coalesce((select is_admin from public.profiles where id = p_user), false);
$func$;

-- ---------- ART. 8: calcolo punti ----------

create or replace function public.settle_round(p_league_id text, p_round int)
returns void
language plpgsql
security definer
set search_path = public
as $func$
declare
  v_round_key text := p_league_id || ':' || p_round::text;
  v_rec record;
  v_rate numeric;
  v_tier int;
  v_first_bet bigint;
begin
  if not public.is_admin() then raise exception 'not an admin'; end if;

  delete from public.bet_scores where round_key = v_round_key;

  -- MATCH 1X2 / 12: 1 punto per esito corretto.
  insert into public.bet_scores (bet_id, event_id, outcome, points, is_exact, user_id, round_key)
  select
    bp.bet_id, bp.event_id, bp.outcome,
    case when mr.outcome = bp.outcome then 1 else 0 end,
    false, b.user_id, v_round_key
  from public.bet_picks bp
    join public.bets b on b.id = bp.bet_id
    join public.match_results mr on mr.event_id = bp.event_id and mr.kind = 'match'
  where b.league_id = p_league_id and coalesce(b.round, -1) = p_round;

  -- SCORE (risultato esatto): 3 punti esatto, 1 punto esito giusto.
  insert into public.bet_scores (bet_id, event_id, outcome, points, is_exact, user_id, round_key)
  select
    bp.bet_id, bp.event_id, bp.outcome,
    case
      when bp.outcome = (mr.home_goals::text || '-' || mr.away_goals::text) then 3
      when substring(bp.outcome from '^(\d+)')::int > substring(bp.outcome from '-(\d+)$')::int
           and mr.home_goals > mr.away_goals then 1
      when substring(bp.outcome from '^(\d+)')::int < substring(bp.outcome from '-(\d+)$')::int
           and mr.home_goals < mr.away_goals then 1
      when substring(bp.outcome from '^(\d+)')::int = substring(bp.outcome from '-(\d+)$')::int
           and mr.home_goals = mr.away_goals then 1
      else 0
    end,
    bp.outcome = (mr.home_goals::text || '-' || mr.away_goals::text),
    b.user_id, v_round_key
  from public.bet_picks bp
    join public.bets b on b.id = bp.bet_id
    join public.match_results mr on mr.event_id = bp.event_id and mr.kind = 'score'
  where b.league_id = p_league_id and coalesce(b.round, -1) = p_round
    and bp.outcome ~ '^\d+-\d+$';

  -- RACE (F1/ciclismo): pick "p{N}:{subject}", 10/6/4/3/2/1 alle pos 1..6.
  insert into public.bet_scores (bet_id, event_id, outcome, points, is_exact, user_id, round_key)
  select
    bp.bet_id, bp.event_id, bp.outcome,
    case (split_part(bp.outcome, ':', 1))
      when 'p1' then 10 when 'p2' then 6 when 'p3' then 4
      when 'p4' then 3  when 'p5' then 2 when 'p6' then 1 else 0
    end
    * case when mr.race_positions ->> (substring(split_part(bp.outcome, ':', 1) from 'p(\d+)')::int - 1)
             = split_part(bp.outcome, ':', 2)
           then 1 else 0 end,
    false, b.user_id, v_round_key
  from public.bet_picks bp
    join public.bets b on b.id = bp.bet_id
    join public.match_results mr on mr.event_id = bp.event_id and mr.kind = 'race'
  where b.league_id = p_league_id and coalesce(b.round, -1) = p_round
    and bp.outcome like 'p%:%';

  -- Bonus Art.8 PER UTENTE: % di pick corretti del singolo utente →
  -- tier 60%=+1, 65%=+2, 70%=+4, 75%=+6, 80%=+8, 85%=+10.
  -- Inserito come riga sintetica '__bonus__' così resta visibile e auditabile.
  for v_rec in
    select user_id,
           count(*) as total,
           count(*) filter (where points > 0) as correct
    from public.bet_scores
    where round_key = v_round_key
    group by user_id
    having count(*) > 0
  loop
    v_rate := v_rec.correct::numeric / v_rec.total::numeric;
    if    v_rate >= 0.85 then v_tier := 10;
    elsif v_rate >= 0.80 then v_tier := 8;
    elsif v_rate >= 0.75 then v_tier := 6;
    elsif v_rate >= 0.70 then v_tier := 4;
    elsif v_rate >= 0.65 then v_tier := 2;
    elsif v_rate >= 0.60 then v_tier := 1;
    else v_tier := 0;
    end if;

    if v_tier > 0 then
      select min(bs.bet_id) into v_first_bet
        from public.bet_scores bs
       where bs.round_key = v_round_key and bs.user_id = v_rec.user_id;
      insert into public.bet_scores (bet_id, event_id, outcome, points, is_exact, user_id, round_key)
      values (v_first_bet, '__bonus__', 'tier', v_tier, false, v_rec.user_id, v_round_key)
      on conflict (bet_id, event_id, outcome) do update set points = excluded.points;
    end if;
  end loop;
end;
$func$;

grant execute on function public.settle_round(text, int) to authenticated;

-- ---------- ART. 9: distribuzione montepremi ----------

create or replace function public.distribute_round_pot(p_league_id text, p_round int)
returns table(user_id uuid, rank int, amount bigint)
language plpgsql
security definer
set search_path = public
as $func$
declare
  v_key text := p_league_id || ':' || p_round::text;
  v_pot bigint;
  v_done boolean;
  v_participants int;
  v_ranks int;
  v_sum_denoms numeric := 0;
  v_v numeric;
  v_i int;
  v_share numeric;
begin
  if not public.is_admin() then raise exception 'not an admin'; end if;

  select prize_pool, distributed into v_pot, v_done
    from public.round_pots where round_key = v_key;
  if v_pot is null or v_pot = 0 then
    raise exception 'nessun montepremi impostato per %', v_key;
  end if;
  -- Anti doppio pagamento: una giornata si distribuisce UNA volta sola.
  if coalesce(v_done, false) then
    raise exception 'montepremi già distribuito per %', v_key;
  end if;

  drop table if exists _tmp_rank;
  create temp table _tmp_rank as
  select bs.user_id, sum(bs.points)::int as pts,
         row_number() over (order by sum(bs.points) desc, bs.user_id) as pos
  from public.bet_scores bs where bs.round_key = v_key
  group by bs.user_id having sum(bs.points) > 0;

  select count(*) into v_participants from _tmp_rank;
  if v_participants = 0 then
    update public.round_pots set distributed = true, distributed_at = now()
      where round_key = v_key;
    return;
  end if;

  v_ranks := greatest(1, floor(v_participants / 3.0)::int);

  for v_i in 1..v_ranks loop
    v_sum_denoms := v_sum_denoms + (1.0 / v_i);
  end loop;
  v_v := (v_pot::numeric * 0.80) / v_sum_denoms;

  -- Primo classificato: 20% fisso.
  insert into public.bet_payouts (user_id, round_key, kind, rank, amount, note)
  select t.user_id, v_key, 'round_winner', 1, round(v_pot * 0.20)::bigint, 'Art.9 — 20% montepremi'
  from _tmp_rank t where t.pos = 1;

  update public.profiles p
    set funnies = funnies + round(v_pot * 0.20)::bigint
    from _tmp_rank t
    where t.pos = 1 and p.id = t.user_id;

  -- Cascata V, V/2, … V/R.
  for v_i in 1..v_ranks loop
    v_share := v_v / v_i;
    insert into public.bet_payouts (user_id, round_key, kind, rank, amount, note)
    select t.user_id, v_key, 'round_cascade', v_i, round(v_share)::bigint, 'Art.9 — V/' || v_i
    from _tmp_rank t where t.pos = v_i;

    update public.profiles p
      set funnies = funnies + round(v_share)::bigint
      from _tmp_rank t
      where t.pos = v_i and p.id = t.user_id;
  end loop;

  update public.round_pots
    set distributed = true, distributed_at = now()
    where round_key = v_key;

  return query
    select bp.user_id, bp.rank, bp.amount
    from public.bet_payouts bp
    where bp.round_key = v_key
    order by bp.rank, bp.amount desc;
end;
$func$;

grant execute on function public.distribute_round_pot(text, int) to authenticated;

-- ---------- CHIUSURA ONE-CLICK ----------
-- Deriva i risultati 1X2/12 dalle fixtures con punteggio, calcola i punti,
-- imposta il montepremi trasparente (base + iscritti × quota) e paga.
-- Tutto in una transazione: o va tutto, o niente.

create or replace function public.admin_close_round(
  p_league_id   text,
  p_round       int,
  p_base_pool   bigint,
  p_per_entrant bigint
)
returns table (entrants int, prize_pool bigint, winners int, total_paid bigint)
language plpgsql
security definer
set search_path = public
as $func$
declare
  v_key      text := p_league_id || ':' || p_round::text;
  v_missing  int;
  v_entrants int;
  v_pot      bigint;
begin
  if not public.is_admin() then raise exception 'not an admin'; end if;

  -- Tutte le partite della giornata devono avere un punteggio finale.
  select count(*) into v_missing
    from public.fixtures f
   where f.league_id = p_league_id and f.round = p_round
     and (f.home_score is null or f.away_score is null);
  if v_missing > 0 then
    raise exception 'mancano i risultati di % partite: inseriscili prima di chiudere', v_missing;
  end if;
  if not exists (select 1 from public.fixtures f
                  where f.league_id = p_league_id and f.round = p_round) then
    raise exception 'nessuna partita trovata per questa giornata';
  end if;

  -- 1. Risultati ufficiali derivati dalle fixtures (1X2).
  insert into public.match_results (event_id, league_id, round, kind, outcome, home_goals, away_goals)
  select f.event_id, f.league_id, f.round, 'match',
         case when f.home_score > f.away_score then '1'
              when f.home_score < f.away_score then '2'
              else 'X' end,
         f.home_score, f.away_score
    from public.fixtures f
   where f.league_id = p_league_id and f.round = p_round
  on conflict (event_id) do update
    set outcome    = excluded.outcome,
        home_goals = excluded.home_goals,
        away_goals = excluded.away_goals,
        settled_at = now();

  -- 2. Punti (Art. 8).
  perform public.settle_round(p_league_id, p_round);

  -- 3. Montepremi trasparente: base + iscritti × quota (Art. 9).
  select count(distinct b.user_id) into v_entrants
    from public.bets b
   where b.league_id = p_league_id and b.round = p_round;
  v_pot := coalesce(p_base_pool, 0) + v_entrants * coalesce(p_per_entrant, 0);

  insert into public.round_pots (round_key, league_id, round, prize_pool)
  values (v_key, p_league_id, p_round, v_pot)
  on conflict (round_key) do update
    set prize_pool = excluded.prize_pool
    where public.round_pots.distributed = false;

  -- 4. Distribuzione (fallisce se già distribuito: niente doppi pagamenti).
  perform public.distribute_round_pot(p_league_id, p_round);

  return query
  select
    v_entrants,
    v_pot,
    (select count(distinct bp.user_id)::int from public.bet_payouts bp where bp.round_key = v_key),
    (select coalesce(sum(bp.amount),0)::bigint from public.bet_payouts bp where bp.round_key = v_key);
end;
$func$;

grant execute on function public.admin_close_round(text, int, bigint, bigint) to authenticated;

-- ---------- Le mie schedine: aggiungi punti e vincite ----------

drop function if exists public.list_my_bets();
create or replace function public.list_my_bets()
returns table (
  bet_id bigint,
  league_id text,
  round int,
  funnies_awarded int,
  created_at timestamptz,
  first_kickoff_at timestamptz,
  editable boolean,
  picks jsonb,
  points int,
  payout bigint,
  settled boolean
)
language plpgsql
security definer
set search_path = public
as $func$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'devi essere loggato';
  end if;

  return query
  select
    b.id,
    b.league_id,
    b.round,
    b.funnies_awarded,
    b.submitted_at,
    (select min(f.kickoff_at)
       from public.fixtures f
      where f.league_id = b.league_id
        and f.round     = b.round) as first_kickoff_at,
    coalesce(
      (select min(f.kickoff_at) > (now() + interval '60 seconds')
         from public.fixtures f
        where f.league_id = b.league_id
          and f.round     = b.round),
      false
    ) as editable,
    coalesce(
      (select jsonb_agg(
                jsonb_build_object('event_id', p.event_id, 'outcome', p.outcome)
                order by p.id)
         from public.bet_picks p
        where p.bet_id = b.id),
      '[]'::jsonb
    ) as picks,
    coalesce(
      (select sum(bs.points)::int from public.bet_scores bs where bs.bet_id = b.id),
      0
    ) as points,
    coalesce(
      (select sum(bp2.amount)::bigint
         from public.bet_payouts bp2
        where bp2.user_id = v_uid
          and bp2.round_key = b.league_id || ':' || b.round::text),
      0
    ) as payout,
    exists (select 1 from public.bet_scores bs where bs.bet_id = b.id) as settled
  from public.bets b
  where b.user_id = v_uid
  order by b.submitted_at desc;
end;
$func$;

grant execute on function public.list_my_bets() to authenticated;

-- ---------- Hardening: niente accesso anon alle RPC sensibili ----------

revoke execute on function public.settle_round(text, int)                       from anon;
revoke execute on function public.distribute_round_pot(text, int)               from anon;
revoke execute on function public.admin_close_round(text, int, bigint, bigint)  from anon;
revoke execute on function public.list_my_bets()                                from anon;
revoke execute on function public.delete_my_bet(bigint)                         from anon;

-- ---------- Anti-cheat: lockout server-side automatico ----------
-- submit_bet rifiuta le giocate dopo il primo kickoff della giornata SOLO
-- se round_schedule ha la riga. Questo trigger la mantiene allineata alle
-- fixtures, così ogni import (manuale o da TheSportsDB) attiva il lockout.

create or replace function public.sync_round_schedule()
returns trigger
language plpgsql
security definer
set search_path = public
as $func$
begin
  if new.round is not null then
    insert into public.round_schedule (league_id, round, kickoff_at)
    select new.league_id, new.round, min(f.kickoff_at)
      from public.fixtures f
     where f.league_id = new.league_id and f.round = new.round
     group by 1, 2
    on conflict (league_id, round) do update
      set kickoff_at = excluded.kickoff_at;
  end if;
  return new;
end;
$func$;

drop trigger if exists fixtures_sync_schedule on public.fixtures;
create trigger fixtures_sync_schedule
  after insert or update of kickoff_at, round on public.fixtures
  for each row execute function public.sync_round_schedule();

-- Backfill per le giornate già caricate.
insert into public.round_schedule (league_id, round, kickoff_at)
select league_id, round, min(kickoff_at)
  from public.fixtures
 where round is not null
 group by league_id, round
on conflict (league_id, round) do update
  set kickoff_at = excluded.kickoff_at;
