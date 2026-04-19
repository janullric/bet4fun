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
function useAsync(run, deps) {
  const [state, setState] = useState({ data: null, loading: true, error: null });

  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    run()
      .then((data) => alive && setState({ data, loading: false, error: null }))
      .catch((error) => alive && setState({ data: null, loading: false, error }));
    return () => {
      alive = false;
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
  return useAsync(() => fetchCurrentRoundsForLeagues(leagueIds), [key]);
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
