import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Screen from '../components/Screen.jsx';
import Icon from '../components/Icon.jsx';
import Funnie from '../components/Funnie.jsx';
import SectionHeader from '../components/SectionHeader.jsx';
import LeaderRow from '../components/LeaderRow.jsx';
import { useApp } from '../context/AppContext.jsx';
import { CONTESTS } from '../lib/contests.js';
import { useUpcomingForLeagues } from '../hooks/useEvents.js';
import { formatMatchDate } from '../lib/format.js';

const TOP_LEADERS = [
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
  const { funnies, user } = useApp();

  const leagueIds = useMemo(() => CONTESTS.map((c) => c.league.id), []);
  const { data: events, loading } = useUpcomingForLeagues(leagueIds, 3);
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
        <button
          aria-label="Notifiche"
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
        </button>
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
              <Icon name="arrowU" size={14} /> +2.430 questa sett.
            </div>
            <div style={{ opacity: 0.6 }}>|</div>
            <div>Pos #247</div>
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
          sub="3 concorsi aperti"
          accent
        />
        <QuickAction
          onClick={() => navigate('/boost')}
          icon="sparkle"
          label="Lead Boost"
          sub="Funnies extra dai brand"
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
          sub="120.000 in palio"
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
            10
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
            10 manches,
            <br />
            120.000 Funnies in palio.
          </div>
          <div style={{ marginTop: 14, fontSize: 13, color: 'rgba(245,246,250,0.7)' }}>
            Hai pronosticato 4/10 · 72º posto
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
                width: '40%',
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
        {TOP_LEADERS.map((p) => (
          <LeaderRow key={p.n} {...p} />
        ))}
      </div>
    </Screen>
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
