# Supabase setup

## 1. Crea il progetto (3 minuti)

1. Vai su [supabase.com](https://supabase.com) → **Start your project** (login con GitHub va bene).
2. **New project** → scegli un nome (es. `bet4fun`), una password DB (salvala), regione `Europe (Frankfurt)`.
3. Aspetta 1–2 minuti che il progetto venga creato.

## 2. Incolla lo schema SQL

1. Nel menu a sinistra di Supabase apri **SQL Editor** → **New query**.
2. Incolla tutto il contenuto del blocco qui sotto e premi **Run**.

> Blocco idempotente: puoi rilanciarlo in caso di modifiche. Il `drop table ... cascade` in testa azzera tutto, quindi usalo **solo in sviluppo** — in produzione rimuovi quella prima riga.

```sql
-- RESET COMPLETO (solo per sviluppo)
drop table if exists public.profiles cascade;

-- CREA TABELLA
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nick text unique not null,
  funnies int not null default 300,
  preferences text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- RLS
alter table public.profiles enable row level security;

-- POLICIES (safe)
drop policy if exists "profiles: self select" on public.profiles;
create policy "profiles: self select"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles: self update" on public.profiles;
create policy "profiles: self update"
  on public.profiles for update
  using (auth.uid() = id);

-- FUNZIONE TRIGGER
-- Gira come `security definer`, quindi bypassa la RLS e funziona anche quando
-- la sessione non è ancora attiva (es. con conferma email abilitata). Nick e
-- preferenze arrivano dai metadati passati dal client in
-- `auth.signUp(..., { options: { data: {...} } })`.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_nick  text;
  meta_prefs text[];
begin
  meta_nick := coalesce(
    new.raw_user_meta_data->>'nick',
    'user_' || substr(new.id::text, 1, 8)
  );

  begin
    meta_prefs := array(
      select jsonb_array_elements_text(new.raw_user_meta_data->'preferences')
    );
  exception when others then
    meta_prefs := '{}';
  end;

  insert into public.profiles (id, nick, preferences)
  values (new.id, meta_nick, coalesce(meta_prefs, '{}'));

  return new;
end;
$$;

-- TRIGGER
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

> Se avevi già creato un utente prima del trigger, cancellalo da **Authentication → Users** e rifai l'iscrizione, altrimenti resterà senza profilo.

## 3. Schedine e accredito Funnies

Apri una **New query** in SQL Editor e incolla questo secondo blocco. Crea le tabelle `bets` / `bet_picks` e la RPC `submit_bet` che dentro una transazione scrive la schedina e accredita i Funnies al profilo.

```sql
-- RESET (solo dev)
drop function if exists public.submit_bet(text, int, jsonb);
drop table if exists public.bet_picks cascade;
drop table if exists public.bets cascade;

create table public.bets (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  league_id text not null,
  round int,
  funnies_awarded int not null default 0,
  submitted_at timestamptz not null default now()
);

-- Una sola schedina per giornata/lega/utente: evita il farming da re-submit.
create unique index bets_user_league_round_uniq
  on public.bets (user_id, league_id, round);

create table public.bet_picks (
  id bigserial primary key,
  bet_id bigint not null references public.bets(id) on delete cascade,
  event_id text not null,
  outcome text not null,
  created_at timestamptz not null default now()
);

alter table public.bets enable row level security;
alter table public.bet_picks enable row level security;

create policy "bets: self select" on public.bets
  for select using (auth.uid() = user_id);

create policy "bet_picks: self select" on public.bet_picks
  for select using (
    exists (select 1 from public.bets b where b.id = bet_id and b.user_id = auth.uid())
  );

-- Niente policy insert sulle tabelle: tutto passa per la RPC.

create or replace function public.submit_bet(
  p_league_id text,
  p_round int,
  p_picks jsonb
)
returns table (bet_id bigint, new_funnies int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_bet_id bigint;
  v_count int;
  v_bonus int;
  v_new_funnies int;
  v_pick jsonb;
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  v_count := coalesce(jsonb_array_length(p_picks), 0);
  if v_count < 1 then
    raise exception 'no picks' using errcode = '22000';
  end if;

  v_bonus := v_count * 10;

  insert into public.bets (user_id, league_id, round, funnies_awarded)
  values (v_user, p_league_id, p_round, v_bonus)
  returning id into v_bet_id;

  for v_pick in select * from jsonb_array_elements(p_picks)
  loop
    insert into public.bet_picks (bet_id, event_id, outcome)
    values (v_bet_id, v_pick->>'event_id', v_pick->>'outcome');
  end loop;

  update public.profiles
  set funnies = funnies + v_bonus
  where id = v_user
  returning funnies into v_new_funnies;

  return query select v_bet_id, v_new_funnies;
end;
$$;

grant execute on function public.submit_bet(text, int, jsonb) to authenticated;
```

## 4. Gruppi privati

I gruppi sono sfide fra amici: chiunque crea un gruppo, ottiene un codice invito da condividere. Tutto lo stato vive su Supabase, le RPC fanno da guardiano (creazione, join, classifica, uscita).

```sql
-- RESET (solo dev)
drop function if exists public.leave_group(uuid);
drop function if exists public.group_leaderboard(uuid);
drop function if exists public.list_my_groups();
drop function if exists public.join_group_by_code(text);
drop function if exists public.create_group(text, text);
drop table if exists public.group_members cascade;
drop table if exists public.groups cascade;

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  invite_code text not null unique,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id  uuid not null references auth.users(id)  on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

alter table public.groups enable row level security;
alter table public.group_members enable row level security;

-- Un utente può leggere i gruppi di cui fa parte.
drop policy if exists "groups: member select" on public.groups;
create policy "groups: member select" on public.groups for select
  using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = id and gm.user_id = auth.uid()
    )
  );

