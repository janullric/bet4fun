import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Screen from '../components/Screen.jsx';
import Icon from '../components/Icon.jsx';
import Funnie from '../components/Funnie.jsx';
import { useApp } from '../context/AppContext.jsx';
import { CONTESTS } from '../lib/contests.js';
import { formatMatchDate, formatCountdown } from '../lib/format.js';

// Mappa league_id → contest (per sapere sport, label e key della schedina).
function contestByLeagueId(leagueId) {
  return CONTESTS.find((c) => String(c.league.id) === String(leagueId)) || null;
}

function roundLabel(sport, n) {
  if (n == null) return '';
  if (sport === 'football') return `${n}ª giornata`;
  return `Turno ${n}`;
}

export default function Schedine() {
  const navigate = useNavigate();
  const { listMyBets, deleteMyBet, isSupabaseConfigured, isAuthed } = useApp();

  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const rows = await listMyBets();
      setBets(rows);
    } catch (e) {
      setError(e?.message || 'Impossibile caricare le schedine.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [isAuthed]);

  const total = useMemo(
    () => bets.reduce((s, b) => s + (Number(b.funnies_awarded) || 0), 0),
    [bets]
  );

  async function handleEdit(b) {
    const c = contestByLeagueId(b.league_id);
    if (!c) {
      alert('Concorso non trovato per questa schedina.');
      return;
    }
    const ok = window.confirm(
      `Modificare la schedina?\n\nLa schedina attuale verrà cancellata e ti saranno restituiti ${b.funnies_awarded} Funnies. ` +
      `Poi potrai rigiocare da zero.`
    );
    if (!ok) return;
    setBusyId(b.bet_id);
    try {
      await deleteMyBet(b.bet_id);
      navigate(`/pronostici/${c.key}`);
    } catch (e) {
      alert(e?.message || 'Errore durante la modifica.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(b) {
    const ok = window.confirm(
      `Cancellare la schedina definitivamente?\n\nTi saranno restituiti ${b.funnies_awarded} Funnies.`
    );
    if (!ok) return;
    setBusyId(b.bet_id);
    try {
      await deleteMyBet(b.bet_id);
      setBets((prev) => prev.filter((x) => x.bet_id !== b.bet_id));
    } catch (e) {
      alert(e?.message || 'Errore durante la cancellazione.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Screen
      title="Le mie schedine"
      subtitle={
        bets.length
          ? `${bets.length} schedine · ${total.toLocaleString('it-IT')} Funnies guadagnati`
          : 'Qui trovi tutte le schedine che hai giocato.'
      }
      onBack={() => navigate('/home')}
    >
      {!isSupabaseConfigured && (
        <div style={{ padding: '0 22px 20px', color: 'rgba(245,246,250,0.7)', fontSize: 13 }}>
          Modalità demo: collega Supabase per vedere le tue schedine reali.
        </div>
      )}

      {error && (
        <div style={{ padding: '0 22px 16px', color: '#FF5A6A', fontSize: 13 }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ padding: '4px 22px 20px', color: 'rgba(245,246,250,0.5)', fontSize: 13 }}>
          Carico le tue schedine…
        </div>
      )}

      {!loading && bets.length === 0 && isSupabaseConfigured && !error && (
        <div style={{ padding: '0 22px' }}>
          <div
            style={{
              background: '#111830',
              border: '1px solid rgba(255,255,255,0.04)',
              borderRadius: 20,
              padding: 22,
              textAlign: 'center',
              color: 'rgba(245,246,250,0.75)',
            }}
          >
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 18, marginBottom: 6 }}>
              Nessuna schedina ancora.
            </div>
            <div style={{ fontSize: 13, marginBottom: 16 }}>
              Gioca la tua prima schedina gratuita: scegli un concorso e pronostica le partite.
            </div>
            <button
              onClick={() => navigate('/pronostici')}
              style={{
                background: '#FFDD2E',
                color: '#0A0F1F',
                border: 0,
                borderRadius: 100,
                padding: '10px 18px',
                fontFamily: 'Space Grotesk',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Vai ai concorsi →
            </button>
          </div>
        </div>
      )}

      <div style={{ padding: '0 22px' }}>
        {bets.map((b) => {
          const c = contestByLeagueId(b.league_id);
          const leagueLabel = c?.league.label || b.league_id;
          const rLabel = roundLabel(c?.sport, b.round);
          const picksCount = Array.isArray(b.picks) ? b.picks.length : 0;
          const editable = !!b.editable;
          const busy = busyId === b.bet_id;
          const countdown = b.first_kickoff_at ? formatCountdown(b.first_kickoff_at) : null;

          return (
            <div
              key={b.bet_id}
              style={{
                background: '#111830',
                border: editable
                  ? '1px solid rgba(34,197,94,0.28)'
                  : '1px solid rgba(255,255,255,0.04)',
                borderRadius: 20,
                padding: 16,
                marginBottom: 10,
                color: '#F5F6FA',
                fontFamily: 'Inter',
                position: 'relative',
                opacity: busy ? 0.6 : 1,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  padding: '3px 8px',
                  borderRadius: 100,
                  background: editable
                    ? 'rgba(34,197,94,0.15)'
                    : 'rgba(255,90,106,0.15)',
                  color: editable ? '#22c55e' : '#FF5A6A',
                  fontSize: 10,
                  fontFamily: 'JetBrains Mono',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  fontWeight: 600,
                }}
              >
                {editable ? 'Aperta' : 'Chiusa'}
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: 'rgba(76,125,255,0.15)',
                    color: '#4C7DFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon name={c?.sport || 'football'} size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontFamily: 'JetBrains Mono',
                      color: 'rgba(245,246,250,0.5)',
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                    }}
                  >
                    {formatMatchDate(b.created_at)}
                  </div>
                  <div
                    style={{
                      fontFamily: 'Space Grotesk',
                      fontSize: 16,
                      fontWeight: 700,
                      letterSpacing: -0.3,
                      marginTop: 2,
                    }}
                  >
                    {leagueLabel}
                    {rLabel && (
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: 13,
                          fontWeight: 500,
                          color: 'rgba(245,246,250,0.6)',
                        }}
                      >
                        · {rLabel}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16, fontSize: 12, marginBottom: 12 }}>
                <Stat label="Pronostici" value={picksCount} />
                <Stat
                  label="Funnies"
                  value={
                    <>
                      <Funnie size={11} /> {Number(b.funnies_awarded || 0).toLocaleString('it-IT')}
                    </>
                  }
                  color="#FFDD2E"
                />
                <Stat
                  label={editable ? 'Inizia tra' : 'Stato'}
                  value={editable ? (countdown || '—') : 'Chiusa'}
                  color={editable ? undefined : '#FF5A6A'}
                />
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                {editable ? (
                  <>
                    <button
                      onClick={() => handleEdit(b)}
                      disabled={busy}
                      style={{
                        flex: 1,
                        background: '#FFDD2E',
                        color: '#0A0F1F',
                        border: 0,
                        borderRadius: 12,
                        padding: '10px 14px',
                        fontFamily: 'Space Grotesk',
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: busy ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Modifica
                    </button>
                    <button
                      onClick={() => handleDelete(b)}
                      disabled={busy}
                      style={{
                        flex: 0.6,
                        background: 'rgba(255,90,106,0.12)',
                        color: '#FF5A6A',
                        border: '1px solid rgba(255,90,106,0.3)',
                        borderRadius: 12,
                        padding: '10px 14px',
                        fontFamily: 'Space Grotesk',
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: busy ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Cancella
                    </button>
                  </>
                ) : (
                  <div style={{ fontSize: 12, color: 'rgba(245,246,250,0.5)', padding: '4px 2px' }}>
                    Giornata chiusa — la schedina non può essere modificata.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Screen>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          fontSize: 10,
          color: 'rgba(245,246,250,0.45)',
          fontFamily: 'JetBrains Mono',
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          marginTop: 2,
          color: color || '#F5F6FA',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        {value}
      </div>
    </div>
  );
}
