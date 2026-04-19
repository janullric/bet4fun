-- ================================================================
-- Bet4Fun — RPCs per "Le mie schedine"
--
-- Incolla questo blocco in Supabase → SQL Editor → Run (una sola volta).
-- Richiede che siano già stati creati:
--   • public.bets / public.bet_picks (SUPABASE_SETUP.md §3)
--   • public.fixtures                (SUPABASE_FIXTURES.sql)
--   • public.profiles (con colonna funnies int)
--
-- Espone due RPC:
--   • list_my_bets()             → elenco delle schedine dell'utente
--                                   con picks aggregati e flag "editable"
--   • delete_my_bet(p_bet_id)    → cancella una schedina dell'utente,
--                                   rimborsa i funnies e sblocca il round
--                                   (solo se il primo kickoff è futuro)
-- ================================================================

create or replace function public.list_my_bets()
returns table (
  bet_id bigint,
  league_id text,
  round int,
  funnies_awarded int,
  created_at timestamptz,
  first_kickoff_at timestamptz,
  editable boolean,
  picks jsonb
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
    b.created_at,
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
    ) as picks
  from public.bets b
  where b.user_id = v_uid
  order by b.created_at desc;
end;
$func$;

grant execute on function public.list_my_bets() to authenticated;


create or replace function public.delete_my_bet(p_bet_id bigint)
returns boolean
language plpgsql
security definer
set search_path = public
as $func$
declare
  v_uid     uuid := auth.uid();
  v_league  text;
  v_round   int;
  v_funnies int;
  v_first   timestamptz;
begin
  if v_uid is null then
    raise exception 'devi essere loggato';
  end if;

  v_league  := (select league_id       from public.bets where id = p_bet_id and user_id = v_uid);
  v_round   := (select round           from public.bets where id = p_bet_id and user_id = v_uid);
  v_funnies := (select funnies_awarded from public.bets where id = p_bet_id and user_id = v_uid);

  if v_league is null then
    raise exception 'schedina non trovata';
  end if;

  v_first := (select min(kickoff_at)
                from public.fixtures
               where league_id = v_league
                 and round     = v_round);

  if v_first is not null and now() + interval '60 seconds' >= v_first then
    raise exception 'giornata chiusa: non puoi più modificare questa schedina';
  end if;

  update public.profiles
     set funnies = greatest(0, coalesce(funnies,0) - coalesce(v_funnies,0))
   where id = v_uid;

  delete from public.bets where id = p_bet_id;

  return true;
end;
$func$;

grant execute on function public.delete_my_bet(bigint) to authenticated;