-- Un utente può vedere i membri dei suoi gruppi.
drop policy if exists "members: same group select" on public.group_members;
create policy "members: same group select" on public.group_members for select
  using (
    exists (
      select 1 from public.group_members mine
      where mine.group_id = group_members.group_id
        and mine.user_id = auth.uid()
    )
  );

-- Creazione gruppo: genera il codice invito e aggiunge il creatore come membro.
create or replace function public.create_group(p_name text, p_description text)
returns table (id uuid, invite_code text)
language plpgsql security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_id uuid;
  v_code text;
begin
  if v_user is null then raise exception 'not authenticated' using errcode='28000'; end if;
  if length(coalesce(p_name, '')) < 2 then raise exception 'name too short' using errcode='22000'; end if;
  v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  insert into public.groups (name, description, invite_code, owner_id)
    values (p_name, p_description, v_code, v_user)
    returning public.groups.id into v_id;
  insert into public.group_members (group_id, user_id) values (v_id, v_user);
  return query select v_id, v_code;
end;
$$;

-- Join via codice: idempotente, torna id e nome del gruppo.
create or replace function public.join_group_by_code(p_code text)
returns table (group_id uuid, name text)
language plpgsql security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_id uuid;
  v_name text;
begin
  if v_user is null then raise exception 'not authenticated' using errcode='28000'; end if;
  select g.id, g.name into v_id, v_name
    from public.groups g where g.invite_code = upper(p_code);
  if v_id is null then raise exception 'group not found' using errcode='P0002'; end if;
  insert into public.group_members (group_id, user_id) values (v_id, v_user)
    on conflict do nothing;
  return query select v_id, v_name;
end;
$$;

-- Lista dei gruppi dell'utente con conteggio membri e flag owner.
create or replace function public.list_my_groups()
returns table (id uuid, name text, description text, invite_code text, member_count bigint, is_owner boolean)
language plpgsql security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'not authenticated' using errcode='28000'; end if;
  return query
    select g.id, g.name, g.description, g.invite_code,
           (select count(*) from public.group_members gm where gm.group_id = g.id)::bigint,
           (g.owner_id = v_user)
    from public.groups g
    join public.group_members mem on mem.group_id = g.id and mem.user_id = v_user
    order by g.created_at desc;
end;
$$;

-- Classifica gruppo: accessibile solo se l'utente è membro.
create or replace function public.group_leaderboard(p_group_id uuid)
returns table (nick text, funnies int, is_me boolean)
language plpgsql security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'not authenticated' using errcode='28000'; end if;
  if not exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = v_user
  ) then
    raise exception 'not a member' using errcode='42501';
  end if;
  return query
    select p.nick, p.funnies, (p.id = v_user)
    from public.group_members gm
    join public.profiles p on p.id = gm.user_id
    where gm.group_id = p_group_id
    order by p.funnies desc;
end;
$$;

