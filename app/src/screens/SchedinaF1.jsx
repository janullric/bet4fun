import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Screen from '../components/Screen.jsx';
import Icon from '../components/Icon.jsx';
import Funnie from '../components/Funnie.jsx';
import { formatMatchDate, formatCountdown } from '../lib/format.js';
import { useCurrentRoundByLeague } from '../hooks/useEvents.js';
import { useApp } from '../context/AppContext.jsx';
import { F1_DRIVERS, F1_POSITIONS, classifyF1Event } from '../lib/f1.js';

// UI F1 dedicata: per ogni sessione pronosticabile (Qualifica + Gara del
// weekend corrente) l'utente sceglie le prime 5 posizioni. Ogni posizione
// = 1 pick salvata come outcome "p{N}:{driverId}".
export default function SchedinaF1({ contest }) {
  const navigate = useNavigate();
  const {
    submitBet, isSupabaseConfigured, isAuthed, listMyBets, deleteMyBet,
  } = useApp();

  const { data: roundData, loading, error } = useCurrentRoundByLeague(contest?.league || null);
  const allEvents = roundData?.events || [];
  const roundNumber = roundData?.round;

  // Filtra gli eventi pronosticabili (qualifica + gara) e annota il tipo.
  const sessions = useMemo(() => {
    return allEvents
      .map((e) => ({ ...e, kind: classifyF1Event(e) }))
      .filter((e) => e.kind);
  }, [allEvents]);

  // picks[eventId][pos] = driverId
  const [picks, setPicks] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitted, setSubmitted] = useState(null);

  // Schedina già giocata per questo GP: precarica le scelte in sola lettura
  // con possibilità di modifica fino al via.
  const [existingBet, setExistingBet] = useState(null);
  const [editing, setEditing] = useState(false);
  const [unlocking, setUnlocking] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured || !isAuthed || !contest || roundNumber == null) return undefined;
    let alive = true;
    listMyBets()
      .then((rows) => {
        if (!alive) return;
        const mine = (rows || []).find(
          (b) => String(b.league_id) === String(contest.league.id)
            && Number(b.round) === Number(roundNumber)
        );
        if (mine) {
          setExistingBet(mine);
          // outcome "p{N}:{driverId}" → picks[eventId][N] = driverId
          const mapped = {};
          (mine.picks || []).forEach((p) => {
            const m = /^p(\d+):(.+)$/.exec(p.outcome || '');
            if (!m) return;
            mapped[p.event_id] = { ...(mapped[p.event_id] || {}), [Number(m[1])]: m[2] };
          });
          setPicks(mapped);
        }
      })
      .catch(() => {});
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSupabaseConfigured, isAuthed, contest?.league.id, roundNumber]);

  const readOnly = Boolean(existingBet) && !editing;

  const startEdit = async () => {
    if (!existingBet) return;
    const ok = window.confirm(
      'Vuoi modificare la schedina?\n\n' +
      `Quella attuale viene annullata (ti vengono restituiti ${existingBet.funnies_awarded} Funnies). ` +
      'Ricordati di CONFERMARE i nuovi pronostici prima del via.'
    );
    if (!ok) return;
    setUnlocking(true);
    setSubmitError(null);
    try {
      await deleteMyBet(existingBet.bet_id);
      setExistingBet(null);
      setEditing(true);
    } catch (e) {
      setSubmitError(e?.message || 'Errore durante la modifica.');
    } finally {
      setUnlocking(false);
    }
  };

  const setPick = (eventId, pos, driverId) =>
    setPicks((p) => ({
      ...p,
      [eventId]: { ...(p[eventId] || {}), [pos]: driverId },
    }));

  const totalPicks = sessions.length * F1_POSITIONS.length;
  const completedPicks = sessions.reduce((acc, s) => {
    const chosen = picks[s.id] || {};
    return acc + F1_POSITIONS.filter((p) => chosen[p]).length;
  }, 0);

  // Validazione: nessun pilota può occupare due posizioni nella stessa sessione.
  const sessionHasDupe = (s) => {
    const chosen = Object.values(picks[s.id] || {}).filter(Boolean);
    return chosen.length !== new Set(chosen).size;
  };
  const anyDupe = sessions.some(sessionHasDupe);

  const canSubmit =
    sessions.length > 0 && completedPicks === totalPicks && !anyDupe && !submitting && !readOnly;

  const nextCountdown = sessions[0] ? formatCountdown(sessions[0].dateISO) : '';

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = sessions.flatMap((s) =>
        F1_POSITIONS.map((p) => ({
          eventId: s.id,
          outcome: `p${p}:${picks[s.id][p]}`,
        }))
      );
      const res = await submitBet({
        leagueId: contest.league.id,
        round: Number(roundNumber) || null,
        picks: payload,
      });
      setSubmitted(res);
    } catch (e) {
      const msg = e?.message || '';
      if (msg.includes('duplicate key') || msg.includes('unique')) {
        setSubmitError('Hai già confermato la schedina di questo GP.');
      } else if (msg.toLowerCase().includes('round locked')) {
        setSubmitError('Giornata chiusa — non è più possibile pronosticare.');
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
            Pronostici salvati!
          </div>
          <div style={{ color: 'rgba(245,246,250,0.6)', fontSize: 15, marginTop: 10, maxWidth: 280 }}>
            Piloti confermati per {sessions.length === 2 ? 'qualifica e gara' : 'la sessione'}.
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
            <SummaryStat label="Posizioni" value={`${totalPicks}/${totalPicks}`} />
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
      subtitle={roundNumber ? `Round ${roundNumber}` : contest.sub}
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
          {nextCountdown || '—'}
        </div>
      }
    >
      {loading && (
        <div style={{ padding: '0 22px 20px', color: 'rgba(245,246,250,0.6)' }}>
          Carico il prossimo GP…
        </div>
      )}
      {error && (
        <div style={{ padding: '0 22px 20px', color: '#FF5A6A' }}>
          Errore nel caricare il GP. Riprova tra poco.
        </div>
      )}
      {!loading && !error && sessions.length === 0 && (
        <div style={{ padding: '0 22px 20px', color: 'rgba(245,246,250,0.6)' }}>
          Nessuna sessione pronosticabile in questo momento.
        </div>
      )}

      {/* Schedina già giocata: riepilogo + modifica fino al via. */}
      {existingBet && (
        <div style={{ padding: '0 22px 14px' }}>
          <div
            style={{
              padding: '12px 14px',
              background: 'rgba(61,220,151,0.08)',
              border: '1px solid rgba(61,220,151,0.3)',
              borderRadius: 14,
              color: '#A9EFD2',
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            <strong style={{ color: '#3DDC97' }}>Hai già giocato questo GP.</strong>{' '}
            Qui sotto vedi i piloti che hai confermato.
            {existingBet.editable && (
              <button
                onClick={startEdit}
                disabled={unlocking}
                style={{
                  display: 'block',
                  marginTop: 10,
                  background: 'rgba(61,220,151,0.15)',
                  border: '1px solid rgba(61,220,151,0.4)',
                  color: '#3DDC97',
                  borderRadius: 10,
                  padding: '9px 14px',
                  fontFamily: 'Space Grotesk',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: unlocking ? 'wait' : 'pointer',
                }}
              >
                {unlocking ? 'Sblocco…' : '✏️ Modifica i pronostici'}
              </button>
            )}
          </div>
        </div>
      )}

      {sessions.length > 0 && (
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
              {completedPicks} di {totalPicks} posizioni scelte
            </span>
            <span style={{ fontFamily: 'JetBrains Mono', color: '#FFDD2E' }}>
              +{completedPicks * 10} Funnies
            </span>
          </div>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
            <div
              style={{
                width: `${(completedPicks / Math.max(totalPicks, 1)) * 100}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #FFDD2E, #E6A617)',
                borderRadius: 3,
                transition: 'width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            />
          </div>
        </div>
      )}

      <div style={{ padding: '0 22px' }}>
        {sessions.map((s) => {
          const chosen = picks[s.id] || {};
          const dupe = sessionHasDupe(s);
          return (
            <div
              key={s.id}
              style={{
                background: '#111830',
                borderRadius: 20,
                padding: 18,
                marginBottom: 14,
                border: dupe
                  ? '1px solid rgba(255,90,106,0.4)'
                  : '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 14,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      fontFamily: 'JetBrains Mono',
                      color: 'rgba(245,246,250,0.5)',
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                    }}
                  >
                    {s.kind === 'qualifying' ? 'Qualifica' : 'Gara'}
                  </div>
                  <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 16, marginTop: 2 }}>
                    {s.event}
                  </div>
                </div>
                <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: '#4C7DFF' }}>
                  {formatMatchDate(s.dateISO)}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {F1_POSITIONS.map((pos) => (
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
                      value={chosen[pos] || ''}
                      onChange={(e) => setPick(s.id, pos, e.target.value || null)}
                      disabled={readOnly}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 12,
                        background: chosen[pos] ? 'rgba(255,221,46,0.08)' : 'rgba(255,255,255,0.04)',
                        color: '#F5F6FA',
                        border: chosen[pos]
                          ? '1px solid rgba(255,221,46,0.4)'
                          : '1px solid rgba(255,255,255,0.06)',
                        fontFamily: 'Inter',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: readOnly ? 'not-allowed' : 'pointer',
                        appearance: 'none',
                      }}
                    >
                      <option value="">Scegli pilota…</option>
                      {F1_DRIVERS.map((d) => (
                        <option key={d.id} value={d.id} style={{ background: '#0A0F1F' }}>
                          {d.name} — {d.team}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {dupe && (
                <div style={{ marginTop: 10, color: '#FF5A6A', fontSize: 12 }}>
                  Non puoi assegnare lo stesso pilota a due posizioni diverse.
                </div>
              )}
            </div>
          );
        })}
      </div>

      {sessions.length > 0 && (
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
              : readOnly
                ? 'Schedina già confermata ✓'
                : canSubmit
                  ? `Conferma e guadagna +${completedPicks * 10} Funnies`
                  : anyDupe
                    ? 'Rimuovi i duplicati per continuare'
                    : `Completa ${totalPicks - completedPicks} posizioni ancora`}
          </button>
        </div>
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
