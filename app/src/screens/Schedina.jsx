import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Screen from '../components/Screen.jsx';
import Icon from '../components/Icon.jsx';
import Funnie from '../components/Funnie.jsx';
import TeamBadge from '../components/TeamBadge.jsx';
import { findContest } from '../lib/contests.js';
import { formatMatchDate, formatCountdown } from '../lib/format.js';
import { useCurrentRoundByLeague } from '../hooks/useEvents.js';
import { useApp } from '../context/AppContext.jsx';
import SchedinaF1 from './SchedinaF1.jsx';
import SchedinaCycling from './SchedinaCycling.jsx';

// Art. 6 del regolamento: la schedina si chiude qualche minuto prima
// dell'inizio del primo evento della giornata. Scegliamo -60 secondi
// dall'inizio della prima partita della giornata.
const LOCKOUT_SECONDS = 60;

function computeLockoutMs(matches) {
  if (!matches || matches.length === 0) return null;
  const first = matches
    .map((m) => new Date(m.dateISO || m.date).getTime())
    .filter((t) => Number.isFinite(t))
    .sort((a, b) => a - b)[0];
  if (!first) return null;
  return first - LOCKOUT_SECONDS * 1000;
}

const OUTCOMES_1X2 = [
  { id: '1', label: '1', desc: 'Casa' },
  { id: 'X', label: 'X', desc: 'Pareggio' },
  { id: '2', label: '2', desc: 'Trasferta' },
];
const OUTCOMES_12 = [
  { id: '1', label: '1', desc: 'Casa' },
  { id: '2', label: '2', desc: 'Trasferta' },
];
// UFC/fighting: niente pareggio, angolo rosso vs angolo blu.
const OUTCOMES_FIGHT = [
  { id: '1', label: '1', desc: 'Rosso' },
  { id: '2', label: '2', desc: 'Blu' },
];

