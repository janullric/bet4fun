import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Screen from '../components/Screen.jsx';
import Icon from '../components/Icon.jsx';
import Funnie from '../components/Funnie.jsx';
import { CONTESTS, computePrizePool } from '../lib/contests.js';
import { formatCountdown } from '../lib/format.js';
import { useCurrentRoundsForLeagues } from '../hooks/useEvents.js';

// Per sport di calcio "Serie A 34ª giornata"; per altri "Turno 3".
function roundLabel(sport, n) {
  if (n == null) return null;
  if (sport === 'football') return `${n}ª giornata`;
  return `Turno ${n}`;
}

const FILTERS = [
  { id: 'tutti',             label: 'Tutti' },
  { id: 'football',          label: 'Calcio' },
  { id: 'basketball',        label: 'Basket' },
  { id: 'tennis',            label: 'Tennis' },
  { id: 'motorsport',        label: 'Motori' },
  { id: 'cycling',           label: 'Ciclismo' },
  { id: 'icehockey',         label: 'Hockey' },
  { id: 'baseball',          label: 'Baseball' },
  { id: 'americanfootball',  label: 'NFL' },
  { id: 'fighting',          label: 'UFC' },
];

const SPORT_ICON = {
  football:          'football',
  basketball:        'basket',
  tennis:            'tennis',
  motorsport:        'f1',
  cycling:           'bike',
  // Mancano icone dedicate: ricicliamo le più vicine.
  icehockey:         'bolt',
  baseball:          'basket',
  americanfootball:  'football',
  fighting:          'trophy',
};

