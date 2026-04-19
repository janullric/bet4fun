// Griglia piloti F1 per la stagione di riferimento.
//
// TheSportsDB free tier non espone una roster affidabile per i singoli GP,
// quindi manteniamo la lista qui. Da aggiornare a ogni cambio di griglia
// (trasferimenti, reserve, wildcard) — al volo basta modificare questo file.

export const F1_SEASON_LABEL = '2026';

export const F1_DRIVERS = [
  { id: 'ver', name: 'Max Verstappen',     team: 'Red Bull'     },
  { id: 'law', name: 'Liam Lawson',        team: 'Red Bull'     },
  { id: 'rus', name: 'George Russell',     team: 'Mercedes'     },
  { id: 'ant', name: 'Andrea K. Antonelli', team: 'Mercedes'    },
  { id: 'lec', name: 'Charles Leclerc',    team: 'Ferrari'      },
  { id: 'ham', name: 'Lewis Hamilton',     team: 'Ferrari'      },
  { id: 'nor', name: 'Lando Norris',       team: 'McLaren'      },
  { id: 'pia', name: 'Oscar Piastri',      team: 'McLaren'      },
  { id: 'alo', name: 'Fernando Alonso',    team: 'Aston Martin' },
  { id: 'str', name: 'Lance Stroll',       team: 'Aston Martin' },
  { id: 'sai', name: 'Carlos Sainz',       team: 'Williams'     },
  { id: 'alb', name: 'Alexander Albon',    team: 'Williams'     },
  { id: 'gas', name: 'Pierre Gasly',       team: 'Alpine'       },
  { id: 'doo', name: 'Jack Doohan',        team: 'Alpine'       },
  { id: 'tsu', name: 'Yuki Tsunoda',       team: 'RB'           },
  { id: 'had', name: 'Isack Hadjar',       team: 'RB'           },
  { id: 'hul', name: 'Nico Hulkenberg',    team: 'Sauber'       },
  { id: 'bor', name: 'Gabriel Bortoleto',  team: 'Sauber'       },
  { id: 'oco', name: 'Esteban Ocon',       team: 'Haas'         },
  { id: 'bea', name: 'Oliver Bearman',     team: 'Haas'         },
];

export function f1DriverById(id) {
  return F1_DRIVERS.find((d) => d.id === id) || null;
}

// Un evento F1 è un sub-evento dentro un weekend (Practice, Qualifying, Sprint,
// Race). Pronostichiamo solo Qualifying e Race: quelli valgono per il punteggio.
export function classifyF1Event(event) {
  const name = (event.event || event.strEvent || '').toLowerCase();
  // L'ordine conta: "Sprint Qualifying" contiene anche "qualifying",
  // quindi i check più specifici vanno prima.
  if (name.includes('sprint')) return null;
  if (name.includes('practice') || name.includes('prove')) return null;
  if (name.includes('qualifying') || name.includes('qualifica')) return 'qualifying';
  return 'race';
}

export const F1_POSITIONS = [1, 2, 3, 4, 5];
