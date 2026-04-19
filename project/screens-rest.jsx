// Classifiche, Premi, Profilo
const { useState: useState4 } = React;

window.Classifiche = function Classifiche({ go }) {
  const [tab, setTab] = useState4('generale');
  const data = {
    generale: [
      { n: 1, nick: 'CP72', pts: 9195, funnies: 265316, delta: 0 },
      { n: 2, nick: 'ValerioLazio', pts: 9147, funnies: 239975, delta: 0 },
      { n: 3, nick: 'emricci', pts: 9089, funnies: 137849, delta: 1 },
      { n: 4, nick: 'stefa11', pts: 9086, funnies: 327406, delta: -1 },
      { n: 5, nick: 'ccgdd', pts: 9077, funnies: 67476, delta: 2 },
      { n: 6, nick: 'AliVBM', pts: 9073, funnies: 87527, delta: 0 },
      { n: 7, nick: 'umbyumby', pts: 9071, funnies: 187395, delta: 3 },
      { n: 8, nick: 'ZeroK', pts: 9064, funnies: 242502, delta: -2 },
    ],
    mensile: [
      { n: 1, nick: 'biggiuki', pts: 1824, funnies: 142688, delta: 2 },
      { n: 2, nick: 'stefall', pts: 1801, funnies: 113475, delta: 0 },
      { n: 3, nick: 'capo2000', pts: 1789, funnies: 97106, delta: 1 },
      { n: 4, nick: 'astan1975', pts: 1766, funnies: 71262, delta: -2 },
      { n: 5, nick: 'stefanf', pts: 1744, funnies: 69461, delta: 4 },
    ],
    amici: [
      { n: 1, nick: 'marcoB', pts: 1523, funnies: 12400, delta: 0 },
      { n: 2, nick: 'giulia88', pts: 1489, funnies: 9200, delta: 1 },
      { n: 3, nick: 'Luca (TU)', pts: 1342, funnies: 14200, delta: 0, me: true },
      { n: 4, nick: 'andre.ro', pts: 1298, funnies: 6700, delta: -2 },
    ],
  };
  const tabs = [
    { id: 'generale', l: 'Generale' },
    { id: 'mensile', l: 'Mensile' },
    { id: 'amici', l: 'Amici' },
  ];

  return (
    <Screen
      title="Classifiche"
      subtitle="Confrontati con tutta la community."
    >
      {/* Your position card */}
      <div style={{ padding: '0 22px 20px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #1A2240 0%, #0A0F1F 100%)',
          border: '1px solid rgba(255,221,46,0.15)',
          borderRadius: 22, padding: 18, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: '#FFDD2E', textTransform: 'uppercase', letterSpacing: 1.5 }}>La tua posizione</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8 }}>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 52, letterSpacing: -2, lineHeight: 1 }}>#247</div>
            <div style={{ fontSize: 13, color: '#3DDC97', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Icon name="arrowU" size={12}/> 34 questa settimana
            </div>
          </div>
          <div style={{ marginTop: 14, display: 'flex', gap: 20 }}>
            <div>
              <div style={{ fontSize: 10, color: 'rgba(245,246,250,0.5)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase' }}>Punti</div>
              <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Space Grotesk' }}>8.421</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'rgba(245,246,250,0.5)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase' }}>Accuratezza</div>
              <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Space Grotesk' }}>64%</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'rgba(245,246,250,0.5)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase' }}>Streak</div>
              <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Space Grotesk', color: '#FFDD2E', display: 'flex', alignItems: 'center', gap: 3 }}>
                <Icon name="flame" size={14}/> 7
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        margin: '0 22px 18px', padding: 4, display: 'flex',
        background: 'rgba(255,255,255,0.04)', borderRadius: 100,
      }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, background: tab === t.id ? '#FFDD2E' : 'transparent',
            color: tab === t.id ? '#0A0F1F' : 'rgba(245,246,250,0.6)',
            border: 0, borderRadius: 100, padding: '9px', fontSize: 13,
            fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter', transition: 'all 0.2s',
          }}>{t.l}</button>
        ))}
      </div>

      <div style={{ padding: '0 22px 30px' }}>
        {data[tab].map(p => <LeaderRow key={p.n} {...p}/>)}
        {/* Me row if not in list */}
        {tab !== 'amici' && (
          <>
            <div style={{ textAlign: 'center', padding: '12px 0', color: 'rgba(245,246,250,0.3)', letterSpacing: 6 }}>· · ·</div>
            <LeaderRow n={247} nick="Luca (TU)" pts={8421} funnies={14200} delta={3} me/>
          </>
        )}
      </div>
    </Screen>
  );
};

