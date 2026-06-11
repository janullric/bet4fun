// Griglia piloti MotoGP per la stagione di riferimento.
//
// Come per la F1 (vedi f1.js): TheSportsDB free tier non espone una roster
// affidabile, quindi la lista vive qui. Da aggiornare a ogni cambio di
// griglia (mercato piloti, infortuni, wildcard).

export const MOTOGP_SEASON_LABEL = '2026';

export const MOTOGP_RIDERS = [
  { id: 'bag', name: 'Francesco Bagnaia',    team: 'Ducati'     },
  { id: 'mmq', name: 'Marc Marquez',         team: 'Ducati'     },
  { id: 'amq', name: 'Alex Marquez',         team: 'Gresini'    },
  { id: 'ald', name: 'Fermin Aldeguer',      team: 'Gresini'    },
  { id: 'dig', name: 'Fabio Di Giannantonio', team: 'VR46'      },
  { id: 'mor', name: 'Franco Morbidelli',    team: 'VR46'       },
  { id: 'mar', name: 'Jorge Martin',         team: 'Aprilia'    },
  { id: 'bez', name: 'Marco Bezzecchi',      team: 'Aprilia'    },
  { id: 'rfe', name: 'Raul Fernandez',       team: 'Trackhouse' },
  { id: 'ogu', name: 'Ai Ogura',             team: 'Trackhouse' },
  { id: 'aco', name: 'Pedro Acosta',         team: 'KTM'        },
  { id: 'bin', name: 'Brad Binder',          team: 'KTM'        },
  { id: 'bas', name: 'Enea Bastianini',      team: 'Tech3'      },
  { id: 'vin', name: 'Maverick Viñales',     team: 'Tech3'      },
  { id: 'qua', name: 'Fabio Quartararo',     team: 'Yamaha'     },
  { id: 'rin', name: 'Alex Rins',            team: 'Yamaha'     },
  { id: 'mil', name: 'Jack Miller',          team: 'Pramac'     },
  { id: 'raz', name: 'Toprak Razgatlioglu',  team: 'Pramac'     },
  { id: 'mir', name: 'Joan Mir',             team: 'Honda HRC'  },
  { id: 'mrn', name: 'Luca Marini',          team: 'Honda HRC'  },
  { id: 'zar', name: 'Johann Zarco',         team: 'LCR'        },
  { id: 'mre', name: 'Diogo Moreira',        team: 'LCR'        },
];

export function motogpRiderById(id) {
  return MOTOGP_RIDERS.find((r) => r.id === id) || null;
}
