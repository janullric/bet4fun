import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Screen from '../components/Screen.jsx';
import Icon from '../components/Icon.jsx';
import Funnie from '../components/Funnie.jsx';
import SectionHeader from '../components/SectionHeader.jsx';
import LeaderRow from '../components/LeaderRow.jsx';
import { useApp } from '../context/AppContext.jsx';
import { CONTESTS } from '../lib/contests.js';
import { useUpcomingForLeagues, useCurrentRoundsForLeagues } from '../hooks/useEvents.js';
import { formatMatchDate, formatCountdown } from '../lib/format.js';

// Demo mostrata SOLO quando Supabase non è configurato (repo in anteprima).
const DEMO_LEADERS = [
  { n: 1, nick: 'CP72',         pts: 9195, delta: 0 },
  { n: 2, nick: 'ValerioLazio', pts: 9147, delta: 0 },
  { n: 3, nick: 'emricci',      pts: 9089, delta: 1 },
];

// Trova il contest che ospita un evento (per collegare il click al /pronostici/:key).
function contestForEvent(e) {
  return CONTESTS.find((c) => c.league.name === e.league);
}

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    funnies, user, listMyBets, isSupabaseConfigured, isAuthed,
    myRank, globalLeaderboard, monthlyChallenge,
  } = useApp();

  const leagueIds = useMemo(() => CONTESTS.map((c) => c.league.id), []);
  const { data: events, loading } = useUpcomingForLeagues(leagueIds, 3);

  // Numeri reali: posizione/guadagno settimana, top 3 classifica, sfida mese.
  const [rankInfo, setRankInfo] = useState(null);
  const [leaders, setLeaders] = useState(null);
  const [challenge, setChallenge] = useState(null);
  useEffect(() => {
    if (!isSupabaseConfigured || !isAuthed) return;
    let alive = true;
    myRank().then((r) => { if (alive) setRankInfo(r); }).catch(() => {});
    globalLeaderboard()
      .then((rows) => {
        if (!alive || !Array.isArray(rows)) return;
        setLeaders(rows.slice(0, 3).map((r, i) => ({
          n: r.rank ?? i + 1,
          nick: r.nick,
          pts: Number(r.funnies ?? 0),
          delta: 0,
          me: !!r.is_me,
        })));
      })
      .catch(() => {});
    monthlyChallenge().then((c) => { if (alive) setChallenge(c); }).catch(() => {});
    return () => { alive = false; };
  }, [isSupabaseConfigured, isAuthed, myRank, globalLeaderboard, monthlyChallenge]);

  const topLeaders = isSupabaseConfigured ? (leaders || []) : DEMO_LEADERS;
  const challengePool = isSupabaseConfigured
    ? (challenge ? Number(challenge.prize_pool) : null)
    : 120000;

  // Notifiche: carico le schedine dell'utente per costruire il pannello
  // (schedine aperte da gestire + ultime vincite). È un dato leggero che
  // vale la pena avere subito al mount del dashboard.
  const [bets, setBets] = useState([]);
  useEffect(() => {
    if (!isSupabaseConfigured || !isAuthed || !listMyBets) return;
    let alive = true;
    listMyBets()
      .then((rows) => { if (alive) setBets(rows || []); })
      .catch(() => {});
    return () => { alive = false; };
  }, [isSupabaseConfigured, isAuthed, listMyBets]);

  const openBets = useMemo(() => bets.filter((b) => b.editable), [bets]);

  // Promemoria: concorsi giocabili che chiudono entro 48h e che l'utente
  // NON ha ancora pronosticato → notifica "⏰ gioca prima del kickoff".
  const { data: roundsMeta } = useCurrentRoundsForLeagues(leagueIds);
  const reminders = useMemo(() => {
    const out = [];
    const now = Date.now();
    (roundsMeta || []).forEach((r) => {
      const meta = r?.meta;
      if (!r?.leagueId || !meta?.round || !(meta.count > 0) || !meta.firstKickISO) return;
      const kick = new Date(meta.firstKickISO).getTime();
      const msLeft = kick - 60 * 1000 - now;
      if (msLeft <= 0 || msLeft > 48 * 3600 * 1000) return;          // chiude entro 48h
      const played = bets.some(
        (b) => String(b.league_id) === String(r.leagueId) && Number(b.round) === Number(meta.round)
      );
      if (played) return;
      const contest = CONTESTS.find((c) => String(c.league.id) === String(r.leagueId));
      if (!contest) return;
      out.push({ contest, round: meta.round, kickISO: meta.firstKickISO, msLeft });
    });
    out.sort((a, b) => a.msLeft - b.msLeft);
    return out.slice(0, 4);
  }, [roundsMeta, bets]);

  const hasNotifications = reminders.length > 0 || openBets.length > 0 || bets.length > 0;
  const upcoming = useMemo(() => {
    const seen = new Set();
    const unique = (events || []).filter((e) =>
      seen.has(e.id) ? false : (seen.add(e.id), true)
    );
    unique.sort((a, b) => {
      const ta = new Date(a.dateISO || a.date).getTime() || Infinity;
      const tb = new Date(b.dateISO || b.date).getTime() || Infinity;
      return ta - tb;
    });
    return unique.slice(0, 3);
  }, [events]);

  return (
    <Screen
      title={
        <span>
          Ciao, <span style={{ color: '#FFDD2E' }}>{user.nick}</span>
        </span>
      }
      subtitle="Ecco il riepilogo del tuo mese."
      headerRight={
        <NotificationsBell
          bets={bets}
          openBets={openBets}
          reminders={reminders}
          hasNotifications={hasNotifications}
          onNavigate={navigate}
        />
      }
    >
      {/* card saldo */}
      <div style={{ padding: '0 22px 20px' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #FFDD2E 0%, #E6A617 100%)',
            borderRadius: 24,
            padding: '22px 22px 20px',
            color: '#1A0F00',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(255,221,46,0.22)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              right: -30,
              top: -30,
              width: 160,
              height: 160,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.12)',
            }}
          />
          <div
            style={{
              fontSize: 11,
              fontFamily: 'JetBrains Mono',
              textTransform: 'uppercase',
              letterSpacing: 1.5,
              opacity: 0.7,
            }}
          >
            Il tuo saldo
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
            <Funnie size={34} />
            <div
              style={{
                fontFamily: 'Space Grotesk',
                fontWeight: 800,
                fontSize: 42,
                letterSpacing: -1.5,
                lineHeight: 1,
              }}
            >
              {funnies.toLocaleString('it-IT')}
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              gap: 16,
              marginTop: 18,
              fontSize: 12,
              fontWeight: 600,
              position: 'relative',
              zIndex: 1,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icon name="arrowU" size={14} />
              {rankInfo
                ? `+${Number(rankInfo.weekly_gain).toLocaleString('it-IT')} questa sett.`
                : '+0 questa sett.'}
            </div>
            <div style={{ opacity: 0.6 }}>|</div>
            <div>{rankInfo?.rank ? `Pos #${rankInfo.rank}` : 'Pos —'}</div>
          </div>
        </div>
      </div>

      {/* azioni rapide */}
      <div
        style={{
          padding: '0 22px 24px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
        }}
      >
        <QuickAction
          onClick={() => navigate('/pronostici')}
          icon="bolt"
          label="Pronostica"
          sub="Concorsi gratuiti"
          accent
        />
        <QuickAction
          onClick={() => navigate('/schedine')}
          icon="trophy"
          label="Le mie schedine"
          sub={
            bets.length
              ? `${bets.length} giocate${openBets.length ? ` · ${openBets.length} aperte` : ''}`
              : 'Nessuna ancora'
          }
        />
        <QuickAction
          onClick={() => navigate('/amici')}
          icon="users"
          label="Amici"
          sub="Chat e sfide 1v1"
        />
        <QuickAction
          onClick={() => navigate('/gruppi')}
          icon="users"
          label="Gruppi"
          sub="Sfida gli amici"
        />
        <QuickAction
          onClick={() => navigate('/sfida')}
          icon="flame"
          label="Sfida mese"
          sub={
            challengePool != null
              ? `${challengePool.toLocaleString('it-IT')} in palio`
              : 'Montepremi mensile'
          }
        />
      </div>

      {/* prossime manches */}
      <SectionHeader
        title="Prossime manches"
        action="Vedi tutte"
        onAction={() => navigate('/pronostici')}
      />
      <div style={{ padding: '0 22px' }}>
        {loading && upcoming.length === 0 && (
          <div style={{ color: 'rgba(245,246,250,0.5)', fontSize: 13, padding: '4px 0 12px' }}>
            Carico i prossimi eventi…
          </div>
        )}
        {upcoming.map((m, i) => {
          const contest = contestForEvent(m);
          return (
            <button
              key={m.id || i}
              onClick={() => contest && navigate(`/pronostici/${contest.key}`)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 16px',
                marginBottom: 8,
                background: '#111830',
                borderRadius: 18,
                border: '1px solid rgba(255,255,255,0.04)',
                cursor: contest ? 'pointer' : 'default',
                color: '#F5F6FA',
                textAlign: 'left',
                fontFamily: 'Inter',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'rgba(76,125,255,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon name={contest?.sport || 'football'} size={22} color="#4C7DFF" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 11,
                    color: 'rgba(245,246,250,0.5)',
                    fontFamily: 'JetBrains Mono',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                  }}
                >
                  {m.league}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    marginTop: 2,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {m.home} — {m.away}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'rgba(245,246,250,0.6)',
                    marginTop: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {formatMatchDate(m.dateISO)}
                </div>
              </div>
              <Icon name="chevR" size={16} color="rgba(245,246,250,0.3)" />
            </button>
          );
        })}
      </div>

      {/* sfida mese */}
      <div style={{ padding: '20px 22px 0' }}>
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
              position: 'absolute',
              right: -20,
              bottom: -40,
              fontFamily: 'Space Grotesk',
              fontWeight: 800,
              fontSize: 140,
              color: 'rgba(255,255,255,0.04)',
              letterSpacing: -8,
              lineHeight: 1,
            }}
          >
            {challenge?.month ?? ''}
          </div>
          <div
            style={{
              fontSize: 11,
              fontFamily: 'JetBrains Mono',
              color: '#FFDD2E',
              textTransform: 'uppercase',
              letterSpacing: 1.5,
            }}
          >
            Sfida del mese
          </div>
          <div
            style={{
              fontFamily: 'Space Grotesk',
              fontWeight: 700,
              fontSize: 24,
              letterSpacing: -0.6,
              marginTop: 6,
              lineHeight: 1.1,
            }}
          >
            {challengePool != null
              ? `${challengePool.toLocaleString('it-IT')} Funnies`
              : 'Montepremi mensile'}
            <br />
            in palio questo mese.
          </div>
          <div style={{ marginTop: 14, fontSize: 13, color: 'rgba(245,246,250,0.7)' }}>
            {challenge && Number(challenge.my_points) > 0
              ? `Hai ${Number(challenge.my_points).toLocaleString('it-IT')} punti · ${challenge.my_rank}º su ${challenge.participants}`
              : 'Gioca una schedina per entrare in classifica.'}
          </div>
          <div
            style={{
              marginTop: 12,
              height: 6,
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                // Avanzamento = i tuoi punti rispetto al leader del mese.
                width: `${(() => {
                  const lead = Number(challenge?.leaderboard?.[0]?.points) || 0;
                  const mine = Number(challenge?.my_points) || 0;
                  return lead > 0 ? Math.min(100, Math.round((mine / lead) * 100)) : 0;
                })()}%`,
                height: '100%',
                background: '#FFDD2E',
                borderRadius: 3,
              }}
            />
          </div>
          <button
            onClick={() => navigate('/sfida')}
            style={{
              marginTop: 16,
              background: '#FFDD2E',
              color: '#0A0F1F',
              border: 0,
              borderRadius: 100,
              padding: '11px 20px',
              fontFamily: 'Space Grotesk',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Continua la sfida →
          </button>
        </div>
      </div>

      {/* top classifica */}
      <SectionHeader
        title="Top classifica"
        action="Vedi classifica"
        onAction={() => navigate('/classifiche')}
      />
      <div style={{ padding: '0 22px 30px' }}>
        {topLeaders.length === 0 && (
          <div style={{ color: 'rgba(245,246,250,0.5)', fontSize: 13 }}>
            Ancora nessun giocatore in classifica.
          </div>
        )}
        {topLeaders.map((p) => (
          <LeaderRow key={p.n} {...p} />
        ))}
      </div>
    </Screen>
  );
}