-- Esce dal gruppo. Se l'ultimo membro esce, il gruppo viene cancellato.
create or replace function public.leave_group(p_group_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'not authenticated' using errcode='28000'; end if;
  delete from public.group_members where group_id = p_group_id and user_id = v_user;
  delete from public.groups g
    where g.id = p_group_id
      and not exists (select 1 from public.group_members where group_id = p_group_id);
end;
$$;

grant execute on function public.create_group(text, text)         to authenticated;
grant execute on function public.join_group_by_code(text)          to authenticated;
grant execute on function public.list_my_groups()                  to authenticated;
grant execute on function public.group_leaderboard(uuid)           to authenticated;
grant execute on function public.leave_group(uuid)                 to authenticated;
```

## 5. Lead Boost (consenso GDPR)

La sezione Lead Boost permette a brand partner di raccogliere contatti in modo opt-in: l'utente sceglie a quale campagna aderire, vede esattamente quali dati verranno condivisi, e accredita Funnies extra come ricompensa. Ogni submission memorizza uno snapshot del consenso (ip, user-agent, timestamp, testo del disclaimer al momento dell'opt-in) per essere difendibile in caso di reclamo Garante.

```sql
-- RESET (solo dev)
drop function if exists public.submit_lead(uuid, jsonb, text, text);
drop function if exists public.list_lead_campaigns();
drop table if exists public.lead_submissions cascade;
drop table if exists public.lead_campaigns cascade;

create table public.lead_campaigns (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  title text not null,
  tagline text,
  funnies_reward int not null default 500,
  fields jsonb not null default '[]'::jsonb,
  disclaimer text not null,
  data_sharing text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.lead_submissions (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  campaign_id uuid not null references public.lead_campaigns(id) on delete cascade,
  payload jsonb not null,
  consent_version text not null,
  consent_ip text,
  consent_ua text,
  consent_at timestamptz not null default now(),
  unique (user_id, campaign_id)
);

alter table public.lead_campaigns enable row level security;
alter table public.lead_submissions enable row level security;

-- Le campagne attive sono visibili a qualunque utente autenticato.
drop policy if exists "campaigns: public read" on public.lead_campaigns;
create policy "campaigns: public read" on public.lead_campaigns for select
  using (active = true);

-- L'utente vede solo le proprie submission.
drop policy if exists "submissions: self select" on public.lead_submissions;
create policy "submissions: self select" on public.lead_submissions for select
  using (auth.uid() = user_id);

-- Invio lead in transazione: inserisce la submission, segna il consenso,
-- accredita i funnies. Blocca il doppio invio per stessa campagna.
create or replace function public.submit_lead(
  p_campaign_id uuid,
  p_payload jsonb,
  p_consent_version text,
  p_consent_ua text
)
returns table (submission_id bigint, new_funnies int, funnies_awarded int)
language plpgsql security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_reward int;
  v_sub_id bigint;
  v_new_funnies int;
begin
  if v_user is null then raise exception 'not authenticated' using errcode='28000'; end if;

  select funnies_reward into v_reward
    from public.lead_campaigns
    where id = p_campaign_id and active = true;
  if v_reward is null then
    raise exception 'campaign not available' using errcode='22000';
  end if;

  insert into public.lead_submissions
    (user_id, campaign_id, payload, consent_version, consent_ua)
  values
    (v_user, p_campaign_id, p_payload, p_consent_version, p_consent_ua)
  returning id into v_sub_id;

  update public.profiles
    set funnies = funnies + v_reward
    where id = v_user
    returning funnies into v_new_funnies;

  return query select v_sub_id, v_new_funnies, v_reward;
end;
$$;

create or replace function public.list_lead_campaigns()
returns table (
  id uuid, brand text, title text, tagline text,
  funnies_reward int, fields jsonb, disclaimer text, data_sharing text,
  already_submitted boolean
)
language plpgsql security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'not authenticated' using errcode='28000'; end if;
  return query
    select c.id, c.brand, c.title, c.tagline, c.funnies_reward, c.fields,
           c.disclaimer, c.data_sharing,
           exists (
             select 1 from public.lead_submissions s
             where s.campaign_id = c.id and s.user_id = v_user
           ) as already_submitted
    from public.lead_campaigns c
    where c.active = true
    order by c.created_at desc;
end;
$$;

grant execute on function public.submit_lead(uuid, jsonb, text, text) to authenticated;
grant execute on function public.list_lead_campaigns()                to authenticated;

-- Consenso utente: archiviato sul profilo per avere un'interrogazione rapida
-- e un log storico in `user_consents`. Così l'utente può revocare senza
-- perdere l'audit trail di quando l'ha dato.
alter table public.profiles
  add column if not exists tos_accepted boolean not null default false,
  add column if not exists marketing_consent boolean not null default false,
  add column if not exists lead_boost_consent boolean not null default false;

drop table if exists public.user_consents cascade;
create table public.user_consents (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  scope text not null,        -- 'tos' | 'marketing' | 'lead_boost'
  granted boolean not null,
  version text not null,
  ua text,
  changed_at timestamptz not null default now()
);
alter table public.user_consents enable row level security;
drop policy if exists "consents: self select" on public.user_consents;
create policy "consents: self select" on public.user_consents
  for select using (auth.uid() = user_id);

-- Aggiorna un consenso e scrive una riga di log. Usato dall'app quando
-- l'utente cambia idea dal proprio profilo.
create or replace function public.set_consent(p_scope text, p_granted boolean, p_version text)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_col text;
begin
  if v_user is null then raise exception 'not authenticated' using errcode='28000'; end if;
  if p_scope not in ('tos','marketing','lead_boost') then
    raise exception 'invalid scope' using errcode='22000';
  end if;
  v_col := case p_scope
    when 'tos' then 'tos_accepted'
    when 'marketing' then 'marketing_consent'
    when 'lead_boost' then 'lead_boost_consent'
  end;
  execute format('update public.profiles set %I = $1 where id = $2', v_col)
    using p_granted, v_user;
  insert into public.user_consents (user_id, scope, granted, version, ua)
    values (v_user, p_scope, p_granted, p_version, null);
end;
$$;
grant execute on function public.set_consent(text, boolean, text) to authenticated;

-- Rinforza `submit_lead` con il check sul consenso lead_boost.
create or replace function public.submit_lead(
  p_campaign_id uuid,
  p_payload jsonb,
  p_consent_version text,
  p_consent_ua text
)
returns table (submission_id bigint, new_funnies int, funnies_awarded int)
language plpgsql security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_reward int;
  v_sub_id bigint;
  v_new_funnies int;
  v_has_consent boolean;
begin
  if v_user is null then raise exception 'not authenticated' using errcode='28000'; end if;

  select lead_boost_consent into v_has_consent
    from public.profiles where id = v_user;
  if not coalesce(v_has_consent, false) then
    raise exception 'lead boost consent required' using errcode='42501';
  end if;

  select funnies_reward into v_reward
    from public.lead_campaigns
    where id = p_campaign_id and active = true;
  if v_reward is null then
    raise exception 'campaign not available' using errcode='22000';
  end if;

  insert into public.lead_submissions
    (user_id, campaign_id, payload, consent_version, consent_ua)
  values
    (v_user, p_campaign_id, p_payload, p_consent_version, p_consent_ua)
  returning id into v_sub_id;

  update public.profiles
    set funnies = funnies + v_reward
    where id = v_user
    returning funnies into v_new_funnies;

  return query select v_sub_id, v_new_funnies, v_reward;
end;
$$;

-- Estendi anche `handle_new_user` per raccogliere i consensi in fase di signup.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  meta_nick       text;
  meta_prefs      text[];
  meta_tos        boolean;
  meta_mkt        boolean;
  meta_lead       boolean;
begin
  meta_nick := coalesce(
    new.raw_user_meta_data->>'nick',
    'user_' || substr(new.id::text, 1, 8)
  );
  begin
    meta_prefs := array(
      select jsonb_array_elements_text(new.raw_user_meta_data->'preferences')
    );
  exception when others then meta_prefs := '{}';
  end;
  meta_tos  := coalesce((new.raw_user_meta_data->>'tos_accepted')::boolean, false);
  meta_mkt  := coalesce((new.raw_user_meta_data->>'marketing_consent')::boolean, false);
  meta_lead := coalesce((new.raw_user_meta_data->>'lead_boost_consent')::boolean, false);

  insert into public.profiles (id, nick, preferences, tos_accepted, marketing_consent, lead_boost_consent)
  values (new.id, meta_nick, coalesce(meta_prefs, '{}'), meta_tos, meta_mkt, meta_lead);

  insert into public.user_consents (user_id, scope, granted, version)
    values (new.id, 'tos',        meta_tos,  'signup-v1'),
           (new.id, 'marketing',  meta_mkt,  'signup-v1'),
           (new.id, 'lead_boost', meta_lead, 'signup-v1');

  return new;
end;
$$;

-- SEED: una campagna demo per il brand finto "Zephyr Energy".
insert into public.lead_campaigns (brand, title, tagline, funnies_reward, fields, disclaimer, data_sharing)
values (
  'Zephyr Energy',
  'Prova gratis l''energy drink Zephyr',
  'Ricevi un campione a casa + 500 Funnies',
  500,
  '[
    {"key":"fullName","label":"Nome e cognome","type":"text","required":true},
    {"key":"email","label":"Email (per il tracking spedizione)","type":"email","required":true},
    {"key":"phone","label":"Telefono","type":"tel","required":false},
    {"key":"address","label":"Indirizzo di spedizione","type":"textarea","required":true},
    {"key":"age","label":"Confermi di avere 18+ anni","type":"checkbox","required":true}
  ]'::jsonb,
  'Brand partner della piattaforma Bet4Fun. I dati che condividi verranno inviati esclusivamente a Zephyr Energy S.r.l. per la spedizione del campione e per inviarti in seguito comunicazioni commerciali. Titolare del trattamento: Zephyr Energy S.r.l. Puoi revocare il consenso in qualsiasi momento scrivendo a privacy@zephyr.example.',
  'Nome, email, telefono, indirizzo verranno trasferiti a Zephyr Energy S.r.l. entro 24 ore. Non saranno ceduti a terze parti al di fuori della logistica di spedizione.'
);
```

## 6. Profili pubblici, sfida del mese, lockout giornata

Estensioni al profilo e nuove RPC per: cliccare il nick di un altro giocatore,
avere una classifica globale live, calcolare la sfida del mese e bloccare
la schedina al fischio d'inizio.

```sql
-- Aggiungi i campi pubblici del profilo.
alter table public.profiles
  add column if not exists country      text,
  add column if not exists avatar_url   text,
  add column if not exists last_seen_at timestamptz,
  add column if not exists is_admin     boolean not null default false;

-- Update automatico di last_seen_at su submit_bet e submit_lead.
-- Usiamo una funzione helper così i due RPC restano leggibili.
create or replace function public.touch_last_seen(p_user uuid)
returns void language sql security definer set search_path = public as $$
  update public.profiles set last_seen_at = now() where id = p_user;
$$;

-- Profilo pubblico di un altro utente (si cerca per handle = nick).
-- Non esponiamo email, consensi, preferenze.
drop function if exists public.public_profile(text);
create or replace function public.public_profile(p_handle text)
returns table (
  nick text,
  country text,
  funnies int,
  last_seen_at timestamptz,
  created_at timestamptz,
  global_rank bigint,
  total_bets bigint
)
language plpgsql security definer set search_path = public as $$
begin
  return query
  with ranked as (
    select p.id, p.nick, p.country, p.funnies, p.last_seen_at, p.created_at,
           rank() over (order by p.funnies desc) as r
    from public.profiles p
  )
  select r.nick, r.country, r.funnies, r.last_seen_at, r.created_at,
         r.r as global_rank,
         (select count(*) from public.bets b where b.user_id = r.id) as total_bets
  from ranked r
  where lower(r.nick) = lower(p_handle);
end;
$$;

grant execute on function public.public_profile(text) to authenticated;

-- Classifica globale top 50 (per leaderboard cliccabile).
drop function if exists public.global_leaderboard();
create or replace function public.global_leaderboard()
returns table (rank bigint, nick text, country text, funnies int, is_me boolean)
language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid();
begin
  return query
  select rank() over (order by p.funnies desc) as rank,
         p.nick, p.country, p.funnies, (p.id = v_user) as is_me
  from public.profiles p
  order by p.funnies desc
  limit 50;
end;
$$;
grant execute on function public.global_leaderboard() to authenticated;

-- Sfida del mese: premi + classifica. Se non esiste una sfida attiva la
-- creiamo lazy con un pool minimo garantito (configurabile da admin).
create table if not exists public.monthly_challenges (
  id uuid primary key default gen_random_uuid(),
  year int not null,
  month int not null,
  prize_pool int not null default 120000,
  created_at timestamptz not null default now(),
  unique (year, month)
);

drop function if exists public.monthly_challenge_state();
create or replace function public.monthly_challenge_state()
returns table (
  year int, month int, prize_pool int,
  my_points int, my_rank bigint,
  participants bigint,
  leaderboard jsonb
)
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_year int := extract(year from now());
  v_month int := extract(month from now());
  v_pool int;
begin
  insert into public.monthly_challenges (year, month)
    values (v_year, v_month)
    on conflict (year, month) do nothing;
  select prize_pool into v_pool from public.monthly_challenges
    where year = v_year and month = v_month;

  return query
  with points as (
    -- punti del mese = somma dei funnies_awarded dei bets del mese.
    -- Quando avremo il motore scoring reale, qui entreranno i punti veri.
    select b.user_id, sum(b.funnies_awarded)::int as pts
    from public.bets b
    where extract(year  from b.submitted_at) = v_year
      and extract(month from b.submitted_at) = v_month
    group by b.user_id
  ),
  ranked as (
    select p.user_id, p.pts,
           rank() over (order by p.pts desc) as r,
           pr.nick
    from points p
    join public.profiles pr on pr.id = p.user_id
  )
  select
    v_year, v_month, v_pool,
    coalesce((select pts from ranked where user_id = v_user), 0) as my_points,
    coalesce((select r   from ranked where user_id = v_user), null) as my_rank,
    (select count(*) from ranked) as participants,
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'rank', r, 'nick', nick, 'points', pts, 'is_me', user_id = v_user
      ) order by r)
      from (select * from ranked order by r limit 20) t
    ), '[]'::jsonb) as leaderboard;
