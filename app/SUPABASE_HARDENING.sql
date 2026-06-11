-- ================================================================
-- Bet4Fun — Hardening privilegi funzioni + policy mancanti.
--
-- Risolve le segnalazioni dello scanner sicurezza Supabase:
--   • 27 funzioni SECURITY DEFINER eseguibili da `anon`
--   • monthly_challenges con RLS ma senza policy
--   • scritture admin via tabella (form legacy) senza policy
--
-- Incolla in Supabase → SQL Editor → Run. Idempotente.
-- ================================================================

-- 1) Azzera ogni EXECUTE ereditato da PUBLIC/anon/authenticated.
revoke execute on all functions in schema public from public;
revoke execute on all functions in schema public from anon;
revoke execute on all functions in schema public from authenticated;

-- 2) Le uniche funzioni davvero pubbliche (calendario, conteggi):
grant execute on function public.list_fixtures_by_league(text)      to anon, authenticated;
grant execute on function public.count_round_entrants(text, int)    to anon, authenticated;

-- 3) Funzioni per utenti loggati:
grant execute on function public.submit_bet(text, int, jsonb)                       to authenticated;
grant execute on function public.list_my_bets()                                     to authenticated;
grant execute on function public.delete_my_bet(bigint)                              to authenticated;
grant execute on function public.create_group(text, text)                           to authenticated;
grant execute on function public.join_group_by_code(text)                           to authenticated;
grant execute on function public.list_my_groups()                                   to authenticated;
grant execute on function public.group_leaderboard(uuid)                            to authenticated;
grant execute on function public.leave_group(uuid)                                  to authenticated;
grant execute on function public.list_lead_campaigns()                              to authenticated;
grant execute on function public.submit_lead(uuid, jsonb, text, text)               to authenticated;
grant execute on function public.set_consent(text, boolean, text)                   to authenticated;
grant execute on function public.public_profile(text)                               to authenticated;
grant execute on function public.global_leaderboard()                               to authenticated;
grant execute on function public.monthly_challenge_state()                          to authenticated;
grant execute on function public.is_admin(uuid)                                     to authenticated;

-- 4) Funzioni admin (controllo is_admin interno):
grant execute on function public.admin_list_fixtures(text, int)                     to authenticated;
grant execute on function public.admin_upsert_fixture(text, text, int, text, text, timestamptz, int, int, text) to authenticated;
grant execute on function public.admin_delete_fixture(text)                         to authenticated;
grant execute on function public.admin_list_lead_campaigns()                        to authenticated;
grant execute on function public.admin_upsert_lead_campaign(uuid, text, text, text, int, jsonb, text, text, boolean) to authenticated;
grant execute on function public.admin_toggle_lead_campaign(uuid, boolean)          to authenticated;
grant execute on function public.admin_delete_lead_campaign(uuid)                   to authenticated;
grant execute on function public.settle_round(text, int)                            to authenticated;
grant execute on function public.distribute_round_pot(text, int)                    to authenticated;
grant execute on function public.admin_close_round(text, int, bigint, bigint)       to authenticated;

-- 5) handle_new_user / touch_last_seen: nessun grant — girano solo
--    internamente (trigger / dentro funzioni security definer).

-- 6) Il backend Supabase mantiene pieno accesso:
grant execute on all functions in schema public to service_role;

-- 7) monthly_challenges: lettura pubblica (il montepremi è trasparente).
drop policy if exists "challenges public read" on public.monthly_challenges;
create policy "challenges public read" on public.monthly_challenges
  for select using (true);

-- 8) Scritture admin via tabella (form legacy del pannello admin):
drop policy if exists "results admin write" on public.match_results;
create policy "results admin write" on public.match_results
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "pots admin write" on public.round_pots;
create policy "pots admin write" on public.round_pots
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "schedule admin write" on public.round_schedule;
create policy "schedule admin write" on public.round_schedule
  for all using (public.is_admin()) with check (public.is_admin());

-- 9) Lock di due funzioni che muovono Funnies e NON devono essere esposte:
--    • _distribute_pool: helper interno con SQL dinamico (chiamato da
--      admin_close_month/season). Richiamabile dall'esterno = arbitrary SQL.
--    • settle_duels: regola la posta delle sfide (chiamata da admin_close_round).
--    Le chiamate interne (da funzioni SECURITY DEFINER owner=postgres) restano
--    valide perché girano coi privilegi del proprietario.
revoke execute on function public._distribute_pool(bigint, text, text, text) from public, anon, authenticated;
revoke execute on function public.settle_duels(text, int) from public, anon, authenticated;
-- settle_duels ha anche una guardia is_admin interna (difesa in profondità).

-- 10) Backstop: nessun EXECUTE ereditato da PUBLIC sulle future funzioni.
alter default privileges in schema public revoke execute on functions from public;

-- ================================================================
-- NOTA: una segnalazione non risolvibile via SQL:
--   "Leaked password protection disabled"
-- Va attivata dal dashboard:
--   Authentication → Sign In / Up → Passwords →
--   ✓ Prevent use of leaked passwords (HaveIBeenPwned)
-- ================================================================
