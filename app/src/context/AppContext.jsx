import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

const AppContext = createContext(null);

// Fallback usato quando Supabase non è configurato: l'app resta navigabile
// in modalità dimostrativa e l'iscrizione mostra un avviso.
const DEMO_USER = { nick: 'Luca', handle: 'pronostico_99' };
const DEMO_FUNNIES = 14200;

export function AppProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoadingAuth(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!supabase || !session?.user) return null;
    const { data } = await supabase
      .from('profiles')
      .select('nick, funnies, preferences, tos_accepted, marketing_consent, lead_boost_consent, is_admin')
      .eq('id', session.user.id)
      .maybeSingle();
    setProfile(data || null);
    return data || null;
  }, [session]);

  // Quando la sessione cambia ricarichiamo il profilo.
  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const signUp = useCallback(async ({ email, password, nick, preferences, consents }) => {
    if (!supabase) throw new Error('Supabase non configurato');
    // Il profilo viene creato da un trigger su auth.users (security definer),
    // così evitiamo il problema RLS: al momento del signUp la sessione non è
    // ancora attiva e un insert dal client verrebbe rifiutato. I consensi
    // viaggiano nei metadati dell'utente e vengono loggati dal trigger.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nick,
          preferences: preferences || [],
          tos_accepted:       !!(consents?.tos),
          marketing_consent:  !!(consents?.marketing),
          lead_boost_consent: !!(consents?.leadBoost),
        },
      },
    });
    if (error) throw error;
    return data;
  }, []);

  // Revoca / concedi un consenso dal profilo (lead boost, marketing, ecc.).
  const setConsent = useCallback(
    async ({ scope, granted, version = 'profile-v1' }) => {
      if (!supabase) return;
      const { error } = await supabase.rpc('set_consent', {
        p_scope: scope,
        p_granted: granted,
        p_version: version,
      });
      if (error) throw error;
      await refreshProfile();
    },
    [refreshProfile]
  );

  const signIn = useCallback(async ({ email, password }) => {
    if (!supabase) throw new Error('Supabase non configurato');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  const user = session?.user
    ? { nick: profile?.nick || session.user.email?.split('@')[0] || 'utente',
        handle: profile?.nick || '',
        email: session.user.email }
    : DEMO_USER;
  const funnies = profile?.funnies ?? (session ? 0 : DEMO_FUNNIES);

  // Invia una schedina: la RPC `submit_bet` gira su Supabase come
  // `security definer` dentro una singola transazione. Scrive i pick, accredita
  // i funnies al profilo e ci restituisce il nuovo saldo. Qui poi aggiorniamo
  // lo state locale senza dover rifare un round trip.
  const submitBet = useCallback(
    async ({ leagueId, round, picks }) => {
      const count = picks.length;
      const bonus = count * 10;
      if (!supabase) {
        return { betId: null, bonus, newFunnies: funnies + bonus, demo: true };
      }
      const { data, error } = await supabase.rpc('submit_bet', {
        p_league_id: String(leagueId),
        p_round: round ?? null,
        p_picks: picks.map((p) => ({ event_id: String(p.eventId), outcome: p.outcome })),
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      const newFunnies = row?.new_funnies ?? null;
      if (newFunnies != null) {
        setProfile((p) => (p ? { ...p, funnies: newFunnies } : p));
      } else {
        await refreshProfile();
      }
      return { betId: row?.bet_id ?? null, bonus, newFunnies };
    },
    [funnies, refreshProfile]
  );

  // Gruppi — thin wrappers sulle RPC di Supabase.
  const listMyGroups = useCallback(async () => {
    if (!supabase) return [];
    const { data, error } = await supabase.rpc('list_my_groups');
    if (error) throw error;
    return data || [];
  }, []);

  const createGroup = useCallback(async ({ name, description }) => {
    if (!supabase) throw new Error('Supabase non configurato');
    const { data, error } = await supabase.rpc('create_group', {
      p_name: name,
      p_description: description || null,
    });
    if (error) throw error;
    return Array.isArray(data) ? data[0] : data;
  }, []);

  const joinGroupByCode = useCallback(async (code) => {
    if (!supabase) throw new Error('Supabase non configurato');
    const { data, error } = await supabase.rpc('join_group_by_code', {
      p_code: code,
    });
    if (error) throw error;
    return Array.isArray(data) ? data[0] : data;
  }, []);

  const groupLeaderboard = useCallback(async (groupId) => {
    if (!supabase) return [];
    const { data, error } = await supabase.rpc('group_leaderboard', {
      p_group_id: groupId,
    });
    if (error) throw error;
    return data || [];
  }, []);

  const leaveGroup = useCallback(async (groupId) => {
    if (!supabase) return;
    const { error } = await supabase.rpc('leave_group', { p_group_id: groupId });
    if (error) throw error;
  }, []);

  // Schedine dei membri del gruppo: il server le espone solo per le
  // giornate già iniziate (anti-copia pre-kickoff).
  const groupRoundBets = useCallback(async (groupId) => {
    if (!supabase) return [];
    const { data, error } = await supabase.rpc('group_round_bets', {
      p_group_id: groupId,
    });
    if (error) throw error;
    return data || [];
  }, []);

  // Classifica del gruppo per singola competizione (punti del motore di
  // scoring + numero di schedine giocate, raggruppati per lega).
  const groupLeagueStandings = useCallback(async (groupId) => {
    if (!supabase) return [];
    const { data, error } = await supabase.rpc('group_league_standings', {
      p_group_id: groupId,
    });
    if (error) throw error;
    return data || [];
  }, []);

  // Lead Boost — campagne consenso esplicito.
  const listLeadCampaigns = useCallback(async () => {
    if (!supabase) return [];
    const { data, error } = await supabase.rpc('list_lead_campaigns');
    if (error) throw error;
    return data || [];
  }, []);

  // Profilo pubblico: chiunque autenticato può leggere i campi non sensibili
  // (nick, funnies totali, paese, ultima connessione, posizione globale).
  const getPublicProfile = useCallback(async (handle) => {
    if (!supabase) return null;
    const { data, error } = await supabase.rpc('public_profile', { p_handle: handle });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    return row || null;
  }, []);

  // Verifica se un nickname è libero (case-insensitive). Usato dal form
  // di iscrizione PRIMA di chiamare signUp, così l'utente vede subito
  // "nick già in uso" invece del criptico "Database error saving new user".
  const nickAvailable = useCallback(async (nick) => {
    if (!supabase) return true;
    const { data, error } = await supabase.rpc('nick_available', { p_nick: nick });
    if (error) return true; // in dubbio non blocchiamo: ci pensa il trigger
    return Boolean(data);
  }, []);

  // Statistiche pubbliche (landing): iscritti totali + montepremi del mese.
  // Funziona anche senza login (grant ad anon).
  const publicStats = useCallback(async () => {
    if (!supabase) return null;
    const { data, error } = await supabase.rpc('public_stats');
    if (error) return null;
    const row = Array.isArray(data) ? data[0] : data;
    return row || null;
  }, []);

  // Posizione in classifica + guadagno settimanale + accuratezza dell'utente.
  const myRank = useCallback(async () => {
    if (!supabase) return null;
    const { data, error } = await supabase.rpc('my_rank');
    if (error) return null;
    const row = Array.isArray(data) ? data[0] : data;
    return row || null;
  }, []);

  // Top 50 classifica globale.
  const globalLeaderboard = useCallback(async () => {
    if (!supabase) return [];
    const { data, error } = await supabase.rpc('global_leaderboard');
    if (error) throw error;
    return data || [];
  }, []);

  // Sfida del mese attiva + top 50 partecipanti.
  const monthlyChallenge = useCallback(async () => {
    if (!supabase) return null;
    const { data, error } = await supabase.rpc('monthly_challenge_state');
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    return row || null;
  }, []);

  // ── Admin RPCs ────────────────────────────────────────────────────────
  // Tutte le RPC sono `security definer` e verificano `profiles.is_admin`
  // lato server: un chiamante non admin riceve l'errore "not an admin".
  // `isAdmin` è un flag leggero che riflette `profiles.is_admin`.
  const isAdmin = Boolean(profile?.is_admin);

  const adminSetMatchResult = useCallback(async (row) => {
    if (!supabase) throw new Error('Supabase non configurato');
    // upsert diretto sulla tabella; l'admin RLS la protegge.
    const { error } = await supabase
      .from('match_results')
      .upsert(row, { onConflict: 'event_id' });
    if (error) throw error;
  }, []);

  const adminSettleRound = useCallback(async ({ leagueId, round }) => {
    if (!supabase) throw new Error('Supabase non configurato');
    const { error } = await supabase.rpc('settle_round', {
      p_league_id: String(leagueId), p_round: Number(round),
    });
    if (error) throw error;
  }, []);

  const adminDistributeRound = useCallback(async ({ leagueId, round }) => {
    if (!supabase) throw new Error('Supabase non configurato');
    const { data, error } = await supabase.rpc('distribute_round_pot', {
      p_league_id: String(leagueId), p_round: Number(round),
    });
    if (error) throw error;
    return data || [];
  }, []);

  // Chiusura one-click: risultati dalle fixtures → punti → montepremi
  // (base + iscritti × quota) → distribuzione. Tutto in una transazione.
  const adminCloseRound = useCallback(async ({ leagueId, round, basePool, perEntrant }) => {
    if (!supabase) throw new Error('Supabase non configurato');
    const { data, error } = await supabase.rpc('admin_close_round', {
      p_league_id:   String(leagueId),
      p_round:       Number(round),
      p_base_pool:   Number(basePool) || 0,
      p_per_entrant: Number(perEntrant) || 0,
    });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    return row || null;
  }, []);

  const adminListLeadCampaigns = useCallback(async () => {
    if (!supabase) return [];
    const { data, error } = await supabase.rpc('admin_list_lead_campaigns');
    if (error) throw error;
    return data || [];
  }, []);

  const adminUpsertLeadCampaign = useCallback(async (c) => {
    if (!supabase) throw new Error('Supabase non configurato');
    const { data, error } = await supabase.rpc('admin_upsert_lead_campaign', {
      p_id: c.id ?? null,
      p_brand: c.brand,
      p_title: c.title,
      p_tagline: c.tagline || null,
      p_funnies_reward: Number(c.funnies_reward) || 0,
      p_fields: c.fields || [],
      p_disclaimer: c.disclaimer || '',
      p_data_sharing: c.data_sharing || '',
      p_active: c.active ?? true,
    });
    if (error) throw error;
    return data;
  }, []);

  const adminToggleLeadCampaign = useCallback(async (id, active) => {
    if (!supabase) throw new Error('Supabase non configurato');
    const { error } = await supabase.rpc('admin_toggle_lead_campaign', {
      p_id: id, p_active: active,
    });
    if (error) throw error;
  }, []);

  const adminDeleteLeadCampaign = useCallback(async (id) => {
    if (!supabase) throw new Error('Supabase non configurato');
    const { error } = await supabase.rpc('admin_delete_lead_campaign', { p_id: id });
    if (error) throw error;
  }, []);

  // --- Fixtures (partite dell'admin) ---
  const adminListFixtures = useCallback(async ({ leagueId, round } = {}) => {
    if (!supabase) throw new Error('Supabase non configurato');
    const { data, error } = await supabase.rpc('admin_list_fixtures', {
      p_league_id: String(leagueId),
      p_round: round == null || round === '' ? null : Number(round),
    });
    if (error) throw error;
    return data || [];
  }, []);

  const adminUpsertFixture = useCallback(async (f) => {
    if (!supabase) throw new Error('Supabase non configurato');
    const { data, error } = await supabase.rpc('admin_upsert_fixture', {
      p_event_id:   f.event_id,
      p_league_id:  String(f.league_id),
      p_round:      f.round == null ? null : Number(f.round),
      p_home:       f.home,
      p_away:       f.away,
      p_kickoff_at: f.kickoff_at,
      p_home_score: f.home_score == null || f.home_score === '' ? null : Number(f.home_score),
      p_away_score: f.away_score == null || f.away_score === '' ? null : Number(f.away_score),
      p_status:     f.status || 'scheduled',
    });
    if (error) throw error;
    return data;
  }, []);

  const adminDeleteFixture = useCallback(async (eventId) => {
    if (!supabase) throw new Error('Supabase non configurato');
    const { error } = await supabase.rpc('admin_delete_fixture', { p_event_id: eventId });
    if (error) throw error;
  }, []);

  // Le mie schedine — elenco e cancellazione (con rimborso funnies).
  // `listMyBets` ritorna un array di { bet_id, league_id, round,
  // funnies_awarded, created_at, first_kickoff_at, editable, picks[] }.
  const listMyBets = useCallback(async () => {
    if (!supabase) return [];
    const { data, error } = await supabase.rpc('list_my_bets');
    if (error) throw error;
    return data || [];
  }, []);

  const deleteMyBet = useCallback(async (betId) => {
    if (!supabase) throw new Error('Supabase non configurato');
    const { error } = await supabase.rpc('delete_my_bet', { p_bet_id: Number(betId) });
    if (error) throw error;
    await refreshProfile();
    return true;
  }, [refreshProfile]);

  // Promuove l'utente corrente ad admin usando la passphrase master
  // definita nella funzione SQL public.bootstrap_admin.
  const bootstrapAdmin = useCallback(async (secret) => {
    if (!supabase) throw new Error('Supabase non configurato');
    const { error } = await supabase.rpc('bootstrap_admin', { p_secret: secret });
    if (error) throw error;
    await refreshProfile();
    return true;
  }, [refreshProfile]);

  const countRoundEntrants = useCallback(async (leagueId, round) => {
    if (!supabase) return 0;
    const { data, error } = await supabase.rpc('count_round_entrants', {
      p_league_id: String(leagueId),
      p_round: round == null ? null : Number(round),
    });
    if (error) return 0;
    return Number(data) || 0;
  }, []);

  const adminSetRoundPot = useCallback(async ({ leagueId, round, pool, kickoffAt }) => {
    if (!supabase) throw new Error('Supabase non configurato');
    const key = `${leagueId}:${round}`;
    const { error: ePot } = await supabase.from('round_pots').upsert({
      round_key: key,
      league_id: String(leagueId),
      round: Number(round),
      prize_pool: Number(pool),
    }, { onConflict: 'round_key' });
    if (ePot) throw ePot;
    if (kickoffAt) {
      const { error: eSched } = await supabase.from('round_schedule').upsert({
        league_id: String(leagueId),
        round: Number(round),
        kickoff_at: kickoffAt,
      }, { onConflict: 'league_id,round' });
      if (eSched) throw eSched;
    }
  }, []);

  const submitLead = useCallback(
    async ({ campaignId, payload, consentVersion }) => {
      if (!supabase) throw new Error('Supabase non configurato');
      const { data, error } = await supabase.rpc('submit_lead', {
        p_campaign_id: campaignId,
        p_payload: payload,
        p_consent_version: consentVersion,
        p_consent_ua: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      const newFunnies = row?.new_funnies ?? null;
      if (newFunnies != null) {
        setProfile((p) => (p ? { ...p, funnies: newFunnies } : p));
      } else {
        await refreshProfile();
      }
      return { submissionId: row?.submission_id ?? null, newFunnies, awarded: row?.funnies_awarded ?? 0 };
    },
    [refreshProfile]
  );

  const value = {
    session,
    profile,
    user,
    funnies,
    loadingAuth,
    isAuthed: Boolean(session),
    isSupabaseConfigured,
    signUp,
    signIn,
    signOut,
    submitBet,
    refreshProfile,
    setConsent,
    listMyGroups,
    createGroup,
    joinGroupByCode,
    groupLeaderboard,
    leaveGroup,
    groupRoundBets,
    groupLeagueStandings,
    listLeadCampaigns,
    submitLead,
    getPublicProfile,
    globalLeaderboard,
    monthlyChallenge,
    publicStats,
    myRank,
    nickAvailable,
    isAdmin,
    adminSetMatchResult,
    adminSettleRound,
    adminDistributeRound,
    adminCloseRound,
    adminSetRoundPot,
    adminListLeadCampaigns,
    adminUpsertLeadCampaign,
    adminToggleLeadCampaign,
    adminDeleteLeadCampaign,
    adminListFixtures,
    adminUpsertFixture,
    adminDeleteFixture,
    countRoundEntrants,
    bootstrapAdmin,
    listMyBets,
    deleteMyBet,
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp deve essere usato dentro <AppProvider>');
  return ctx;
}