export default function Schedina() {
  const navigate = useNavigate();
  const { id } = useParams();
  const contest = findContest(id);

  // Dispatch per sport: F1 ha un'UI completamente diversa (Top 5 per qualifica
  // e gara). Calcio / basket / tennis condividono la UI 1X2 / 12.
  if (contest?.league.pickType === 'F1TOP5') {
    return <SchedinaF1 contest={contest} />;
  }
  if (contest?.league.pickType === 'CYCLETOP10') {
    return <SchedinaCycling contest={contest} />;
  }

  const OUTCOMES = contest?.league.pickType === '12'
    ? OUTCOMES_12
    : contest?.league.pickType === 'UFC'
      ? OUTCOMES_FIGHT
      : OUTCOMES_1X2;
  const outcomesGrid = OUTCOMES.length === 3 ? '1fr 1fr 1fr' : '1fr 1fr';

  const {
    data: roundData,
    loading,
    error,
  } = useCurrentRoundByLeague(contest?.league || null);

  const matches = useMemo(() => roundData?.events || [], [roundData]);
  const roundNumber = roundData?.round;

  const {
    submitBet, isSupabaseConfigured, isAuthed, listMyBets, deleteMyBet,
  } = useApp();
  const [picks, setPicks] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitted, setSubmitted] = useState(null); // { bonus, newFunnies } | null

  // Schedina già giocata per questa giornata: la ricarichiamo per mostrare
  // i pronostici scelti (sola lettura) con possibilità di modifica fino
  // al kickoff. Niente più form vuoto come se non avessi mai giocato.
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
          const mapped = {};
          (mine.picks || []).forEach((p) => { mapped[p.event_id] = p.outcome; });
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
      'Ricordati di CONFERMARE i nuovi pronostici prima del kickoff.'
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

  if (!contest) {
    return (
      <Screen
        title="Concorso non trovato"
        subtitle="Torna alla lista dei concorsi aperti."
        onBack={() => navigate('/pronostici')}
      >
        <div style={{ padding: 22 }}>
          <button onClick={() => navigate('/pronostici')} style={primaryBtn}>
            Torna ai pronostici
          </button>
        </div>
      </Screen>
    );
  }

  const setPick = (eventId, outcome) =>
    setPicks((p) => ({ ...p, [eventId]: outcome }));

  const completed = matches.filter((m) => picks[m.id] !== undefined).length;

  // Lock della giornata: 1 min prima del fischio d'inizio della prima partita.
  const lockoutAt = useMemo(() => computeLockoutMs(matches), [matches]);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!lockoutAt) return undefined;
    const tick = () => setNow(Date.now());
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [lockoutAt]);
  const locked = lockoutAt != null && now >= lockoutAt;

  const canSubmit = !locked && !readOnly && completed === matches.length && matches.length > 0;

  const nextCountdown = matches[0] ? formatCountdown(matches[0].dateISO) : '';

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = matches
        .filter((m) => picks[m.id] !== undefined)
        .map((m) => ({ eventId: m.id, outcome: picks[m.id] }));
      const res = await submitBet({
        leagueId: contest.league.id,
        round: Number(roundNumber) || null,
        picks: payload,
      });
      setSubmitted(res);
    } catch (e) {
      const msg = e?.message || '';
      if (msg.includes('duplicate key') || msg.includes('unique')) {
        setSubmitError('Hai già confermato la schedina di questa giornata.');
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
          <div
            style={{
              fontFamily: 'Space Grotesk',
              fontWeight: 700,
              fontSize: 30,
              letterSpacing: -1,
            }}
          >
            Pronostici salvati!
          </div>
          <div
            style={{
              color: 'rgba(245,246,250,0.6)',
              fontSize: 15,
              marginTop: 10,
              maxWidth: 280,
            }}
          >
            Ti ricordiamo che puoi modificarli finché la manche resta aperta.
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
            <SummaryStat label="Pronostici" value={`${matches.length}/${matches.length}`} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Funnie size={22} />
              <SummaryStat
                label="Funnies accreditati"
                value={`+${submitted.bonus}`}
                accent
              />
            </div>
          </div>
          {submitted.newFunnies != null && (
            <div
              style={{
                marginTop: 12,
                color: 'rgba(245,246,250,0.6)',
                fontSize: 13,
                fontFamily: 'JetBrains Mono',
              }}
            >
              Nuovo saldo: {submitted.newFunnies.toLocaleString('it-IT')}
            </div>
          )}
          {submitted.demo && (
            <div
              style={{
                marginTop: 10,
                color: 'rgba(255,221,46,0.8)',
                fontSize: 12,
              }}
            >
              Modalità demo: nessuna scrittura su DB.
            </div>
          )}
        </div>
        <div style={{ padding: '0 22px 40px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(
              `⚽ Ho appena giocato la schedina ${contest.league.label} su Bet4Fun: ${matches.length} pronostici! Battimi se ci riesci 😎 https://bet4fun-egej.vercel.app`
            )}`}
            target="_blank"
            rel="noreferrer"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              background: '#25D366',
              color: '#0A0F1F',
              border: 0,
              borderRadius: 100,
              padding: 16,
              fontFamily: 'Space Grotesk',
              fontWeight: 700,
              fontSize: 15,
              cursor: 'pointer',
              textAlign: 'center',
              textDecoration: 'none',
              display: 'block',
            }}
          >
            📤 Sfida gli amici su WhatsApp
          </a>
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
      subtitle={roundNumber ? `Giornata ${roundNumber}` : contest.sub}
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
          <span
            className="b4f-pulse"
            style={{ width: 5, height: 5, borderRadius: 3, background: '#FF5A6A' }}
          />
          {nextCountdown || '—'}
        </div>
      }
    >
      {loading && (
        <div style={{ padding: '0 22px 20px', color: 'rgba(245,246,250,0.6)' }}>
          Carico le prossime partite di {contest.league.label}…
        </div>
      )}
      {error && (
        <div style={{ padding: '0 22px 20px', color: '#FF5A6A' }}>
          Errore nel caricare le partite. Riprova tra poco.
        </div>
      )}
      {!loading && !error && matches.length === 0 && (
        <div style={{ padding: '0 22px 20px', color: 'rgba(245,246,250,0.6)' }}>
          Nessuna partita programmata per questo concorso.
        </div>
      )}

      {locked && matches.length > 0 && (
        <div style={{ padding: '0 22px 14px' }}>
          <div
            style={{
              padding: '12px 14px',
              background: 'rgba(255,90,106,0.08)',
              border: '1px solid rgba(255,90,106,0.3)',
              borderRadius: 14,
              color: '#FF8A95',
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            <strong style={{ color: '#FF5A6A' }}>Giornata chiusa.</strong>{' '}
            La schedina si chiude 1 minuto prima del fischio d'inizio della prima partita. I pronostici sono visibili in sola lettura.
          </div>
        </div>
      )}

      {/* Schedina già giocata: riepilogo + modifica fino al kickoff. */}
      {existingBet && !locked && (
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
            <strong style={{ color: '#3DDC97' }}>Hai già giocato questa giornata.</strong>{' '}
            Qui sotto vedi i tuoi pronostici confermati.
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

      {/* progress */}
      {matches.length > 0 && (
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
              {completed} di {matches.length} manches pronosticate
            </span>
            <span style={{ fontFamily: 'JetBrains Mono', color: '#FFDD2E' }}>
              +{completed * 10} Funnies
            </span>
          </div>
          <div
            style={{
              height: 6,
              background: 'rgba(255,255,255,0.08)',
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${(completed / matches.length) * 100}%`,
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
        {matches.map((m) => {
          const pick = picks[m.id];
          const done = pick !== undefined;
          return (
            <div
              key={m.id}
              style={{
                background: done ? 'rgba(61,220,151,0.06)' : '#111830',
                borderRadius: 20,
                padding: 18,
                marginBottom: 10,
                border: done
                  ? '1px solid rgba(61,220,151,0.25)'
                  : '1px solid rgba(255,255,255,0.04)',
                transition: 'all 0.3s',
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
                <div
                  style={{
                    fontSize: 10,
                    fontFamily: 'JetBrains Mono',
                    color: 'rgba(245,246,250,0.5)',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                  }}
                >
                  {m.league}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontFamily: 'JetBrains Mono',
                    color: '#4C7DFF',
                  }}
                >
                  {formatMatchDate(m.dateISO)}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  marginBottom: 14,
                }}
              >
                <TeamSide name={m.home} align="left" />
                <div style={{ fontSize: 12, color: 'rgba(245,246,250,0.35)', fontFamily: 'JetBrains Mono' }}>vs</div>
                <TeamSide name={m.away} align="right" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: outcomesGrid, gap: 8 }}>
                {OUTCOMES.map((o) => {
                  const sel = pick === o.id;
                  return (
                    <button
                      key={o.id}
                      onClick={() => !locked && !readOnly && setPick(m.id, o.id)}
                      disabled={locked || readOnly}
                      style={{
                        padding: '14px 8px',
                        borderRadius: 14,
                        border: sel
                          ? '1px solid rgba(255,221,46,0.5)'
                          : '1px solid rgba(255,255,255,0.06)',
                        cursor: locked || readOnly ? 'not-allowed' : 'pointer',
                        background: sel ? '#FFDD2E' : 'rgba(255,255,255,0.04)',
                        color: sel ? '#0A0F1F' : '#F5F6FA',
                        transition: 'all 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 3,
                        // In sola lettura il pick scelto resta ben visibile.
                        opacity: (locked || readOnly) && !sel ? 0.45 : 1,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'Space Grotesk',
                          fontWeight: 800,
                          fontSize: 22,
                          lineHeight: 1,
                        }}
                      >
                        {o.label}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontFamily: 'JetBrains Mono',
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                          color: sel ? '#0A0F1F' : 'rgba(245,246,250,0.5)',
                        }}
                      >
                        {o.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {matches.length > 0 && (
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
            disabled={!canSubmit || submitting}
            onClick={handleSubmit}
            style={{
              width: '100%',
              background: canSubmit && !submitting ? '#FFDD2E' : 'rgba(255,255,255,0.06)',
              color: canSubmit && !submitting ? '#0A0F1F' : 'rgba(245,246,250,0.3)',
              border: 0,
              borderRadius: 100,
              padding: 18,
              fontFamily: 'Space Grotesk',
              fontWeight: 700,
              fontSize: 16,
              cursor: canSubmit && !submitting ? 'pointer' : 'not-allowed',
              boxShadow: canSubmit && !submitting ? '0 8px 24px rgba(255,221,46,0.25)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            {submitting
              ? 'Salvataggio…'
              : readOnly
                ? 'Schedina già confermata ✓'
                : locked
                  ? 'Giornata chiusa — non più pronosticabile'
                  : canSubmit
                    ? `Conferma e guadagna +${completed * 10} Funnies`
                    : `Completa ${matches.length - completed} manches ancora`}
          </button>
        </div>
      )}
    </Screen>
  );
}

function TeamSide({ name, align }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: align === 'right' ? 'row-reverse' : 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
        minWidth: 0,
      }}
    >
      <TeamBadge name={name} size={42} />
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          textAlign: align,
          lineHeight: 1.2,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {name}
      </div>
    </div>
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

const primaryBtn = {
  background: '#FFDD2E',
  color: '#0A0F1F',
  border: 0,
  borderRadius: 100,
  padding: '12px 20px',
  fontFamily: 'Space Grotesk',
  fontWeight: 700,
  fontSize: 14,
  cursor: 'pointer',
};
