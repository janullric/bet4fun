import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Screen from '../components/Screen.jsx';
import Funnie from '../components/Funnie.jsx';
import { useApp } from '../context/AppContext.jsx';
import { findLeagueById } from '../lib/sportsApi.js';
import { formatMatchDate } from '../lib/format.js';

// Archivio delle giornate chiuse: montepremi distribuito, podio, i tuoi punti.
export default function Archivio() {
  const navigate = useNavigate();
  const { listSettledRounds, isSupabaseConfigured } = useApp();
  const [rounds, setRounds] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isSupabaseConfigured) { setRounds([]); return; }
    let alive = true;
    listSettledRounds()
      .then((rows) => { if (alive) setRounds(rows); })
      .catch((e) => { if (alive) { setRounds([]); setError(e?.message || 'Errore.'); } });
    return () => { alive = false; };
  }, [isSupabaseConfigured, listSettledRounds]);

  return (
    <Screen
      title="Archivio"
      subtitle="Le giornate concluse, con vincitori e montepremi."
      onBack={() => navigate('/pronostici')}
    >
      {error && (
        <div style={{ padding: '0 22px 14px', color: '#FF5A6A', fontSize: 13 }}>{error}</div>
      )}
      {rounds == null && (
        <div style={{ padding: '0 22px', color: 'rgba(245,246,250,0.6)', fontSize: 13 }}>Carico…</div>
      )}
      {rounds && rounds.length === 0 && !error && (
        <div style={{ padding: '0 22px' }}>
          <div
            style={{
              background: '#111830',
              border: '1px solid rgba(255,255,255,0.04)',
              borderRadius: 20,
              padding: 22,
              color: 'rgba(245,246,250,0.7)',
              fontSize: 13,
              textAlign: 'center',
              lineHeight: 1.6,
            }}
          >
            Nessuna giornata conclusa ancora.
            <br />
            Qui troverai lo storico: vincitori, montepremi e i tuoi punti.
          </div>
        </div>
      )}
      <div style={{ padding: '0 22px 30px' }}>
        {(rounds || []).map((r, i) => {
          const league = findLeagueById(r.league_id);
          const winners = Array.isArray(r.winners) ? r.winners : [];
          return (
            <div
              key={i}
              style={{
                background: '#111830',
                border: '1px solid rgba(255,255,255,0.04)',
                borderRadius: 18,
                padding: 16,
                marginBottom: 10,
                color: '#F5F6FA',
                fontFamily: 'Inter',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 16 }}>
                  {league?.label || r.league_id}
                  <span style={{ fontWeight: 500, fontSize: 13, color: 'rgba(245,246,250,0.55)', marginLeft: 6 }}>
                    · {league?.sport === 'football' ? `${r.round}ª giornata` : `Turno ${r.round}`}
                  </span>
                </div>
                <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: 'rgba(245,246,250,0.45)' }}>
                  {formatMatchDate(r.distributed_at)}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 13 }}>
                <span style={{ color: 'rgba(245,246,250,0.55)' }}>Montepremi</span>
                <span style={{ color: '#FFDD2E', fontFamily: 'JetBrains Mono', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Funnie size={12} /> {Number(r.prize_pool).toLocaleString('it-IT')}
                </span>
                <span style={{ color: 'rgba(245,246,250,0.3)' }}>·</span>
                <span style={{ color: 'rgba(245,246,250,0.55)' }}>Tu</span>
                <span style={{ color: '#4C7DFF', fontFamily: 'JetBrains Mono', fontWeight: 700 }}>
                  {r.my_points} pt
                </span>
              </div>

              {winners.map((w, j) => (
                <div
                  key={j}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 12,
                    padding: '6px 10px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 8,
                    marginBottom: 4,
                  }}
                >
                  <span>
                    {j === 0 ? '🥇' : j === 1 ? '🥈' : '🥉'} {w.nick}
                  </span>
                  <span style={{ color: '#FFDD2E', fontFamily: 'JetBrains Mono', fontWeight: 700 }}>
                    +{Number(w.amount).toLocaleString('it-IT')}
                  </span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </Screen>
  );
}
