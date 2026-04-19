import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Screen from '../components/Screen.jsx';
import Icon from '../components/Icon.jsx';
import Funnie from '../components/Funnie.jsx';
import { formatMatchDate, formatCountdown } from '../lib/format.js';
import { useCurrentRoundByLeague } from '../hooks/useEvents.js';
import { useApp } from '../context/AppContext.jsx';
import { CYCLING_RIDERS, CYCLING_POSITIONS, nextCyclingRace } from '../lib/cycling.js';

// Ciclismo: una sola gara alla volta (la prossima in calendario). L'utente
// compone la propria top-10 scegliendo un pilota per ogni posizione, senza
// duplicati.
export default function SchedinaCycling({ contest }) {
  const navigate = useNavigate();
  const { submitBet, isSupabaseConfigured } = useApp();

  const { data: roundData, loading, error } = useCurrentRoundByLeague(contest?.league || null);
  const race = useMemo(() => nextCyclingRace(roundData?.events), [roundData]);
  const roundNumber = roundData?.round;

  // picks[pos] = riderId
  const [picks, setPicks] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitted, setSubmitted] = useState(null);

  const setPick = (pos, riderId) =>
    setPicks((p) => ({ ...p, [pos]: riderId }));

  const completedPicks = CYCLING_POSITIONS.filter((p) => picks[p]).length;
  const chosenIds = Object.values(picks).filter(Boolean);
  const hasDupes = chosenIds.length !== new Set(chosenIds).size;
  const canSubmit = race && completedPicks === CYCLING_POSITIONS.length && !hasDupes && !submitting;

  const countdown = race ? formatCountdown(race.dateISO) : '';

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = CYCLING_POSITIONS.map((p) => ({
        eventId: race.id,
        outcome: `p${p}:${picks[p]}`,
      }));
      const res = await submitBet({
        leagueId: contest.league.id,
        round: Number(roundNumber) || null,
        picks: payload,
      });
      setSubmitted(res);
    } catch (e) {
      const msg = e?.message || '';
      if (msg.includes('duplicate key') || msg.includes('unique')) {
        setSubmitError('Hai già confermato la schedina di questa gara.');
      } else if (msg.toLowerCase().includes('round locked')) {
        setSubmitError('Tappa/gara chiusa — non è più possibile pronosticare.');
      } else {
        setSubmitError(msg || 'Errore durante il salvataggio.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div
        style={{
          minHeight: '60vh',
          background: '#0A0F1F',
          color: '#F5F6FA',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Inter',
        }}
      >
        <div
          style={{
            flex: 1,
            padding: '60px 30px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          <div
            className="b4f-pop"
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              marginBottom: 28,
              background: 'radial-gradient(circle at 30% 30%, #3DDC97, #1ea868)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 20px 50px rgba(61,220,151,0.35)',
            }}
          >
            <Icon name="check" size={46} color="#0A0F1F" stroke={3} />
          </div>
          <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 30, letterSpacing: -1 }}>
            Top-10 confermata!
          </div>
          <div style={{ color: 'rgba(245,246,250,0.6)', fontSize: 15, marginTop: 10, maxWidth: 280 }}>
            Piloti pronti al via per {race?.event}.
          </div>
          <div
            style={{
              marginTop: 28,
              padding: '14px 22px',
              background: 'rgba(26,34,64,0.6)',
              borderRadius: 18,
              border: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              gap: 24,
              alignItems: 'center',
            }}
          >
            <SummaryStat label="Posizioni" value={`10/10`} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Funnie size={22} />
              <SummaryStat label="Funnies accreditati" value={`+${submitted.bonus}`} accent />
            </div>
          </div>
          {submitted.newFunnies != null && (
            <div style={{ marginTop: 12, color: 'rgba(245,246,250,0.6)', fontSize: 13, fontFamily: 'JetBrains Mono' }}>
              Nuovo saldo: {submitted.newFunnies.toLocaleString('it-IT')}
            </div>
          )}
          {submitted.demo && (
            <div style={{ marginTop: 10, color: 'rgba(255,221,46,0.8)', fontSize: 12 }}>
              Modalità demo: nessuna scrittura su DB.
            </div>
          )}
        </div>
        <div style={{ padding: '0 22px 40px' }}>
          <button
            onClick={() => navigate('/pronostici')}
            style={{
              width: '100%',
              background: '#FFDD2E',
              color: '#0A0F1F',
              border: 0,
              borderRadius: 100,
              padding: 16,
              fontFamily: 'Space Grotesk',
              fontWeight: 700,
              fontSize: 15,
              cursor: 'pointer',
            }}
          >
            Altri concorsi
          </button>
        </div>
      </div>
    );
  }

  return (
    <Screen
      title={contest.league.label}
      subtitle={race ? race.event : contest.sub}
      onBack={() => navigate('/pronostici')}
      headerRight={
        <div
          style={{
            padding: '6px 12px',
            background: 'rgba(255,221,46,0.1)',
            border: '1px solid rgba(255,221,46,0.2)',
            borderRadius: 100,
            fontSize: 12,
            fontFamily: 'JetBrains Mono',
            color: '#FFDD2E',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <span className="b4f-pulse" style={{ width: 5, height: 5, borderRadius: 3, background: '#FF5A6A' }} />
          {countdown || '—'}
        </div>
      }
    >
      {loading && (
        <div style={{ padding: '0 22px 20px', color: 'rgba(245,246,250,0.6)' }}>
          Carico la prossima gara UCI…
        </div>
      )}
      {error && (
        <div style={{ padding: '0 22px 20px', color: '#FF5A6A' }}>
          Errore nel caricare la gara. Riprova tra poco.
        </div>
      )}
      {!loading && !error && !race && (
        <div style={{ padding: '0 22px 20px', color: 'rgba(245,246,250,0.6)' }}>
          Nessuna gara in programma in questo momento.
        </div>
      )}

      {race && (
        <>
          <div style={{ padding: '0 22px 20px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 8,
                fontSize: 12,
                color: 'rgba(245,246,250,0.6)',
              }}
            >
              <span>
                {completedPicks} di 10 posizioni scelte
              </span>
              <span style={{ fontFamily: 'JetBrains Mono', color: '#FFDD2E' }}>
                +{completedPicks * 10} Funnies
              </span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${(completedPicks / 10) * 100}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #FFDD2E, #E6A617)',
                  borderRadius: 3,
                  transition: 'width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              />
            </div>
          </div>

          <div style={{ padding: '0 22px 16px' }}>
            <div
              style={{
                background: '#111830',
                borderRadius: 20,
                padding: 18,
                border: hasDupes
                  ? '1px solid rgba(255,90,106,0.4)'
                  : '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div
                  style={{
                    fontSize: 10,
                    fontFamily: 'JetBrains Mono',
                    color: 'rgba(245,246,250,0.5)',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                  }}
                >
                  Gara
                </div>
                <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: '#4C7DFF' }}>
                  {formatMatchDate(race.dateISO)}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {CYCLING_POSITIONS.map((pos) => (
                  <div
                    key={pos}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '44px 1fr',
                      gap: 10,
                      alignItems: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: 'rgba(255,221,46,0.1)',
                        color: '#FFDD2E',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'Space Grotesk',
                        fontWeight: 800,
                        fontSize: 18,
                      }}
                    >
                      P{pos}
                    </div>
                    <select
                      value={picks[pos] || ''}
                      onChange={(e) => setPick(pos, e.target.value || null)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 12,
                        background: picks[pos] ? 'rgba(255,221,46,0.08)' : 'rgba(255,255,255,0.04)',
                        color: '#F5F6FA',
                        border: picks[pos]
                          ? '1px solid rgba(255,221,46,0.4)'
                          : '1px solid rgba(255,255,255,0.06)',
                        fontFamily: 'Inter',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer',
                        appearance: 'none',
                      }}
                    >
                      <option value="">Scegli corridore…</option>
                      {CYCLING_RIDERS.map((r) => (
                        <option key={r.id} value={r.id} style={{ background: '#0A0F1F' }}>
                          {r.name} — {r.team}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {hasDupes && (
                <div style={{ marginTop: 10, color: '#FF5A6A', fontSize: 12 }}>
                  Non puoi mettere lo stesso corridore in due posizioni.
                </div>
              )}
            </div>
          </div>

          <div style={{ padding: '16px 22px 30px' }}>
            {submitError && (
              <div
                style={{
                  marginBottom: 12,
                  padding: '10px 14px',
                  background: 'rgba(255,90,106,0.1)',
                  border: '1px solid rgba(255,90,106,0.3)',
                  borderRadius: 12,
                  color: '#FF5A6A',
                  fontSize: 13,
                }}
              >
                {submitError}
              </div>
            )}
            {!isSupabaseConfigured && (
              <div
                style={{
                  marginBottom: 12,
                  padding: '10px 14px',
                  background: 'rgba(255,221,46,0.08)',
                  border: '1px solid rgba(255,221,46,0.25)',
                  borderRadius: 12,
                  color: 'rgba(255,221,46,0.9)',
                  fontSize: 12,
                }}
              >
                Modalità demo: la schedina non viene salvata.
              </div>
            )}
            <button
              disabled={!canSubmit}
              onClick={handleSubmit}
              style={{
                width: '100%',
                background: canSubmit ? '#FFDD2E' : 'rgba(255,255,255,0.06)',
                color: canSubmit ? '#0A0F1F' : 'rgba(245,246,250,0.3)',
                border: 0,
                borderRadius: 100,
                padding: 18,
                fontFamily: 'Space Grotesk',
                fontWeight: 700,
                fontSize: 16,
                cursor: canSubmit ? 'pointer' : 'not-allowed',
                boxShadow: canSubmit ? '0 8px 24px rgba(255,221,46,0.25)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              {submitting
                ? 'Salvataggio…'
                : canSubmit
                  ? `Conferma e guadagna +${completedPicks * 10} Funnies`
                  : hasDupes
                    ? 'Rimuovi i duplicati per continuare'
                    : `Completa ${10 - completedPicks} posizioni ancora`}
            </button>
          </div>
        </>
      )}
    </Screen>
  );
}

function SummaryStat({ label, value, accent }) {
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          color: 'rgba(245,246,250,0.45)',
          fontFamily: 'JetBrains Mono',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'Space Grotesk',
          fontWeight: 700,
          fontSize: 22,
          color: accent ? '#FFDD2E' : '#F5F6FA',
        }}
      >
        {value}
      </div>
    </div>
  );
}