function NotificationsBell({ bets, openBets, reminders = [], hasNotifications, onNavigate }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const recent = (bets || []).slice(0, 3);

  const go = (path) => {
    setOpen(false);
    onNavigate(path);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        aria-label="Notifiche"
        onClick={() => setOpen((v) => !v)}
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: 0,
          color: '#F5F6FA',
          width: 40,
          height: 40,
          borderRadius: 14,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <Icon name="bell" size={20} />
        {hasNotifications && (
          <span
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 8,
              height: 8,
              borderRadius: 4,
              background: '#FF5A6A',
            }}
          />
        )}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 48,
            right: 0,
            width: 280,
            background: '#111830',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16,
            boxShadow: '0 18px 40px rgba(0,0,0,0.4)',
            padding: 12,
            zIndex: 20,
            fontFamily: 'Inter',
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontFamily: 'JetBrains Mono',
              color: 'rgba(245,246,250,0.5)',
              textTransform: 'uppercase',
              letterSpacing: 1,
              padding: '2px 4px 8px',
            }}
          >
            Notifiche
          </div>

          {reminders.map((r, i) => (
            <button
              key={`rem-${i}`}
              onClick={() => go(`/pronostici/${r.contest.key}`)}
              style={{
                width: '100%',
                textAlign: 'left',
                background: 'rgba(255,90,106,0.10)',
                border: '1px solid rgba(255,90,106,0.3)',
                color: '#F5F6FA',
                borderRadius: 12,
                padding: '10px 12px',
                marginBottom: 8,
                cursor: 'pointer',
                fontFamily: 'Inter',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                ⏰ {r.contest.league.label} chiude tra {formatCountdown(r.kickISO)}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(245,246,250,0.65)', marginTop: 2 }}>
                Non hai ancora giocato — pronostica ora →
              </div>
            </button>
          ))}

          {openBets.length > 0 && (
            <button
              onClick={() => go('/schedine')}
              style={{
                width: '100%',
                textAlign: 'left',
                background: 'rgba(34,197,94,0.10)',
                border: '1px solid rgba(34,197,94,0.25)',
                color: '#F5F6FA',
                borderRadius: 12,
                padding: '10px 12px',
                marginBottom: 8,
                cursor: 'pointer',
                fontFamily: 'Inter',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                {openBets.length} schedine aperte
              </div>
              <div style={{ fontSize: 11, color: 'rgba(245,246,250,0.65)', marginTop: 2 }}>
                Puoi ancora modificarle prima del kickoff · Gestisci →
              </div>
            </button>
          )}

          {recent.length > 0 && (
            <div
              style={{
                fontSize: 10,
                fontFamily: 'JetBrains Mono',
                color: 'rgba(245,246,250,0.45)',
                textTransform: 'uppercase',
                letterSpacing: 1,
                padding: '6px 4px 4px',
              }}
            >
              Ultime giocate
            </div>
          )}

          {recent.map((b) => {
            const c = CONTESTS.find((x) => String(x.league.id) === String(b.league_id));
            const leagueLabel = c?.league.label || b.league_id;
            const countdown = b.editable && b.first_kickoff_at
              ? formatCountdown(b.first_kickoff_at)
              : null;
            return (
              <button
                key={b.bet_id}
                onClick={() => go('/schedine')}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: 'rgba(255,255,255,0.04)',
                  border: 0,
                  color: '#F5F6FA',
                  borderRadius: 10,
                  padding: '8px 10px',
                  marginBottom: 6,
                  cursor: 'pointer',
                  fontFamily: 'Inter',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    background: b.editable ? '#22c55e' : 'rgba(255,90,106,0.8)',
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {leagueLabel}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(245,246,250,0.55)' }}>
                    {b.editable
                      ? (countdown ? `Inizia tra ${countdown}` : 'Aperta')
                      : 'Chiusa'}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontFamily: 'JetBrains Mono',
                    color: b.editable ? '#22c55e' : '#FF5A6A',
                  }}
                >
                  +{b.funnies_awarded}
                </span>
              </button>
            );
          })}

          {!hasNotifications && (
            <div
              style={{
                padding: '10px 4px',
                color: 'rgba(245,246,250,0.55)',
                fontSize: 12,
              }}
            >
              Nessuna notifica per ora. Gioca una schedina per iniziare.
            </div>
          )}

          <button
            onClick={() => go('/schedine')}
            style={{
              marginTop: 8,
              width: '100%',
              background: '#FFDD2E',
              color: '#0A0F1F',
              border: 0,
              borderRadius: 10,
              padding: '9px 12px',
              fontFamily: 'Space Grotesk',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Apri tutte le schedine
          </button>
        </div>
      )}
    </div>
  );
}

function QuickAction({ icon, label, sub, onClick, accent }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: accent ? 'rgba(255,221,46,0.08)' : 'rgba(26,34,64,0.7)',
        border: accent
          ? '1px solid rgba(255,221,46,0.25)'
          : '1px solid rgba(255,255,255,0.06)',
        borderRadius: 18,
        padding: 14,
        color: '#F5F6FA',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 8,
        fontFamily: 'Inter',
        textAlign: 'left',
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: accent ? '#FFDD2E' : 'rgba(76,125,255,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={icon} size={20} color={accent ? '#0A0F1F' : '#4C7DFF'} stroke={2.2} />
      </div>
      <div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            fontFamily: 'Space Grotesk',
            letterSpacing: -0.3,
          }}
        >
          {label}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(245,246,250,0.55)', marginTop: 2 }}>
          {sub}
        </div>
      </div>
    </button>
  );
}
