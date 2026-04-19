-- ================================================================
-- Bet4Fun — Bootstrap admin (HARDENED)
--
-- ⚠️  Obiettivo: SOLO IL PROPRIETARIO dell'app deve poter diventare
-- admin. Dopo il primo utilizzo, la funzione si auto-distrugge e
-- nessun altro potrà mai promuoversi, nemmeno conoscendo la passphrase.
--
-- Protezioni in ordine:
--   1. Devi essere loggato (auth.uid() non nullo)
--   2. Nessun admin deve esistere già (one-shot)
--   3. (opzionale) L'email dell'account loggato deve combaciare con
--      quella impostata in v_allowed_email
--   4. Passphrase corretta (v_expected)
--   5. Dopo successo: DROP FUNCTION self → la RPC sparisce per sempre
--
-- Istruzioni:
--   • CAMBIA la passphrase (v_expected)
--   • OPZIONALE ma consigliato: imposta v_allowed_email sulla TUA email
--   • Incolla tutto in Supabase → SQL Editor → Run
--   • Vai su /admin, inserisci la passphrase → diventi admin
--   • La funzione scompare da sola: nessun altro potrà più usarla
-- ================================================================

create or replace function public.bootstrap_admin(p_secret text)
returns boolean
language plpgsql
security definer
set search_path = public
as $func$
declare
  v_uid   uuid := auth.uid();
  v_email text;
  -- >>> CAMBIA QUESTA PASSPHRASE <<<
  v_expected text := 'cambia-subito-questa-frase-lunga-almeno-32-caratteri';
  -- >>> OPZIONALE: metti la TUA email qui per bloccarla al tuo account.
  --     Lascia NULL se non vuoi il controllo email.
  v_allowed_email text := null;  -- es.: 'tuonome@esempio.com'
begin
  -- 1. Devi essere loggato
  if v_uid is null then
    raise exception 'devi essere loggato';
  end if;

  -- 2. One-shot: se esiste già un admin, blocca tutto
  if exists (select 1 from public.profiles where is_admin = true) then
    raise exception 'admin già assegnato: bootstrap disabilitato';
  end if;

  -- 3. Opzionale: lock sull'email
  if v_allowed_email is not null then
    v_email := (select email from auth.users where id = v_uid);
    if v_email is null or lower(v_email) <> lower(v_allowed_email) then
      raise exception 'account non autorizzato';
    end if;
  end if;

  -- 4. Passphrase
  if p_secret is null or length(p_secret) < 10 or p_secret <> v_expected then
    raise exception 'passphrase errata';
  end if;

  -- Promuovi
  update public.profiles set is_admin = true where id = v_uid;

  -- 5. Auto-distruzione: la funzione non esisterà più dopo questo commit.
  --    Nessun altro utente potrà mai più chiamarla, nemmeno con la passphrase.
  execute 'drop function public.bootstrap_admin(text)';

  return true;
end;
$func$;

grant execute on function public.bootstrap_admin(text) to authenticated;

-- Dopo il tuo primo login come admin, controlla con questa query che
-- la funzione sia sparita (deve restituire 0 righe):
--
--   select proname from pg_proc where proname = 'bootstrap_admin';
--
-- Se per qualche motivo vuoi rimuoverla manualmente senza usarla:
--
--   drop function public.bootstrap_admin(text);