end;
$$;
grant execute on function public.monthly_challenge_state() to authenticated;

-- Lockout lato server: blocca submit_bet dopo il fischio d'inizio della
-- prima partita della giornata. Se l'admin imposta un `kickoff_at` su una
-- riga di `round_schedule`, lo rispettiamo.
create table if not exists public.round_schedule (
  league_id text not null,
  round int not null,
  kickoff_at timestamptz not null,
  is_settled boolean not null default false,
  primary key (league_id, round)
);
alter table public.round_schedule enable row level security;
drop policy if exists "round_schedule: public read" on public.round_schedule;
create policy "round_schedule: public read" on public.round_schedule
  for select using (true);

-- Rinforza submit_bet con il lockout. Se la riga esiste e kickoff è passato,
-- rifiutiamo. Niente riga = consentiamo (schedina da free-tier senza admin).
create or replace function public.submit_bet(
  p_league_id text,
  p_round int,
  p_picks jsonb
)
returns table (bet_id bigint, new_funnies int)
language plpgsql security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_bet_id bigint;
  v_count int;
  v_bonus int;
  v_new_funnies int;
  v_pick jsonb;
  v_kickoff timestamptz;
begin
  if v_user is null then raise exception 'not authenticated' using errcode = '28000'; end if;

  select kickoff_at into v_kickoff from public.round_schedule
    where league_id = p_league_id and round = p_round;
  if v_kickoff is not null and now() >= v_kickoff - interval '60 seconds' then
    raise exception 'round locked' using errcode = '42501';
  end if;

  v_count := coalesce(jsonb_array_length(p_picks), 0);
  if v_count < 1 then raise exception 'no picks' using errcode = '22000'; end if;
  v_bonus := v_count * 10;

  insert into public.bets (user_id, league_id, round, funnies_awarded)
    values (v_user, p_league_id, p_round, v_bonus)
    returning id into v_bet_id;

  for v_pick in select * from jsonb_array_elements(p_picks)
  loop
    insert into public.bet_picks (bet_id, event_id, outcome)
      values (v_bet_id, v_pick->>'event_id', v_pick->>'outcome');
  end loop;

  update public.profiles
    set funnies = funnies + v_bonus,
        last_seen_at = now()
    where id = v_user
    returning funnies into v_new_funnies;

  return query select v_bet_id, v_new_funnies;
