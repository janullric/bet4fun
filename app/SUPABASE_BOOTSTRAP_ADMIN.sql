-- ================================================================
-- Bet4Fun — Bootstrap admin via passphrase.
--
-- Incolla questo blocco UNA VOLTA in Supabase → SQL Editor → Run.
-- Dopo, sulla schermata /admin dell'app troverai un form
-- "Sblocca admin": inserendo la passphrase qui sotto, il tuo
-- account utente attuale viene promosso a admin (is_admin=true).
--
-- ⚠️  CAMBIA la passphrase sotto PRIMA di eseguire questo blocco.
-- Serve a chiunque voglia diventare admin dalla tua app live,
-- quindi deve essere segreta e lunga.
-- ================================================================

create or replace function public.bootstrap_admin(p_secret text)
returns boolean
language plpgsql
security definer
set search_path = public
as $func$
declare
  v_uid uuid := auth.uid();
  -- >>> CAMBIA QUESTA STRINGA <<<
  v_expected text := 'cambia-subito-questa-frase-lunga-almeno-32-caratteri';
begin
  if v_uid is null then
    raise exception 'devi essere loggato';
  end if;
  if p_secret is null or length(p_secret) < 10 or p_secret <> v_expected then
    raise exception 'passphrase errata';
  end if;
  update public.profiles set is_admin = true where id = v_uid;
  return true;
end;
$func$;

grant execute on function public.bootstrap_admin(text) to authenticated;

-- Dopo aver usato il bootstrap e essere diventato admin, se vuoi
-- disattivarlo per sempre (così nessun altro può mai promuoversi),
-- esegui:
--
--   drop function public.bootstrap_admin(text);
