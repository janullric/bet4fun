import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Screen from '../components/Screen.jsx';
import Icon from '../components/Icon.jsx';
import Funnie from '../components/Funnie.jsx';
import SectionHeader from '../components/SectionHeader.jsx';
import { useApp } from '../context/AppContext.jsx';

// Sfida del mese: stato + top 50 + posizione dell'utente corrente.
// Dati da RPC `monthly_challenge_state()` che ritorna { year, month, pool,
// my_points, my_rank, participants, leaderboard: [{nick, points, funnies}] }.
export default function SfidaMese() {
  const navigate = useNavigate();
  const { monthlyChallenge, isSupabaseConfigured } = useApp();

  const [state, setState] = useState(null);
  const [loading, setLoad] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoad(false); return; }
    let alive = true;
    setLoad(true);
    monthlyChallenge()
      .then((row) => { if (alive) { setState(row); setErr(null); } })
      .catch((e) => { if (alive) setErr(e?.message || 'Errore.'); })
      .finally(() => { if (alive) setLoad(false); });
    return () => { alive = false; };
  }, [monthlyChallenge, isSupabaseConfigured]);

  if (!isSupabaseConfigured) {
    return (
      <Screen title="Sfida del mese" subtitle="Monte premi mensile">
        <div style={{ padding: '0 22px', color: 'rgba(245,246,250,0.6)' }}>
          Configura Supabase per attivare la Sfida del mese.
        </div>
      </Screen>
    );
  }

  const pool = Number(state?.prize_pool ?? 0);
  const myPts = Number(state?.my_points ?? 0);
  const myRank = state?.my_rank ?? null;
  const participants = state?.participants ?? 0;
  const leaderboard = Array.isArray(state?.leaderboard) ? state.leaderboard : [];
  const monthLabel = state
    ? new Date(state.year, (state.month ?? 1) - 1, 1).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
    : '';

  return (
    <Screen
      title="Sfida del mese"
      subtitle={monthLabel ? `Stagione ${monthLabel}` : 'Monte premi mensile'}
    >
      <div style={{ padding: '0 22px 20px' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #1A2240 0%, #2952D9 100%)',
            borderRadius: 22,
            padding: 20,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute', right: -20, bottom: -40,
              fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 140,
              color: 'rgba(255,255,255,0.04)', letterSpacing: -8, lineHeight: 1,
            }}
          >
            {state?.month ?? ''}
          </div>
          <div
            style={{
              fontSize: 11, fontFamily: 'JetBrains Mono', color: '#FFDD2E',
              textTransform: 'uppercase', letterSpacing: 1.5,
            }}
          >
            Monte premi
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
            <Funnie size={30} />
            <div
              style={{
                fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 40,
                letterSpacing: -1.2, lineHeight: 1,
              }}
            >
              {pool.toLocaleString('it-IT')}
            </div>
          </div>
          <div style={{ marginTop: 14, fontSize: 13, color: 'rgba(245,246,250,0.75)' }}>
            {participants.toLocaleString('it-IT')} partecipanti · 20% al primo, resto distribuito a cascata (Art. 9)
          </div>

          <div
            style={{
              marginTop: 16, padding: 12, borderRadius: 14,
              background: 'rgba(0,0,0,0.25)',
              display: 'flex', gap: 14, alignItems: 'center',
            }}
          >
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 10, fontFamily: 'JetBrains Mono',
                  color: 'rgba(245,246,250,0.6)', textTransform: 'uppercase', letterSpacing: 1,
                }}
              >
                La tua posizione
              </div>
              <div
                style={{
                  fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 28,
                  letterSpacing: -0.8, lineHeight: 1, marginTop: 4,
                }}
              >
                {myRank != null ? `#${myRank}` : '—'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontSize: 10, fontFamily: 'JetBrains Mono',
                  color: 'rgba(245,246,250,0.6)', textTransform: 'uppercase', letterSpacing: 1,
                }}
              >
                I tuoi punti
              </div>
              <div
                style={{
                  fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 22,
                  letterSpacing: -0.6, lineHeight: 1, marginTop: 4, color: '#FFDD2E',
                }}
              >
                {myPts.toLocaleString('it-IT')}
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/pronostici')}
            style={{
              marginTop: 14, width: '100%', background: '#FFDD2E', color: '#0A0F1F',
              border: 0, borderRadius: 100, padding: '12px 20px',
              fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}
          >
            Pronostica la prossima manche →
          </button>
        </div>
      </div>

      <SectionHeader title="Top 50 del mese" />
      <div style={{ padding: '0 22px 30px' }}>
        {loading && <div style={{ color: 'rgba(245,246,250,0.6)', fontSize: 13 }}>Carico la classifica…</div>}
        {err && <div style={{ color: '#FF5A6A', fontSize: 13 }}>{err}</div>}
        {!loading && !err && leaderboard.length === 0 && (
          <div
            style={{
              background: '#111830', borderRadius: 16, padding: 18,
              border: '1px solid rgba(255,255,255,0.04)',
              color: 'rgba(245,246,250,0.65)', fontSize: 13,
            }}
          >
            Nessuno ha ancora giocato questo mese. Fai la prima mossa!
          </div>
        )}
        {leaderboard.map((row, i) => (
          <Row key={row.nick || i} rank={i + 1} {...row} />
        ))}
      </div>
    </Screen>
  );
}

function Row({ rank, nick, points, funnies, is_me }) {
  const medal = rank === 1 ? '#FFDD2E' : rank === 2 ? '#C0C0CC' : rank === 3 ? '#CD7F32' : null;
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
        marginBottom: 6,
        background: is_me ? 'rgba(255,221,46,0.08)' : '#111830',
        border: is_me ? '1px solid rgba(255,221,46,0.3)' : '1px solid rgba(255,255,255,0.04)',
        borderRadius: 14, color: '#F5F6FA',
      }}
    >
      <div
        style={{
          width: 30, height: 30, borderRadius: 9,
          background: medal || 'rgba(255,255,255,0.06)',
          color: medal ? '#0A0F1F' : 'rgba(245,246,250,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 13,
        }}
      >
        {rank}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          <Link to={`/u/${encodeURIComponent(nick)}`} style={{ color: 'inherit', textDecoration: 'none' }}>
            {nick}
          </Link>
          {is_me && <span style={{ color: '#FFDD2E', marginLeft: 6, fontSize: 11 }}>· TU</span>}
        </div>
        {funnies != null && (
          <div
            style={{
              fontSize: 11, color: 'rgba(245,246,250,0.5)', marginTop: 1,
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            <Funnie size={10} /> {Number(funnies).toLocaleString('it-IT')}
          </div>
        )}
      </div>
      <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 15 }}>
        {Number(points ?? 0).toLocaleString('it-IT')}
      </div>
    </div>
  );
}
