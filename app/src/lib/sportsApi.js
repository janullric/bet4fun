// Wrapper su partite: Supabase-first, TheSportsDB come fallback.
//
// Per default leggiamo da `public.fixtures` su Supabase (tabella gestita
// dall'admin dall'app). Se per una lega non esistono ancora righe, cadiamo
// su TheSportsDB (free tier, chiave demo "3"), che è rate-limited e non
// sempre disponibile: è il motivo per cui abbiamo introdotto la tabella
// lato nostro. Docs: https://www.thesportsdb.com/free_api.php
//
// Cache in-memory per evitare richieste duplicate nella stessa sessione.

import { supabase, isSupabaseConfigured } from './supabase.js';

const BASE = 'https://www.thesportsdb.com/api/v1/json/3';

// Stagione corrente per le leghe europee. Da aggiornare a fine stagione.
export const CURRENT_SEASON = '2025-2026';

// Turni di default per i campionati di calcio a calendario continuo.
const FOOTBALL_ROUNDS = [33, 34, 35, 36, 37, 38];
// NBA: regular season termina intorno al round 26, poi le fasi a eliminazione
// su TheSportsDB usano numeri "magici" (125 = WC1, 150 = WCSF, ecc.).
// Sondiamo una finestra larga per coprire fine stagione + playoff.
const NBA_ROUNDS = [24, 25, 26, 27, 28, 29, 125, 150, 175, 200];
// ATP: i round sono tornei. Copriamo la primavera europea (clay) fino ai
// masters estivi americani.
const ATP_ROUNDS = [14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26];
// F1: i round sono i weekend di GP. Sondiamo una finestra di 6 GP.
const F1_ROUNDS = [3, 4, 5, 6, 7, 8, 9];
// UCI: i round sono le gare / tappe. Finestra primavera-classiche.
const UCI_ROUNDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

