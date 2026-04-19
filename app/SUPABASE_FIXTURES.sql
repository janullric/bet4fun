-- ================================================================
-- Bet4Fun — Fixtures (sostituto di TheSportsDB) + entrants counter.
--
-- Paste-once: esegui una sola volta in Supabase → SQL Editor → Run.
-- Dopo questo, tutta la gestione partite avviene dal pannello Admin
-- dell'app ("Giornate & partite"): non dovrai più tornare qui.
--
-- Perché esiste: il free tier di TheSportsDB è rate-limited (errore
-- 1015 da Cloudflare) e la UI mostrava "Prossime Manches" vuoto. Con
-- questa tabella le partite vivono sul nostro Supabase e sono sotto
-- controllo editoriale.
-- ================================================================

-- Partite di ogni giornata. event_id è libero (es. "serieA-34-inter-milan")
-- se crei manualmente, oppure l'id TheSportsDB se importi.
create table if not exists public.fixtures (
  event_id      text primary key,
  league_id     text not null,
  round         int,
  home          text not null,
  away          text not null,
  kickoff_at    timestamptz not null,
  home_score    int,
  away_score    int,
  status        text not null default 'scheduled',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists fixtures_league_round_idx on public.fixtures(league_id, round);
create index if not exists fixtures_kickoff_idx      on public.fixtures(kickoff_at);

alter table public.fixtures enable row level security;
drop policy if exists "fixtures public read" on public.fixtures;
create policy "fixtures public read" on public.fixtures for select using (true);

-- Lista pubblica (usata dall'app quando il client legge le prossime partite).
create or replace function public.list_fixtures_by_league(p_league_id text)
returns setof public.fixtures
language sql stable
set search_path = public
as $func$
  select * from public.fixtures
  where league_id = p_league_id
  order by kickoff_at
$func$;

-- Lista per l'admin (l'admin può vedere tutto, filtrabile per round).
create or replace function public.admin_list_fixtures(
  p_league_id text,
  p_round int default null
)
returns setof public.fixtures
language plpgsql
security definer
set search_path = public
as $func$
begin
  if not public.is_admin() then raise exception 'not an admin'; end if;
  if p_round is null then
    return query select * from public.fixtures where league_id = p_league_id order by kickoff_at;
  else
    return query select * from public.fixtures where league_id = p_league_id and round = p_round order by kickoff_at;
  end if;
end;
$func$;

create or replace function public.admin_upsert_fixture(
  p_event_id    text,
  p_league_id   text,
  p_round       int,
  p_home        text,
  p_away        text,
  p_kickoff_at  timestamptz,
  p_home_score  int default null,
  p_away_score  int default null,
  p_status      text default 'scheduled'
)
returns public.fixtures
language plpgsql
security definer
set search_path = public
as $func$
declare v_row public.fixtures%rowtype;
begin
  if not public.is_admin() then raise exception 'not an admin'; end if;
  insert into public.fixtures (
    event_id, league_id, round, home, away, kickoff_at,
    home_score, away_score, status, updated_at
  )
  values (
    p_event_id, p_league_id, p_round, p_home, p_away, p_kickoff_at,
    p_home_score, p_away_score, coalesce(p_status, 'scheduled'), now()
  )
  on conflict (event_id) do update set
    league_id  = excluded.league_id,
    round      = excluded.round,
    home       = excluded.home,
    away       = excluded.away,
    kickoff_at = excluded.kickoff_at,
    home_score = excluded.home_score,
    away_score = excluded.away_score,
    status     = excluded.status,
    updated_at = now()
  returning * into v_row;
  return v_row;
end;
$func$;

create or replace function public.admin_delete_fixture(p_event_id text)
returns void
language plpgsql
security definer
set search_path = public
as $func$
begin
  if not public.is_admin() then raise exception 'not an admin'; end if;
  delete from public.fixtures where event_id = p_event_id;
end;
$func$;

-- ================================================================
-- Art. 9 — montepremi trasparente
--
-- Conta gli utenti distinti che hanno già giocato una schedina per
-- quella giornata. L'app somma `base + entrants × per_entrant` e lo
-- mostra in chiaro sulla card. Quando l'admin chiama `settle_round`
-- il monte premi viene congelato in round_pots.
-- ================================================================
create or replace function public.count_round_entrants(p_league_id text, p_round int)
returns int
language sql stable
set search_path = public
as $func$
  select coalesce(count(distinct b.user_id), 0)::int
  from public.bets b
  where b.league_id = p_league_id
    and coalesce(b.round, -1) = coalesce(p_round, -1)
$func$;

-- Grant per RPC pubbliche.
grant execute on function public.list_fixtures_by_league(text) to anon, authenticated;
grant execute on function public.count_round_entrants(text, int) to anon, authenticated;

-- Grant per RPC admin (il check `is_admin` avviene dentro la funzione).
grant execute on function public.admin_list_fixtures(text, int) to authenticated;
grant execute on function public.admin_upsert_fixture(text, text, int, text, text, timestamptz, int, int, text) to authenticated;
grant execute on function public.admin_delete_fixture(text) to authenticated;