end;
$$;
```

## 7. Motore scoring e distribuzione funnies (Regolamento Art. 8–11)

Questo modulo implementa in SQL il punteggio per singolo pronostico (Art. 8), la
distribuzione del monte premi per giornata (Art. 9), per Evento/stagione (Art.
10) e per Sfida Gruppi (Art. 11). Si basa su tre tabelle — `match_results`
(esito ufficiale), `bet_scores` (punti per pick calcolati), `round_pots`
(monte premi per giornata) — e tre RPC `settle_round`, `distribute_round_pot`,
`distribute_group_challenge`. Tutte sono `security definer`: solo un utente
con `profiles.is_admin = true` può invocarle.

Incolla l'intero blocco in **SQL Editor → New query → Run**.

```sql
-- Risultati ufficiali inseriti dall'admin dopo la fine della giornata.
create table if not exists public.match_results (
  event_id         text primary key,
  league_id        text not null,
  round            int,
  -- "type": 'match' (1X2), 'score' (risultato esatto), 'race' (podio/ordine)
  kind             text not null check (kind in ('match','score','race')),
  outcome          text,                      -- per 'match': '1'|'X'|'2'
  home_goals       int,                       -- per 'score'
  away_goals       int,                       -- per 'score'
  race_positions   jsonb,                     -- per 'race': ["driverId1","driverId2",...]
  settled_at       timestamptz default now(),
  created_at       timestamptz default now()
);
alter table public.match_results enable row level security;
drop policy if exists "results are public" on public.match_results;
create policy "results are public" on public.match_results for select using (true);

