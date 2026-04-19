import { useEffect, useState } from 'react';
import Screen from '../components/Screen.jsx';
import Icon from '../components/Icon.jsx';
import LeaderRow from '../components/LeaderRow.jsx';
import { useApp } from '../context/AppContext.jsx';

// Dati demo usati come fallback se Supabase non è configurato o se la
// RPC globale non restituisce ancora nulla.
const DEMO = {
  generale: [
    { n: 1, nick: 'CP72',         pts: 9195, funnies: 265316, delta: 0 },
    { n: 2, nick: 'ValerioLazio', pts: 9147, funnies: 239975, delta: 0 },
    { n: 3, nick: 'emricci',      pts: 9089, funnies: 137849, delta: 1 },
    { n: 4, nick: 'stefa11',      pts: 9086, funnies: 327406, delta: -1 },
    { n: 5, nick: 'ccgdd',        pts: 9077, funnies: 67476,  delta: 2 },
    { n: 6, nick: 'AliVBM',       pts: 9073, funnies: 87527,  delta: 0 },
    { n: 7, nick: 'umbyumby',     pts: 9071, funnies: 187395, delta: 3 },
    { n: 8, nick: 'ZeroK',        pts: 9064, funnies: 242502, delta: -2 },
  ],
  mensile: [
    { n: 1, nick: 'biggiuki',  pts: 1824, funnies: 142688, delta: 2 },
    { n: 2, nick: 'stefall',   pts: 1801, funnies: 113475, delta: 0 },
    { n: 3, nick: 'capo2000',  pts: 1789, funnies: 97106,  delta: 1 },
    { n: 4, nick: 'astan1975', pts: 1766, funnies: 71262,  delta: -2 },
    { n: 5, nick: 'stefanf',   pts: 1744, funnies: 69461,  delta: 4 },
  ],
  amici: [
    { n: 1, nick: 'marcoB',    pts: 1523, funnies: 12400, delta: 0 },
    { n: 2, nick: 'giulia88',  pts: 1489, funnies: 9200,  delta: 1 },
    { n: 3, nick: 'Luca (TU)', pts: 1342, funnies: 14200, delta: 0, me: true },
    { n: 4, nick: 'andre.ro',  pts: 1298, funnies: 6700,  delta: -2 },
  ],
};

const TABS = [
  { id: 'generale', label: 'Generale' },
  { id: 'mensile',  label: 'Mensile' },
  { id: 'amici',    label: 'Amici' },
];

export default function Classifiche() {
  const [tab, setTab] = useState('generale');
  const { globalLeaderboard, isSupabaseConfigured } = useApp();
  const [live, setLive] = useState(null);
  const [myRank, setMyRank] = useState(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let alive = true;
    globalLeaderboard()
      .then((rows) => {
        if (!alive || !Array.isArray(rows)) return;
        // Mappa sulla forma attesa da LeaderRow: { n, nick, pts, funnies, delta, me }
        const mapped = rows.map((r, i) => ({
          n: r.rank ?? i + 1,
          nick: r.nick,
          pts: Number(r.funnies ?? 0),
          funnies: Number(r.funnies ?? 0),
          delta: 0,
          me: !!r.is_me,
        }));
        setLive(mapped);
        const mine = mapped.find((x) => x.me);
        if (mine) setMyRank(mine.n);
      })
      .catch(() => setLive(null));
    return () => { alive = false; };
  }, [isSupabaseConfigured, globalLeaderboard]);

  // Sceglie fra dati live e demo a seconda del tab + disponibilità.
  const data = tab === 'generale' && live && live.length > 0 ? live : DEMO[tab];

  return (
    <Screen title="Classifiche" subtitle="Confrontati con tutta la community.">
      {/* la tua posizione */}
      <div style={{ padding: '0 22px 20px' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #1A2240 0%, #0A0F1F 100%)',
            border: '1px solid rgba(255,221,46,0.15)',
            borderRadius: 22,
            padding: 18,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontFamily: 'JetBrains Mono',
              color: '#FFDD2E',
              textTransform: 'uppercase',
              letterSpacing: 1.5,
            }}
          >
            La tua posizione
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8 }}>
            <div
              style={{
                fontFamily: 'Space Grotesk',
                fontWeight: 800,
                fontSize: 52,
                letterSpacing: -2,
                lineHeight: 1,
              }}
            >
              {myRank != null ? `#${myRank}` : '#247'}
            </div>
            <div
              style={{
                fontSize: 13,
                color: '#3DDC97',
                display: 'flex',
                alignItems: 'center',
                gap: 3,
              }}
            >
              <Icon name="arrowU" size={12} /> 34 questa settimana
            </div>
          </div>
          <div style={{ marginTop: 14, display: 'flex', gap: 20 }}>
            <MiniStat label="Punti" value="8.421" />
            <MiniStat label="Accuratezza" value="64%" />
            <MiniStat
              label="Streak"
              value={
                <span
                  style={{ color: '#FFDD2E', display: 'flex', alignItems: 'center', gap: 3 }}
                >
                  <Icon name="flame" size={14} /> 7
                </span>
              }
            />
          </div>
        </div>
      </div>

      {/* tabs */}
      <div
        style={{
          margin: '0 22px 18px',
          padding: 4,
          display: 'flex',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 100,
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1,
              background: tab === t.id ? '#FFDD2E' : 'transparent',
              color: tab === t.id ? '#0A0F1F' : 'rgba(245,246,250,0.6)',
              border: 0,
              borderRadius: 100,
              padding: 9,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'Inter',
              transition: 'all 0.2s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '0 22px 30px' }}>
        {data.map((p) => (
          <LeaderRow key={p.n} {...p} />
        ))}
        {tab !== 'amici' && !(live && live.some((x) => x.me)) && (
          <>
            <div
              style={{
                textAlign: 'center',
                padding: '12px 0',
                color: 'rgba(245,246,250,0.3)',
                letterSpacing: 6,
              }}
            >
              · · ·
            </div>
            <LeaderRow n={myRank ?? 247} nick="Luca (TU)" pts={8421} funnies={14200} delta={3} me />
          </>
        )}
      </div>
    </Screen>
  );
}

function MiniStat({ label, value }) {
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          color: 'rgba(245,246,250,0.5)',
          fontFamily: 'JetBrains Mono',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Space Grotesk' }}>{value}</div>
    </div>
  );
}