export default function PronosticiList() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('tutti');

  const leagueIds = useMemo(() => CONTESTS.map((c) => c.league.id), []);
  const { data: rounds, loading, error } = useCurrentRoundsForLeagues(leagueIds);

  // Mappa leagueId → meta ({ round, firstKickISO, nextKickISO, count }).
  const metaByLeague = useMemo(() => {
    const map = new Map();
    (rounds || []).forEach((r) => {
      if (r?.leagueId && r?.meta) map.set(r.leagueId, r.meta);
    });
    return map;
  }, [rounds]);

  const visible = useMemo(
    () => (filter === 'tutti' ? CONTESTS : CONTESTS.filter((c) => c.sport === filter)),
    [filter]
  );

  // Giocabili in alto (kickoff più vicino per primo), chiusi/vuoti in fondo.
  const sorted = useMemo(() => {
    const rank = (c) => {
      const meta = metaByLeague.get(c.league.id);
      const n = meta?.count ?? 0;
      const hasRound = (meta?.round ?? null) != null && n > 0;
      const kick = meta?.firstKickISO ? new Date(meta.firstKickISO).getTime() : Infinity;
      const locked = Number.isFinite(kick) && Date.now() >= kick - 60 * 1000;
      return { playable: hasRound && !locked, kick };
    };
    return [...visible].sort((a, b) => {
      const ra = rank(a);
      const rb = rank(b);
      if (ra.playable !== rb.playable) return ra.playable ? -1 : 1;
      return ra.kick - rb.kick;
    });
  }, [visible, metaByLeague]);

  return (
    <Screen
      title="Pronostici"
      subtitle="Concorsi gratuiti aperti ora."
      headerRight={
        <button
          aria-label="Calendario"
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
          }}
        >
          <Icon name="calendar" size={20} />
        </button>
      }
    >
      {/* filtri */}
      <div
        style={{
          padding: '0 22px 18px',
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
        }}
      >
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            style={{
              padding: '9px 16px',
              borderRadius: 100,
              border: 0,
              cursor: 'pointer',
              background: filter === f.id ? '#FFDD2E' : 'rgba(255,255,255,0.06)',
              color: filter === f.id ? '#0A0F1F' : 'rgba(245,246,250,0.75)',
              fontSize: 13,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              fontFamily: 'Inter',
              transition: 'all 0.2s',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ padding: '0 22px 16px', color: '#FF5A6A', fontSize: 13 }}>
          Impossibile caricare gli eventi. Riprova tra poco.
        </div>
      )}

      <div style={{ padding: '0 22px' }}>
        {sorted.map((c) => {
          const meta = metaByLeague.get(c.league.id);
          const n = meta?.count ?? 0;
          const roundNumber = meta?.round ?? null;
          const entrants = meta?.entrants ?? 0;
          const firstKickMs = meta?.firstKickISO ? new Date(meta.firstKickISO).getTime() : null;
          const countdown = meta?.nextKickISO ? formatCountdown(meta.nextKickISO) : null;
          // Lockout: primo kickoff della giornata passato (o entro 60s) →
          // giornata chiusa, card non cliccabile.
          const locked = firstKickMs != null && Date.now() >= firstKickMs - 60 * 1000;
          const hasRound = roundNumber != null && n > 0;
          const closed = !loading && (!hasRound || locked);
          const rLabel = hasRound ? roundLabel(c.sport, roundNumber) : null;
          // Montepremi trasparente (Art. 8-11): base + iscritti × quota.
          const prizeTotal = computePrizePool(c, entrants);

          return (
            <button
              key={c.key}
              onClick={() => !closed && navigate(`/pronostici/${c.key}`)}
              disabled={closed}
              style={{
                width: '100%',
                background: '#111830',
                borderRadius: 20,
                border: locked
                  ? '1px solid rgba(255,90,106,0.4)'
                  : c.urgent
                    ? '1px solid rgba(255,90,106,0.3)'
                    : '1px solid rgba(255,255,255,0.04)',
                padding: 16,
                marginBottom: 10,
                cursor: closed ? 'not-allowed' : 'pointer',
                color: '#F5F6FA',
                textAlign: 'left',
                opacity: closed ? 0.5 : 1,
                position: 'relative',
                overflow: 'hidden',
                fontFamily: 'Inter',
              }}
            >
              {locked && (
                <div
                  style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    padding: '3px 8px',
                    borderRadius: 100,
                    background: 'rgba(255,90,106,0.15)',
                    color: '#FF5A6A',
                    fontSize: 10,
                    fontFamily: 'JetBrains Mono',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    fontWeight: 600,
                  }}
                >
                  Giornata chiusa
                </div>
              )}
              {!locked && c.urgent && (
                <div
                  style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    padding: '3px 8px',
                    borderRadius: 100,
                    background: 'rgba(255,90,106,0.15)',
                    color: '#FF5A6A',
                    fontSize: 10,
                    fontFamily: 'JetBrains Mono',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <span
                    className="b4f-pulse"
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: 3,
                      background: '#FF5A6A',
                    }}
                  />
                  Urgente
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: 'rgba(76,125,255,0.15)',
                    color: '#4C7DFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name={SPORT_ICON[c.sport] || c.sport} size={22} />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontFamily: 'JetBrains Mono',
                      color: 'rgba(245,246,250,0.5)',
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                    }}
                  >
                    {c.sub}
                  </div>
                  <div
                    style={{
                      fontFamily: 'Space Grotesk',
                      fontSize: 17,
                      fontWeight: 700,
                      letterSpacing: -0.4,
                      marginTop: 2,
                    }}
                  >
                    {c.league.label}
                    {rLabel && (
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: 13,
                          fontWeight: 500,
                          color: locked ? '#FF8A95' : 'rgba(245,246,250,0.6)',
                        }}
                      >
                        · {rLabel}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12 }}>
                <Stat label="Manches" value={loading ? '…' : n || '—'} />
                <Separator />
                <Stat
                  label={closed ? 'Stato' : 'Inizia tra'}
                  value={
                    loading
                      ? '…'
                      : locked
                        ? 'Chiusa'
                        : !hasRound
                          ? 'Nessuna partita'
                          : countdown
                  }
                  color={locked ? '#FF5A6A' : undefined}
                />
                <Separator />
                <Stat
                  label="Montepremi"
                  value={
                    <>
                      <Funnie size={11} /> {prizeTotal.toLocaleString('it-IT')}
                    </>
                  }
                  color="#FFDD2E"
                  hint={`${c.basePool.toLocaleString('it-IT')} + ${entrants} × ${c.perEntrant}`}
                />
              </div>
            </button>
          );
        })}
      </div>
    </Screen>
  );
}

function Stat({ label, value, color, hint }) {
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
      {hint && (
        <div
          style={{
            fontSize: 9,
            marginTop: 2,
            fontFamily: 'JetBrains Mono',
            color: 'rgba(245,246,250,0.4)',
            letterSpacing: 0.3,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={hint}
        >
          {hint}
        </div>
      )}
    </div>
  );
}

function Separator() {
  return <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.08)' }} />;
}