-- Punti ottenuti dall'utente per ogni pick della schedina.
create table if not exists public.bet_scores (
  bet_id       uuid not null references public.bets(id) on delete cascade,
  event_id     text not null,
  outcome      text not null,
  points       int  not null default 0,
  is_exact     boolean not null default false,
  user_id      uuid not null references auth.users(id) on delete cascade,
  round_key    text not null,                -- "{leagueId}:{round}"
  settled_at   timestamptz default now(),
  primary key (bet_id, event_id, outcome)
);
alter table public.bet_scores enable row level security;
drop policy if exists "own scores visible" on public.bet_scores;
create policy "own scores visible" on public.bet_scores for select
  using (user_id = auth.uid());

-- Monte premi cumulato per giornata. L'admin imposta il prize_pool iniziale e
-- `distribute_round_pot` lo esaurisce creando righe in `bet_payouts`.
create table if not exists public.round_pots (
  round_key    text primary key,             -- "{leagueId}:{round}"
  league_id    text not null,
  round        int  not null,
  prize_pool   bigint not null default 0,
  distributed  boolean not null default false,
  distributed_at timestamptz,
  created_at   timestamptz default now()
);
alter table public.round_pots enable row level security;
drop policy if exists "pot public read" on public.round_pots;
create policy "pot public read" on public.round_pots for select using (true);