window.Premi = function Premi({ go, funnies }) {
  const [cat, setCat] = useState4('tutti');
  const prizes = [
    { id: 1, title: 'Maglia ufficiale — Inter 25/26', cat: 'sport', funnies: 28500, tone: 'blue', tag: 'Sport' },
    { id: 2, title: 'AirPods Pro', cat: 'tech', funnies: 45000, tone: 'dark', tag: 'Tech' },
    { id: 3, title: 'Buono Amazon 25€', cat: 'buoni', funnies: 12500, tone: 'yellow', tag: 'Buono' },
    { id: 4, title: 'Pallone Champions League', cat: 'sport', funnies: 8500, tone: 'yellow', tag: 'Sport' },
    { id: 5, title: 'FIFA 26 PS5', cat: 'games', funnies: 22000, tone: 'blue', tag: 'Gaming' },
    { id: 6, title: 'Abbonamento DAZN 1 mese', cat: 'tech', funnies: 18000, tone: 'dark', tag: 'Streaming' },
  ];
  const cats = [
    { id: 'tutti', l: 'Tutti' },
    { id: 'sport', l: 'Sport' },
    { id: 'tech', l: 'Tech' },
    { id: 'games', l: 'Gaming' },
    { id: 'buoni', l: 'Buoni' },
  ];
  const visible = cat === 'tutti' ? prizes : prizes.filter(p => p.cat === cat);

  return (
    <Screen
      title="Premi"
      subtitle="Spendi i tuoi Funnies."
      headerRight={
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 12px', background: 'rgba(255,221,46,0.1)',
          border: '1px solid rgba(255,221,46,0.2)', borderRadius: 100,
        }}>
          <Funnie size={14}/>
          <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 14, color: '#FFDD2E' }}>
            {funnies.toLocaleString('it-IT')}
          </span>
        </div>
      }
    >
      {/* Hero featured prize */}
      <div style={{ padding: '0 22px 20px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #FFDD2E 0%, #E6A617 100%)',
          borderRadius: 24, padding: 20, color: '#1A0F00', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', right: -60, top: -40, width: 200, height: 200,
            borderRadius: '50%',
            background: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.1) 0 8px, transparent 8px 16px)',
          }}/>
          <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: 1.5, opacity: 0.7 }}>
            ⚡ Asta in corso · 3g 2h
          </div>
          <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 22, letterSpacing: -0.6, lineHeight: 1.1, marginTop: 6 }}>
            iPhone 16 Pro<br/>256GB
          </div>
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono', opacity: 0.6, textTransform: 'uppercase' }}>Offerta più alta</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                <Funnie size={20}/>
                <span style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 24 }}>147.500</span>
              </div>
            </div>
            <button style={{
              background: '#0A0F1F', color: '#FFDD2E', border: 0, borderRadius: 100,
              padding: '12px 18px', fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13,
              cursor: 'pointer',
            }}>Fai offerta →</button>
          </div>
        </div>
      </div>

      {/* Cats */}
      <div style={{ padding: '0 22px 18px', display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {cats.map(c => (
          <button key={c.id} onClick={() => setCat(c.id)} style={{
            padding: '9px 16px', borderRadius: 100, border: 0, cursor: 'pointer',
            background: cat === c.id ? '#FFDD2E' : 'rgba(255,255,255,0.06)',
            color: cat === c.id ? '#0A0F1F' : 'rgba(245,246,250,0.75)',
            fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', fontFamily: 'Inter',
          }}>{c.l}</button>
        ))}
      </div>

      {/* Grid */}
      <div style={{ padding: '0 22px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {visible.map(p => {
          const affordable = funnies >= p.funnies;
          return (
            <div key={p.id} style={{
              background: '#111830', borderRadius: 18, padding: 12,
              border: '1px solid rgba(255,255,255,0.04)',
            }}>
              <Stripe h={110} tone={p.tone} label={p.tag.toUpperCase()} style={{ borderRadius: 12 }}/>
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 10, lineHeight: 1.3, minHeight: 34 }}>{p.title}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Funnie size={14}/>
                  <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 14, color: affordable ? '#FFDD2E' : 'rgba(245,246,250,0.5)' }}>
                    {p.funnies.toLocaleString('it-IT')}
                  </span>
                </div>
                <button style={{
                  background: affordable ? '#FFDD2E' : 'rgba(255,255,255,0.06)',
                  color: affordable ? '#0A0F1F' : 'rgba(245,246,250,0.3)',
                  border: 0, borderRadius: 100, padding: '6px 12px',
                  fontSize: 11, fontWeight: 700, fontFamily: 'Space Grotesk',
                  cursor: affordable ? 'pointer' : 'not-allowed',
                }}>{affordable ? 'Prendi' : 'Serve +'}</button>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ height: 30 }}/>
    </Screen>
  );
};