// Ogni lega dichiara come vengono calcolati i pick:
//  - '1X2'     → calcio (casa / pareggio / trasferta)
//  - '12'      → basket / tennis / hockey / baseball / football am. (casa / trasferta)
//  - 'F1TOP5'  → F1 / MotoGP (top 5 qualifica + gara)
//  - 'CYCLETOP10' → ciclismo (top 10 arrivo tappa / classica)
//  - 'UFC'     → UFC (vincitore + metodo)
//
// I `scanRounds` sono le finestre di default su TheSportsDB (usate solo come
// fallback); quando le fixtures arrivano da Supabase il client usa quelle e
// ignora questi valori.
export const LEAGUES = {
  // --- Calcio (campionati domestici) ---
  serieA:  { id: '4332', name: 'Italian Serie A',        label: 'Serie A',         country: 'Italia',      sport: 'football',   pickType: '1X2', season: CURRENT_SEASON, scanRounds: FOOTBALL_ROUNDS },
  premier: { id: '4328', name: 'English Premier League', label: 'Premier League',  country: 'Inghilterra', sport: 'football',   pickType: '1X2', season: CURRENT_SEASON, scanRounds: FOOTBALL_ROUNDS },
  laLiga:  { id: '4335', name: 'Spanish La Liga',        label: 'La Liga',         country: 'Spagna',      sport: 'football',   pickType: '1X2', season: CURRENT_SEASON, scanRounds: FOOTBALL_ROUNDS },
  bundes:  { id: '4331', name: 'German Bundesliga',      label: 'Bundesliga',      country: 'Germania',    sport: 'football',   pickType: '1X2', season: CURRENT_SEASON, scanRounds: FOOTBALL_ROUNDS },
  ligue1:  { id: '4334', name: 'French Ligue 1',         label: 'Ligue 1',         country: 'Francia',     sport: 'football',   pickType: '1X2', season: CURRENT_SEASON, scanRounds: FOOTBALL_ROUNDS },
  mls:     { id: '4346', name: 'American MLS',           label: 'MLS',             country: 'USA',         sport: 'football',   pickType: '1X2', season: '2026',         scanRounds: FOOTBALL_ROUNDS },

  // --- Calcio (coppe europee) ---
  ucl:     { id: '4480', name: 'UEFA Champions League',  label: 'Champions League',country: 'Europa',      sport: 'football',   pickType: '1X2', season: CURRENT_SEASON, scanRounds: [1, 2, 3, 4, 5, 6, 7, 8] },
  uel:     { id: '4481', name: 'UEFA Europa League',     label: 'Europa League',   country: 'Europa',      sport: 'football',   pickType: '1X2', season: CURRENT_SEASON, scanRounds: [1, 2, 3, 4, 5, 6, 7, 8] },

  // --- Basket ---
  nba:       { id: '4387', name: 'NBA',              label: 'NBA',         country: 'USA',      sport: 'basketball', pickType: '12', season: CURRENT_SEASON, scanRounds: NBA_ROUNDS },
  euroleague:{ id: '4427', name: 'Euroleague',       label: 'Euroleague',  country: 'Europa',   sport: 'basketball', pickType: '12', season: CURRENT_SEASON, scanRounds: [24, 25, 26, 27, 28, 29, 30, 125, 150, 175] },

  // --- Tennis ---
  atp:     { id: '4464', name: 'ATP World Tour',     label: 'ATP Tour',    country: 'Mondiale', sport: 'tennis',     pickType: '12', season: '2026', scanRounds: ATP_ROUNDS },
  wta:     { id: '4463', name: 'WTA Tour',           label: 'WTA Tour',    country: 'Mondiale', sport: 'tennis',     pickType: '12', season: '2026', scanRounds: ATP_ROUNDS },

  // --- Motorsport ---
  f1:      { id: '4370', name: 'Formula 1',          label: 'Formula 1',   country: 'Mondiale', sport: 'motorsport', pickType: 'F1TOP5',     season: '2026', scanRounds: F1_ROUNDS },
  motogp:  { id: '4407', name: 'MotoGP',             label: 'MotoGP',      country: 'Mondiale', sport: 'motorsport', pickType: 'F1TOP5',     season: '2026', scanRounds: F1_ROUNDS },

  // --- Ciclismo ---
  uci:     { id: '4465', name: 'UCI World Tour',     label: 'UCI World Tour',  country: 'Mondiale', sport: 'cycling', pickType: 'CYCLETOP10', season: '2026', scanRounds: UCI_ROUNDS },

  // --- USA sports ---
  nhl:     { id: '4380', name: 'NHL',                label: 'NHL',         country: 'USA',      sport: 'icehockey',  pickType: '12', season: CURRENT_SEASON, scanRounds: [24, 25, 26, 27, 28, 29, 30, 125, 150, 175] },
  mlb:     { id: '4424', name: 'MLB',                label: 'MLB',         country: 'USA',      sport: 'baseball',   pickType: '12', season: '2026', scanRounds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
  nfl:     { id: '4391', name: 'NFL',                label: 'NFL',         country: 'USA',      sport: 'americanfootball', pickType: '12', season: CURRENT_SEASON, scanRounds: [10, 11, 12, 13, 14, 15, 16, 17, 18] },

  // --- Fighting ---
  ufc:     { id: '4443', name: 'UFC',                label: 'UFC',         country: 'Mondiale', sport: 'fighting',   pickType: 'UFC', season: '2026', scanRounds: [3, 4, 5, 6, 7, 8, 9] },
};

export function findLeagueById(id) {
  return Object.values(LEAGUES).find((l) => l.id === String(id)) || null;
}

const cache = new Map();
const TTL_MS = 5 * 60 * 1000;

async function getJson(url) {
  const now = Date.now();
  const hit = cache.get(url);
  if (hit && now - hit.at < TTL_MS) return hit.data;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API ${res.status} su ${url}`);
  const data = await res.json();
  cache.set(url, { data, at: now });
  return data;
}

function normalize(e) {
  // strTimestamp è nel formato "YYYY-MM-DDTHH:mm:ss" in UTC.
  const iso = e.strTimestamp ? `${e.strTimestamp}Z` : e.dateEvent;
  return {
    id:      e.idEvent,
    event:   e.strEvent,
    home:    e.strHomeTeam,
    away:    e.strAwayTeam,
    league:  e.strLeague,
    sport:   (e.strSport || '').toLowerCase(),
    round:   e.intRound,
    dateISO: iso,
    date:    e.dateEvent,
    time:    (e.strTime || '').slice(0, 5),
    venue:   e.strVenue,
    homeScore: e.intHomeScore != null ? Number(e.intHomeScore) : null,
    awayScore: e.intAwayScore != null ? Number(e.intAwayScore) : null,
    status:    e.strStatus || 'scheduled',
  };
}

function isFuture(event) {
  if (!event.dateISO) return false;
  const t = new Date(event.dateISO).getTime();
  return !Number.isNaN(t) && t > Date.now();
}

// Esposta per il bottone "Importa turno" dell'admin: fetcha una sola volta
// TheSportsDB (niente rate limit) e restituisce eventi normalizzati, pronti
// per l'upsert su `public.fixtures`. La stagione viene dalla mappa LEAGUES.
export async function fetchTheSportsDBRound(leagueId, round, seasonOverride) {
  const league = findLeagueById(leagueId);
  const season = seasonOverride || league?.season || CURRENT_SEASON;
  return fetchRound(String(leagueId), Number(round), season);
}

async function fetchRound(leagueId, round, season) {
  const json = await getJson(
    `${BASE}/eventsround.php?id=${leagueId}&r=${round}&s=${encodeURIComponent(season)}`
  );
  return (json?.events || []).map(normalize);
}

// ---------------------------------------------------------------------------
// Supabase-first fixtures.
//
// Cache in-memory (5 min) su lega. Se Supabase è configurato e ha righe per
// quella lega, usiamo quelle; altrimenti restituiamo null così il chiamante
// cade su TheSportsDB.
// ---------------------------------------------------------------------------
const fixturesCache = new Map();

function normalizeFixture(row) {
  return {
    id:        row.event_id,
    event:     `${row.home} vs ${row.away}`,
    home:      row.home,
    away:      row.away,
    league:    null,
    sport:     '',
    round:     row.round,
    dateISO:   row.kickoff_at,
    date:      (row.kickoff_at || '').slice(0, 10),
    time:      (row.kickoff_at || '').slice(11, 16),
    venue:     null,
    homeScore: row.home_score,
    awayScore: row.away_score,
    status:    row.status || 'scheduled',
  };
}

async function fetchFixturesFromSupabase(leagueId) {
  if (!isSupabaseConfigured || !supabase) return null;
  const now = Date.now();
  const hit = fixturesCache.get(leagueId);
  if (hit && now - hit.at < TTL_MS) return hit.data;
  const { data, error } = await supabase.rpc('list_fixtures_by_league', {
    p_league_id: String(leagueId),
  });
  if (error) {
    // RPC non ancora installata → trattiamo come "nessuna fixture locale"
    // e lasciamo il fallback su TheSportsDB.
    fixturesCache.set(leagueId, { data: null, at: now });
    return null;
  }
  const rows = Array.isArray(data) ? data : [];
  if (rows.length === 0) {
    fixturesCache.set(leagueId, { data: null, at: now });
    return null;
  }
  const norm = rows.map(normalizeFixture);
  fixturesCache.set(leagueId, { data: norm, at: now });
  return norm;
}

// Entrants attivi (utenti distinti che hanno già giocato) per il round.
// Serve alla card pronostici per mostrare il montepremi in chiaro.
export async function fetchRoundEntrants(leagueId, round) {
  if (!isSupabaseConfigured || !supabase) return 0;
  const { data, error } = await supabase.rpc('count_round_entrants', {
    p_league_id: String(leagueId),
    p_round: round == null ? null : Number(round),
  });
  if (error) return 0;
  return Number(data) || 0;
}

// Carica più turni in parallelo e restituisce solo gli eventi futuri.
// Se il league è configurato usiamo i suoi scanRounds e la sua stagione, così
// NBA / F1 / ATP non ereditano i turni di calcio.
export async function fetchUpcomingByLeague(leagueId, limit = 15, seasonOverride) {
  // 1) Prefer Supabase fixtures (gestite dall'admin, nessun rate limit).
  const local = await fetchFixturesFromSupabase(leagueId);
  if (local && local.length > 0) {
    const future = local.filter(isFuture);
    future.sort((a, b) => new Date(a.dateISO) - new Date(b.dateISO));
    return future.slice(0, limit);
  }

  // 2) Fallback TheSportsDB.
  const league = findLeagueById(leagueId);
  const scan = league?.scanRounds || FOOTBALL_ROUNDS;
  const season = seasonOverride || league?.season || CURRENT_SEASON;
  const results = await Promise.allSettled(
    scan.map((r) => fetchRound(leagueId, r, season))
  );
  const all = results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
  const future = all.filter(isFuture);
  future.sort((a, b) => new Date(a.dateISO) - new Date(b.dateISO));
  const seen = new Set();
  const unique = future.filter((e) => (seen.has(e.id) ? false : (seen.add(e.id), true)));
  return unique.slice(0, limit);
}

export async function fetchEventById(eventId) {
  const json = await getJson(`${BASE}/lookupevent.php?id=${eventId}`);
  const e = json?.events?.[0];
  return e ? normalize(e) : null;
}

export async function fetchUpcomingForLeagues(leagueIds, perLeague = 5) {
  const all = await Promise.allSettled(
    leagueIds.map((id) => fetchUpcomingByLeague(id, perLeague))
  );
  const events = all.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
  const seen = new Set();
  return events.filter((e) => (seen.has(e.id) ? false : (seen.add(e.id), true)));
}

// Meta della giornata corrente per la lista pronostici: restituisce il numero
// del round, il primo kickoff (anche se passato → serve per il lockout), il
// prossimo kickoff futuro e il conteggio delle partite ancora pronosticabili.
// Null se non c'è nessun round con eventi futuri.
export async function fetchCurrentRoundMetaByLeague(leagueOrId, seasonOverride) {
  const league = typeof leagueOrId === 'string'
    ? findLeagueById(leagueOrId)
    : leagueOrId;
  if (!league) return null;
  const leagueId = league.id;

  // 1) Supabase-first: se la lega ha fixtures locali, ragioniamo solo su quelle.
  const local = await fetchFixturesFromSupabase(leagueId);
  if (local && local.length > 0) {
    const meta = metaFromEvents(leagueId, local);
    if (meta) return meta;
  }

  // 2) Fallback TheSportsDB (solo se Supabase non ha righe).
  const season = seasonOverride || league.season || CURRENT_SEASON;
  const scan = league.scanRounds || FOOTBALL_ROUNDS;
  const results = await Promise.allSettled(
    scan.map((r) => fetchRound(leagueId, r, season))
  );
  const events = results.flatMap((r) => r.status === 'fulfilled' ? r.value : []);
  return metaFromEvents(leagueId, events);
}

// Dato un elenco di eventi (da Supabase o TheSportsDB) torna
// { leagueId, round, firstKickISO, nextKickISO, count } per la
// *giornata corrente* = primo round con eventi futuri.
function metaFromEvents(leagueId, events) {
  const byRound = new Map();
  for (const ev of events) {
    const key = Number(ev.round);
    if (!Number.isFinite(key)) continue;
    if (!byRound.has(key)) byRound.set(key, []);
    byRound.get(key).push(ev);
  }
  const rounds = [...byRound.keys()].sort((a, b) => a - b);
  for (const r of rounds) {
    const all = byRound.get(r);
    const future = all.filter(isFuture);
    if (future.length === 0) continue;
    all.sort((a, b) => new Date(a.dateISO) - new Date(b.dateISO));
    future.sort((a, b) => new Date(a.dateISO) - new Date(b.dateISO));
    return {
      leagueId,
      round: r,
      firstKickISO: all[0].dateISO,
      nextKickISO:  future[0].dateISO,
      count: future.length,
    };
  }
  return null;
}

export async function fetchCurrentRoundsForLeagues(leagueIds) {
  const all = await Promise.allSettled(
    leagueIds.map(async (id) => {
      const meta = await fetchCurrentRoundMetaByLeague(id);
      const entrants = meta?.round != null
        ? await fetchRoundEntrants(id, meta.round)
        : 0;
      return {
        leagueId: String(id),
        meta: meta ? { ...meta, entrants } : null,
      };
    })
  );
  return all.map((r) => r.status === 'fulfilled'
    ? r.value
    : { leagueId: null, meta: null });
}

// Schedina = una sola giornata. Raccogliamo qualche turno in parallelo, poi
// prendiamo il round con il numero più basso che abbia ancora almeno una
// partita futura: è la "giornata corrente". Gli eventi già finiti dello stesso
// turno vengono scartati (sulla schedina non sono pronosticabili).
//
// Il league può arrivare come id (stringa) o come oggetto della mappa LEAGUES.
// Se arriva solo l'id lo risolviamo, così possiamo leggere `scanRounds` e
// `season` specifici per sport (NBA, F1, ATP hanno range diversi dal calcio).
export async function fetchCurrentRoundByLeague(leagueOrId, seasonOverride) {
  const league = typeof leagueOrId === 'string'
    ? findLeagueById(leagueOrId)
    : leagueOrId;
  if (!league) return { round: null, events: [] };
  const leagueId = league.id;
  const season = seasonOverride || league.season || CURRENT_SEASON;
  const scan = league.scanRounds || FOOTBALL_ROUNDS;
  const results = await Promise.allSettled(
    scan.map((r) => fetchRound(leagueId, r, season))
  );
  const byRound = new Map();
  for (const r of results) {
    if (r.status !== 'fulfilled') continue;
    for (const ev of r.value) {
      const key = Number(ev.round);
      if (!Number.isFinite(key)) continue;
      if (!byRound.has(key)) byRound.set(key, []);
      byRound.get(key).push(ev);
    }
  }
  const rounds = [...byRound.keys()].sort((a, b) => a - b);
  for (const r of rounds) {
    const future = byRound.get(r).filter(isFuture);
    if (future.length === 0) continue;
    future.sort((a, b) => new Date(a.dateISO) - new Date(b.dateISO));
    return { round: r, events: future };
  }
  return { round: null, events: [] };
}