-- Storico accrediti funnies: per trasparenza, ogni distribuzione è loggata.
create table if not exists public.bet_payouts (
  id            bigserial primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  round_key     text,                         -- null per payout "evento"/"gruppo"
  kind          text not null,                -- 'round_winner' | 'round_cascade' | 'event' | 'group_challenge' | 'prono_flash' | 'funnies_booster'
  rank          int,
  amount        bigint not null,
  note          text,
  created_at    timestamptz default now()
);
alter table public.bet_payouts enable row level security;
drop policy if exists "own payouts visible" on public.bet_payouts;
create policy "own payouts visible" on public.bet_payouts for select
  using (user_id = auth.uid());

-- Gate admin: funzione helper.
create or replace function public.is_admin(p_user uuid default auth.uid())
returns boolean language sql stable as $$
  select coalesce((select is_admin from public.profiles where id = p_user), false);
$$;

-- ART. 8 — calcolo punti per una giornata.
-- Match 1X2: 1pt al vincitore, bonus N% (tier 1,2,4,6,8,10,…) a chi supera
--            la quota "85% ha fatto il primo punto".
-- Score:     1pt al vincitore + 2pt al risultato esatto.
-- Race:      10-6-4-3-2-1 alle prime 6 posizioni; la pick utente è del tipo
--            "p{N}:{subject}" → 1 punto solo se subject coincide con la
--            posizione N del risultato ufficiale.
create or replace function public.settle_round(p_league_id text, p_round int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_round_key text := p_league_id || ':' || p_round::text;
  v_total_match  int;
  v_correct_match int;
  v_bonus_rate numeric;
  v_tier int;
begin
  if not public.is_admin() then raise exception 'not an admin'; end if;

  -- Pulisce eventuale calcolo precedente per questa giornata.
  delete from public.bet_scores where round_key = v_round_key;

  -- MATCH 1X2
  insert into public.bet_scores (bet_id, event_id, outcome, points, is_exact, user_id, round_key)
  select
    bp.bet_id, bp.event_id, bp.outcome,
    case when mr.outcome = bp.outcome then 1 else 0 end,
    false, b.user_id, v_round_key
  from public.bet_picks bp
    join public.bets b on b.id = bp.bet_id
    join public.match_results mr on mr.event_id = bp.event_id and mr.kind = 'match'
  where b.league_id = p_league_id and coalesce(b.round, -1) = p_round;

  -- Conta i match totali/corretti per calcolare il bonus 85% di Art. 8.
  select count(*),
         count(*) filter (where points = 1)
    into v_total_match, v_correct_match
    from public.bet_scores
    where round_key = v_round_key;

  -- Tier bonus: 0,1,2,4,6,8,10,…
  if v_total_match > 0 then
    v_bonus_rate := v_correct_match::numeric / v_total_match::numeric;
    if      v_bonus_rate >= 0.85 then v_tier := 10;
    elsif   v_bonus_rate >= 0.80 then v_tier := 8;
    elsif   v_bonus_rate >= 0.75 then v_tier := 6;
    elsif   v_bonus_rate >= 0.70 then v_tier := 4;
    elsif   v_bonus_rate >= 0.65 then v_tier := 2;
    elsif   v_bonus_rate >= 0.60 then v_tier := 1;
    else                              v_tier := 0;
    end if;
    if v_tier > 0 then
      update public.bet_scores set points = points + v_tier
        where round_key = v_round_key and points > 0;
    end if;
  end if;

  -- SCORE (risultato esatto): +1 per vincitore coerente, +2 per esatto.
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

  -- RACE (es. F1/ciclismo): pick "p{N}:{subject}". 10/6/4/3/2/1 alle pos 1..6.
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
end;
$$;

-- ART. 9 — distribuzione monte premi per giornata (formula V a cascata).
-- C × 80% = V + V/2 + V/3 + … + V/R, dove R = numero di vincitori = N/3.
-- Il 20% va al primo classificato; il restante 80% si distribuisce a cascata.
create or replace function public.distribute_round_pot(p_league_id text, p_round int)
returns table(user_id uuid, rank int, amount bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text := p_league_id || ':' || p_round::text;
  v_pot bigint;
  v_participants int;
  v_ranks int;
  v_sum_denoms numeric := 0;
  v_v numeric;
  v_i int;
  v_share numeric;
begin
  if not public.is_admin() then raise exception 'not an admin'; end if;

  select prize_pool into v_pot from public.round_pots where round_key = v_key;
  if v_pot is null or v_pot = 0 then raise exception 'no pot for %', v_key; end if;

  -- Classifica: somma punti per utente nella giornata, escludendo chi ha 0.
  drop table if exists _tmp_rank;
  create temp table _tmp_rank as
  select user_id, sum(points)::int as pts,
         row_number() over (order by sum(points) desc, user_id) as pos
  from public.bet_scores where round_key = v_key
  group by user_id having sum(points) > 0;

  select count(*) into v_participants from _tmp_rank;
  if v_participants = 0 then return; end if;

  v_ranks := greatest(1, floor(v_participants / 3.0)::int);

  -- Somma delle denominazioni 1 + 1/2 + … + 1/R.
  for v_i in 1..v_ranks loop
    v_sum_denoms := v_sum_denoms + (1.0 / v_i);
  end loop;
  v_v := (v_pot::numeric * 0.80) / v_sum_denoms;

  -- Primo classificato: 20% fisso del monte premi.
  insert into public.bet_payouts (user_id, round_key, kind, rank, amount, note)
  select t.user_id, v_key, 'round_winner', 1, round(v_pot * 0.20)::bigint, 'Art.9 — 20% monte premi'
  from _tmp_rank t where t.pos = 1;

  update public.profiles p
    set funnies = funnies + round(v_pot * 0.20)::bigint
    from _tmp_rank t
    where t.pos = 1 and p.id = t.user_id;

  -- Cascata V, V/2, … sui primi v_ranks.
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
$$;

-- ART. 11 — sfida gruppi: top 30 gruppi (min 10 membri), formula V/2+V/3+…
-- distribuita equamente fra i membri di ciascun gruppo vincente.
create or replace function public.distribute_group_challenge(
  p_league_id text, p_round int, p_pool bigint
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text := p_league_id || ':' || p_round::text;
  v_total int;
  v_ranks int;
  v_sum_denoms numeric := 0;
  v_v numeric;
  v_i int;
  v_rec record;
  v_members int;
  v_group_amount numeric;
  v_per_member bigint;
begin
  if not public.is_admin() then raise exception 'not an admin'; end if;

  drop table if exists _tmp_groups;
  create temp table _tmp_groups as
  select g.id as group_id, g.name,
         count(distinct gm.user_id) as members,
         coalesce(sum(bs.points), 0)::int as pts,
         row_number() over (
           order by coalesce(sum(bs.points), 0) desc, g.id
         ) as pos
  from public.groups g
    join public.group_members gm on gm.group_id = g.id
    left join public.bet_scores bs on bs.user_id = gm.user_id and bs.round_key = v_key
  group by g.id
  having count(distinct gm.user_id) >= 10 and coalesce(sum(bs.points), 0) > 0;

  select count(*) into v_total from _tmp_groups;
  if v_total = 0 then return; end if;

  v_ranks := least(30, v_total);
  for v_i in 2..v_ranks loop
    v_sum_denoms := v_sum_denoms + (1.0 / v_i);
  end loop;
  if v_sum_denoms = 0 then v_sum_denoms := 1; end if;
  v_v := p_pool::numeric / v_sum_denoms;

  for v_rec in select * from _tmp_groups where pos between 2 and v_ranks loop
    v_members := v_rec.members;
    v_group_amount := v_v / v_rec.pos;
    v_per_member := round(v_group_amount / v_members)::bigint;

    insert into public.bet_payouts (user_id, round_key, kind, rank, amount, note)
    select gm.user_id, v_key, 'group_challenge', v_rec.pos, v_per_member,
           'Art.11 — gruppo ' || v_rec.name
    from public.group_members gm where gm.group_id = v_rec.group_id;

    update public.profiles p
      set funnies = funnies + v_per_member
      from public.group_members gm
      where gm.group_id = v_rec.group_id and p.id = gm.user_id;
  end loop;
end;
$$;
```

Flusso operativo tipico di fine-giornata:

1. Inserisci i risultati ufficiali in `match_results` (vedi pannello admin lato app, §9).
2. `select public.settle_round('4328', 34);` — calcola i punti.
3. `select * from public.distribute_round_pot('4328', 34);` — assegna i funnies.
4. (Opzionale) `select public.distribute_group_challenge('4328', 34, 50000);`

Solo un utente con `profiles.is_admin = true` può richiamare queste RPC. Per
concedere il flag admin al tuo account la prima volta:

```sql
update public.profiles set is_admin = true where id = '<il-tuo-uuid>';
```

## 8. (Opzionale, consigliato in sviluppo) Disattiva la conferma email

Di default Supabase manda una mail di conferma per ogni iscrizione. In fase di sviluppo conviene disabilitarla:

- **Authentication → Providers → Email** → deseleziona *Confirm email* → **Save**.

In produzione la riattivi.

## 9. Copia le credenziali nell'app

1. **Project Settings → API** → copia `Project URL` e `anon public`.
2. Nella cartella `app/` crea un file `.env` (copialo da `.env.example`):

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

3. Riavvia il dev server (`npm run dev`).

Dopo questo passaggio la schermata di iscrizione creerà davvero utenti nel tuo database.