window.Profilo = function Profilo({ go, funnies, onLogout }) {
  const stats = [
    { l: 'Pronostici', v: '1.247' },
    { l: 'Accuratezza', v: '64%' },
    { l: 'Streak', v: '7' },
    { l: 'Premi ritirati', v: '8' },
  ];
  const groups = [
    { name: 'Amici del bar', type: 'Lega', members: 12, pos: 3, icon: 'trophy' },
    { name: 'Ufficio Milano', type: 'Campionato', members: 28, pos: 7, icon: 'users' },
    { name: 'Fantacalcio 2026', type: 'Coppa', members: 16, pos: 1, icon: 'sparkle' },
  ];

  return (
    <Screen
      title="Profilo"
      headerRight={
        <button style={{
          background: 'rgba(255,255,255,0.06)', border: 0, color: '#F5F6FA',
          width: 40, height: 40, borderRadius: 14, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="settings" size={20}/>
        </button>
      }
    >
      {/* Avatar + handle */}
      <div style={{ padding: '0 22px 24px', display: 'flex', gap: 16, alignItems: 'center' }}>
        <div style={{
          width: 72, height: 72, borderRadius: 22,
          background: 'linear-gradient(135deg, #FFDD2E 0%, #E6A617 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 32, color: '#1A0F00',
          boxShadow: '0 10px 30px rgba(255,221,46,0.3)',
        }}>L</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 22, letterSpacing: -0.5 }}>Luca Bianchi</div>
          <div style={{ fontSize: 13, color: 'rgba(245,246,250,0.5)', fontFamily: 'JetBrains Mono' }}>@pronostico_99</div>
          <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', background: 'rgba(76,125,255,0.15)', color: '#4C7DFF', borderRadius: 100, fontSize: 11, fontWeight: 600 }}>
            <Icon name="sparkle" size={11}/> Divisione D7 · Pro
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ padding: '0 22px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6 }}>
        {stats.map(s => (
          <div key={s.l} style={{
            background: '#111830', borderRadius: 14, padding: '12px 6px', textAlign: 'center',
            border: '1px solid rgba(255,255,255,0.04)',
          }}>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 18, letterSpacing: -0.4 }}>{s.v}</div>
            <div style={{ fontSize: 9, color: 'rgba(245,246,250,0.5)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 2 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Funnies breakdown */}
      <SectionHeader title="Funnies"/>
      <div style={{ padding: '0 22px 24px' }}>
        <div style={{
          background: '#111830', borderRadius: 20, padding: 18,
          border: '1px solid rgba(255,255,255,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Funnie size={28}/>
              <div>
                <div style={{ fontSize: 11, color: 'rgba(245,246,250,0.5)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase' }}>Saldo attuale</div>
                <div style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 26, letterSpacing: -0.8, lineHeight: 1 }}>{funnies.toLocaleString('it-IT')}</div>
              </div>
            </div>
            <button onClick={() => go('premi')} style={{
              background: '#FFDD2E', color: '#0A0F1F', border: 0, borderRadius: 100,
              padding: '10px 16px', fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 12,
              cursor: 'pointer',
            }}>Spendi</button>
          </div>
          <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ flex: 62, background: '#3DDC97' }}/>
            <div style={{ flex: 25, background: '#4C7DFF' }}/>
            <div style={{ flex: 13, background: '#FFDD2E' }}/>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 11 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: '#3DDC97' }}/>
              <span style={{ color: 'rgba(245,246,250,0.7)' }}>Pronostici · 62%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: '#4C7DFF' }}/>
              <span style={{ color: 'rgba(245,246,250,0.7)' }}>FunBooster · 25%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: '#FFDD2E' }}/>
              <span style={{ color: 'rgba(245,246,250,0.7)' }}>Sfida · 13%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gruppi */}
      <SectionHeader title="I tuoi gruppi" action="+ Nuovo"/>
      <div style={{ padding: '0 22px 24px' }}>
        {groups.map((g, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: 14, marginBottom: 8,
            background: '#111830', borderRadius: 16, border: '1px solid rgba(255,255,255,0.04)',
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: 'rgba(76,125,255,0.15)', color: '#4C7DFF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name={g.icon} size={20}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{g.name}</div>
              <div style={{ fontSize: 11, color: 'rgba(245,246,250,0.5)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 1 }}>
                {g.type} · {g.members} membri
              </div>
            </div>
            <div style={{
              padding: '4px 10px', background: g.pos <= 3 ? 'rgba(255,221,46,0.12)' : 'rgba(255,255,255,0.06)',
              color: g.pos <= 3 ? '#FFDD2E' : 'rgba(245,246,250,0.6)', borderRadius: 100,
              fontSize: 11, fontWeight: 700, fontFamily: 'Space Grotesk',
            }}>#{g.pos}</div>
          </div>
        ))}
      </div>

      {/* Settings list */}
      <SectionHeader title="Account"/>
      <div style={{ padding: '0 22px 40px' }}>
        {[
          { l: 'Preferenze sportive', i: 'bolt' },
          { l: 'Notifiche', i: 'bell' },
          { l: 'Privacy e sicurezza', i: 'lock' },
          { l: 'Aiuto e FAQ', i: 'mail' },
          { l: 'Esci', i: 'x', action: onLogout, danger: true },
        ].map((r, i) => (
          <button key={i} onClick={r.action} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 14,
            padding: '14px 16px', marginBottom: 6,
            background: '#111830', borderRadius: 14, border: '1px solid rgba(255,255,255,0.04)',
            color: r.danger ? '#FF5A6A' : '#F5F6FA', cursor: 'pointer', textAlign: 'left',
            fontFamily: 'Inter',
          }}>
            <Icon name={r.i} size={18} color={r.danger ? '#FF5A6A' : 'rgba(245,246,250,0.6)'}/>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{r.l}</span>
            {!r.danger && <Icon name="chevR" size={14} color="rgba(245,246,250,0.3)"/>}
          </button>
        ))}
      </div>
    </Screen>
  );
};
