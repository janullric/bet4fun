import { useEffect, useState } from 'react';
import {
  fetchUpcomingByLeague,
  fetchUpcomingForLeagues,
  fetchEventById,
  fetchCurrentRoundByLeague,
  fetchCurrentRoundsForLeagues,
} from '../lib/sportsApi.js';

// Hook generico per sorgenti async. Evita stato inconsistente in caso di
// unmount con un flag local.
function useAsync(run, deps, refreshOnFocus = false) {
  const [state, setState] = useState({ data: null, loading: true, error: null });

  useEffect(() => {
    let alive = true;
    const fetchOnce = (showLoading) => {
      if (showLoading) setState((s) => ({ ...s, loading: true, error: null }));
      run()
        .then((data) => alive && setState({ data, loading: false, error: null }))
        .catch((error) => alive && setState((s) => ({ ...s, loading: false, error })));
    };
    fetchOnce(true);

    // Riaggiorna quando l'utente torna sulla scheda (es. montepremi/iscritti
    // che nel frattempo sono cambiati), senza mostrare lo spinner.
    let onFocus;
    if (refreshOnFocus && typeof document !== 'undefined') {
      onFocus = () => { if (document.visibilityState === 'visible') fetchOnce(false); };
      document.addEventListener('visibilitychange', onFocus);
      window.addEventListener('focus', onFocus);
    }
    return () => {
      alive = false;
      if (onFocus) {
        document.removeEventListener('visibilitychange', onFocus);
        window.removeEventListener('focus', onFocus);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}

export function useUpcomingByLeague(leagueId, limit = 15) {
  return useAsync(
    () => (leagueId ? fetchUpcomingByLeague(leagueId, limit) : Promise.resolve([])),
    [leagueId, limit]
  );
}

export function useUpcomingForLeagues(leagueIds, perLeague = 5) {
  // leagueIds viene joinato per non ricreare la dep a ogni render.
  const key = leagueIds.join(',');
  return useAsync(() => fetchUpcomingForLeagues(leagueIds, perLeague), [key, perLeague]);
}

export function useEvent(eventId) {
  return useAsync(() => fetchEventById(eventId), [eventId]);
}

export function useCurrentRoundsForLeagues(leagueIds) {
  const key = leagueIds.join(',');
  // refreshOnFocus: il montepremi/iscritti si riaggiorna al ritorno sulla pagina.
  return useAsync(() => fetchCurrentRoundsForLeagues(leagueIds), [key], true);
}

export function useCurrentRoundByLeague(leagueOrId) {
  const key = typeof leagueOrId === 'string' ? leagueOrId : leagueOrId?.id || null;
  return useAsync(
    () =>
      leagueOrId
        ? fetchCurrentRoundByLeague(leagueOrId)
        : Promise.resolve({ round: null, events: [] }),
    [key]
  );
}
