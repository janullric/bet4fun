// Roster UCI per le classiche di primavera / grandi giri.
//
// TheSportsDB free tier non espone la start-list di una gara specifica:
// l'endpoint `lookuphonours` e `lookupplayer` esistono ma non c'è un mapping
// "iscritti a questa tappa". Finché non saliamo di tier, teniamo qui una
// rosa dei ~30 corridori principali del circuito World Tour. Da aggiornare
// a ogni inizio stagione o dopo cambi di team rilevanti.

export const CYCLING_SEASON_LABEL = '2026';

export const CYCLING_RIDERS = [
  { id: 'pog', name: 'Tadej Pogačar',     team: 'UAE Team Emirates'   },
  { id: 'vin', name: 'Jonas Vingegaard',  team: 'Visma | Lease a Bike' },
  { id: 'rog', name: 'Primož Roglič',     team: 'Red Bull-Bora'       },
  { id: 'eva', name: 'Remco Evenepoel',   team: 'Soudal Quick-Step'   },
  { id: 'ayu', name: 'Juan Ayuso',        team: 'UAE Team Emirates'   },
  { id: 'ala', name: 'Julian Alaphilippe', team: 'Tudor Pro Cycling'  },
  { id: 'van', name: 'Mathieu van der Poel', team: 'Alpecin-Deceuninck' },
  { id: 'wva', name: 'Wout van Aert',     team: 'Visma | Lease a Bike' },
  { id: 'ped', name: 'Mads Pedersen',     team: 'Lidl-Trek'           },
  { id: 'phi', name: 'Filippo Ganna',     team: 'INEOS Grenadiers'    },
  { id: 'alm', name: 'Juan Pedro López',  team: 'Lidl-Trek'           },
  { id: 'rod', name: 'Carlos Rodríguez',  team: 'INEOS Grenadiers'    },
  { id: 'buc', name: 'Thomas Pidcock',    team: 'Q36.5'               },
  { id: 'jor', name: 'Giulio Ciccone',    team: 'Lidl-Trek'           },
  { id: 'are', name: 'Santiago Buitrago', team: 'Bahrain Victorious'  },
  { id: 'hin', name: 'Ben O\u2019Connor',  team: 'Jayco-AlUla'         },
  { id: 'dma', name: 'Derek Gee',         team: 'Israel - Premier Tech' },
  { id: 'mar', name: 'Alberto Bettiol',   team: 'XDS Astana'          },
  { id: 'mer', name: 'Matej Mohorič',     team: 'Bahrain Victorious'  },
  { id: 'pow', name: 'Tim Merlier',       team: 'Soudal Quick-Step'   },
  { id: 'kri', name: 'Jasper Philipsen',  team: 'Alpecin-Deceuninck'  },
  { id: 'gir', name: 'Dylan Groenewegen', team: 'Jayco-AlUla'         },
  { id: 'fer', name: 'Biniam Girmay',     team: 'Intermarché-Wanty'   },
  { id: 'kwi', name: 'Michał Kwiatkowski', team: 'INEOS Grenadiers'   },
  { id: 'lan', name: 'Attila Valter',     team: 'Visma | Lease a Bike' },
  { id: 'laf', name: 'Romain Bardet',     team: 'DSM-Firmenich PostNL' },
  { id: 'jak', name: 'Lennard Kämna',     team: 'Lidl-Trek'           },
  { id: 'hay', name: 'Lucas Hamilton',    team: 'Jayco-AlUla'         },
  { id: 'koo', name: 'Kévin Vauquelin',   team: 'Arkéa-B&B Hotels'    },
  { id: 'sag', name: 'Sepp Kuss',         team: 'Visma | Lease a Bike' },
];

export const CYCLING_POSITIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function cyclingRiderById(id) {
  return CYCLING_RIDERS.find((r) => r.id === id) || null;
}

// Tutte le "tappe" di una stagione UCI sono rappresentate come eventi in
// TheSportsDB. Non c'è da classificare: ogni evento future è un pronostico
// valido. L'UI però preferisce mostrare SOLO la gara imminente, per evitare
// che l'utente esaurisca pick in anticipo. La scelta è: prendere la prossima
// gara in ordine cronologico.
export function nextCyclingRace(events) {
  const list = (events || []).filter((e) => e.dateISO);
  if (!list.length) return null;
  return [...list].sort((a, b) => new Date(a.dateISO) - new Date(b.dateISO))[0];
}
