// Elenco dei concorsi aperti. Ogni concorso è una lega con un montepremi
// *trasparente*: base garantita dall'editoriale + quota per ogni iscritto
// alla giornata (Art. 8-11 del regolamento).
//
//   montepremi(round) = basePool + entrants(round) × perEntrant
//
// La card pronostici mostra il calcolo in chiaro ("Base 7 500 + 42 × 100").
// Il campo `points` è il valore di partenza (basePool) usato come fallback
// visivo finché non arrivano gli entrants da Supabase.

import { LEAGUES } from './sportsApi.js';

export const CONTESTS = [
  // --- Mondiali 2026 (evento clou: in cima alla lista) ---
  { key: 'worldcup', league: LEAGUES.worldcup, sport: 'football', sub: 'USA · Canada · Messico', basePool: 15000, perEntrant: 150, points: 15000, urgent: true },

  // --- Calcio ---
  { key: 'serieA',  league: LEAGUES.serieA,  sport: 'football',   sub: 'Prossima giornata', basePool: 7500, perEntrant: 100, points: 7500, urgent: true },
  { key: 'premier', league: LEAGUES.premier, sport: 'football',   sub: 'Prossima giornata', basePool: 7000, perEntrant: 100, points: 7000 },
  { key: 'laLiga',  league: LEAGUES.laLiga,  sport: 'football',   sub: 'Prossima giornata', basePool: 6500, perEntrant: 100, points: 6500 },
  { key: 'bundes',  league: LEAGUES.bundes,  sport: 'football',   sub: 'Prossima giornata', basePool: 5500, perEntrant: 80,  points: 5500 },
  { key: 'ligue1',  league: LEAGUES.ligue1,  sport: 'football',   sub: 'Prossima giornata', basePool: 5000, perEntrant: 80,  points: 5000 },
  { key: 'mls',     league: LEAGUES.mls,     sport: 'football',   sub: 'Prossima giornata', basePool: 3000, perEntrant: 60,  points: 3000 },
  { key: 'ucl',     league: LEAGUES.ucl,     sport: 'football',   sub: 'Prossimo turno',    basePool: 9000, perEntrant: 120, points: 9000, urgent: true },
  { key: 'uel',     league: LEAGUES.uel,     sport: 'football',   sub: 'Prossimo turno',    basePool: 6000, perEntrant: 100, points: 6000 },

  // --- Basket ---
  { key: 'nba',        league: LEAGUES.nba,        sport: 'basketball', sub: 'Prossima giornata', basePool: 6000, perEntrant: 90,  points: 6000 },
  { key: 'euroleague', league: LEAGUES.euroleague, sport: 'basketball', sub: 'Prossima giornata', basePool: 4500, perEntrant: 70,  points: 4500 },

  // --- Tennis ---
  { key: 'atp', league: LEAGUES.atp, sport: 'tennis', sub: 'Torneo in corso', basePool: 4500, perEntrant: 70, points: 4500 },
  { key: 'wta', league: LEAGUES.wta, sport: 'tennis', sub: 'Torneo in corso', basePool: 3500, perEntrant: 60, points: 3500 },

  // --- Motorsport ---
  { key: 'f1',     league: LEAGUES.f1,     sport: 'motorsport', sub: 'Prossimo GP', basePool: 8000, perEntrant: 120, points: 8000 },
  { key: 'motogp', league: LEAGUES.motogp, sport: 'motorsport', sub: 'Prossimo GP', basePool: 5000, perEntrant: 80,  points: 5000 },

  // --- Ciclismo ---
  { key: 'uci', league: LEAGUES.uci, sport: 'cycling', sub: 'Prossima gara', basePool: 5500, perEntrant: 70, points: 5500 },

  // --- USA sports ---
  { key: 'nhl', league: LEAGUES.nhl, sport: 'icehockey',         sub: 'Prossima giornata', basePool: 4000, perEntrant: 60, points: 4000 },
  { key: 'mlb', league: LEAGUES.mlb, sport: 'baseball',          sub: 'Prossima giornata', basePool: 3500, perEntrant: 60, points: 3500 },
  { key: 'nfl', league: LEAGUES.nfl, sport: 'americanfootball',  sub: 'Prossima giornata', basePool: 7500, perEntrant: 110, points: 7500 },

  // --- Fighting ---
  { key: 'ufc', league: LEAGUES.ufc, sport: 'fighting', sub: 'Prossima card', basePool: 4500, perEntrant: 70, points: 4500 },
];

export function findContest(key) {
  return CONTESTS.find((c) => c.key === key) || null;
}

// Formula montepremi secondo regolamento Art. 8-11: base editoriale +
// quota per ogni iscritto alla manches. Ritorna l'intero in Funnies.
export function computePrizePool(contest, entrants) {
  if (!contest) return 0;
  const base = Number(contest.basePool) || 0;
  const per  = Number(contest.perEntrant) || 0;
  const n    = Math.max(0, Number(entrants) || 0);
  return base + n * per;
}
