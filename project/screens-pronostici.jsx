// Pronostici list + schedina detail
const { useState: useState3 } = React;

window.PronosticiList = function PronosticiList({ go }) {
  const [filter, setFilter] = useState3('tutti');
  const contests = [
    { id: 'cl', sport: 'football', league: 'Champions League', sub: 'Ottavi — Ritorno', n: 8, time: '2h 14m', points: 5000, urgent: true, status: 'open' },
    { id: 'sa', sport: 'football', league: 'Serie A', sub: '28ª giornata', n: 10, time: '1g 4h', points: 7500, status: 'open' },
    { id: 'nba', sport: 'basket', league: 'NBA Playoff', sub: 'Conference finals', n: 4, time: '2g 6h', points: 3500, status: 'open' },
    { id: 'atp', sport: 'tennis', league: 'ATP Miami', sub: 'Quarti', n: 4, time: '3g 2h', points: 2500, status: 'open' },
    { id: 'f1', sport: 'f1', league: 'Formula 1', sub: 'GP Imola', n: 3, time: '5g', points: 3000, status: 'open' },
    { id: 'ek', sport: 'football', league: 'Europa Conf. League', sub: 'Semifinali', n: 4, time: 'Chiuso', points: 2000, status: 'closed', result: 7 },
  ];

  const filters = [
    { id: 'tutti', l: 'Tutti' },
    { id: 'football', l: 'Calcio' },
    { id: 'basket', l: 'Basket' },
    { id: 'tennis', l: 'Tennis' },
    { id: 'f1', l: 'F1' },
  ];
  const visible = filter === 'tutti' ? contests : contests.filter(c => c.sport === filter);

  return (
    <Screen
      title="Pronostici"
      subtitle="Concorsi gratuiti aperti ora."
      headerRight={
        <button style={{
          background: 'rgba(255,255,255,0.06)', border: 0, color: '#F5F6FA',
          width: 40, height: 40, borderRadius: 14, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="calendar" size={20}/>
        </button>
      }
    >
      {/* Filter chips */}
      <div style={{
        padding: '0 22px 18px', display: 'flex', gap: 8, overflowX: 'auto',
        scrollbarWidth: 'none',
      }}>
        {filters.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            padding: '9px 16px', borderRadius: 100, border: 0, cursor: 'pointer',
            background: filter === f.id ? '#FFDD2E' : 'rgba(255,255,255,0.06)',
            color: filter === f.id ? '#0A0F1F' : 'rgba(245,246,250,0.75)',
            fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', fontFamily: 'Inter',
            transition: 'all 0.2s',
          }}>{f.l}</button>
        ))}
      </div>

      <div style={{ padding: '0 22px' }}>
        {visible.map(c => {
          const closed = c.status === 'closed';
          return (
            <button key={c.id} onClick={() => !closed && go('schedina', c)} style={{
              width: '100%', background: '#111830', borderRadius: 20,
              border: c.urgent ? '1px solid rgba(255,90,106,0.3)' : '1px solid rgba(255,255,255,0.04)',
              padding: 16, marginBottom: 10, cursor: closed ? 'default' : 'pointer',
              color: '#F5F6FA', textAlign: 'left', opacity: closed ? 0.55 : 1,
              position: 'relative', overflow: 'hidden',
              fontFamily: 'Inter',
            }}>
              {c.urgent && (
                <div style={{
                  position: 'absolute', top: 12, right: 12,
                  padding: '3px 8px', borderRadius: 100,
                  background: 'rgba(255,90,106,0.15)', color: '#FF5A6A',
                  fontSize: 10, fontFamily: 'JetBrains Mono', textTransform: 'uppercase',
                  letterSpacing: 1, fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: 3, background: '#FF5A6A', animation: 'pulse 1.5s ease-in-out infinite' }}/>
                  Urgente
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: 'rgba(76,125,255,0.15)', color: '#4C7DFF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name={c.sport} size={22}/>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: 'rgba(245,246,250,0.5)', textTransform: 'uppercase', letterSpacing: 1 }}>{c.sub}</div>
                  <div style={{ fontFamily: 'Space Grotesk', fontSize: 17, fontWeight: 700, letterSpacing: -0.4, marginTop: 2 }}>{c.league}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12 }}>
                <Stat label="Manches" value={c.n}/>
                <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.08)' }}/>
                <Stat label={closed ? 'Risultato' : 'Chiude tra'} value={closed ? `${c.result}/${c.n} pt` : c.time}/>
                <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.08)' }}/>
                <Stat label="Montepremi" value={<><Funnie size={11}/> {c.points.toLocaleString('it-IT')}</>} color="#FFDD2E"/>
              </div>
            </button>
          );
        })}
      </div>
      <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
    </Screen>
  );
};

function Stat({ label, value, color }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 10, color: 'rgba(245,246,250,0.45)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2, color: color || '#F5F6FA', display: 'flex', alignItems: 'center', gap: 4 }}>{value}</div>
    </div>
  );
}

window.Schedina = function Schedina({ go, contest, onSubmit }) {
  const matches = [
    { id: 'm1', home: 'Inter', away: 'Real Madrid', time: '20:45', tip: 'Champions · Andata 1-1' },
    { id: 'm2', home: 'Arsenal', away: 'Bayern', time: '20:45', tip: 'Champions · Andata 2-2' },
    { id: 'm3', home: 'Barcelona', away: 'PSG', time: '21:00', tip: 'Champions · Andata 0-1' },
    { id: 'm4', home: 'Atlético', away: 'Dortmund', time: '21:00', tip: 'Champions · Andata 1-2' },
  ];
  const [picks, setPicks] = useState3({});
  const [submitted, setSubmitted] = useState3(false);

  const setPick = (id, field, val) => setPicks(p => ({ ...p, [id]: { ...(p[id] || {}), [field]: val } }));
  const completed = matches.filter(m => picks[m.id]?.h !== undefined && picks[m.id]?.a !== undefined).length;
  const canSubmit = completed === matches.length;

  if (submitted) {
    return (
      <div style={{ height: '100%', background: '#0A0F1F', color: '#F5F6FA', display: 'flex', flexDirection: 'column', fontFamily: 'Inter' }}>
        <StatusBar />
        <div style={{ flex: 1, padding: '60px 30px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{
            width: 96, height: 96, borderRadius: 48, marginBottom: 28,
            background: 'radial-gradient(circle at 30% 30%, #3DDC97, #1ea868)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 20px 50px rgba(61,220,151,0.35)',
            animation: 'pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}>
            <Icon name="check" size={46} color="#0A0F1F" stroke={3}/>
          </div>
          <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 30, letterSpacing: -1 }}>Pronostici salvati!</div>
          <div style={{ color: 'rgba(245,246,250,0.6)', fontSize: 15, marginTop: 10, maxWidth: 280 }}>
            Ti ricordiamo che puoi modificarli finché la manche resta aperta.
          </div>
          <div style={{
            marginTop: 28, padding: '14px 22px', background: 'rgba(26,34,64,0.6)',
            borderRadius: 18, border: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', gap: 24,
          }}>
            <div>
              <div style={{ fontSize: 10, color: 'rgba(245,246,250,0.45)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase' }}>Pronostici</div>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 22 }}>{matches.length}/{matches.length}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'rgba(245,246,250,0.45)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase' }}>Max punti</div>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 22, color: '#FFDD2E' }}>+{matches.length * 10}</div>
            </div>
          </div>
        </div>
        <div style={{ padding: '0 22px 40px', display: 'flex', gap: 10 }}>
          <button onClick={() => { setSubmitted(false); }} style={{
            flex: 1, background: 'rgba(255,255,255,0.08)', color: '#F5F6FA', border: 0,
            borderRadius: 100, padding: '16px', fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 15, cursor: 'pointer',
          }}>Modifica</button>
          <button onClick={() => go('pronostici')} style={{
            flex: 2, background: '#FFDD2E', color: '#0A0F1F', border: 0,
            borderRadius: 100, padding: '16px', fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 15, cursor: 'pointer',
          }}>Altri concorsi</button>
        </div>
        <style>{`@keyframes pop { 0% { transform: scale(0.3); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }`}</style>
      </div>
    );
  }

  return (
    <Screen
      title={contest?.league || 'Schedina'}
      subtitle={contest?.sub || 'Pronostica i risultati esatti.'}
      onBack={() => go('pronostici')}
      headerRight={
        <div style={{
          padding: '6px 10px', background: 'rgba(255,221,46,0.1)',
          border: '1px solid rgba(255,221,46,0.2)', borderRadius: 100,
          fontSize: 12, fontFamily: 'JetBrains Mono', color: '#FFDD2E',
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: 3, background: '#FF5A6A', animation: 'pulse 1.5s ease-in-out infinite' }}/>
          2:14:32
        </div>
      }
    >
      {/* Progress */}
      <div style={{ padding: '0 22px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12, color: 'rgba(245,246,250,0.6)' }}>
          <span>{completed} di {matches.length} manches pronosticate</span>
          <span style={{ fontFamily: 'JetBrains Mono', color: '#FFDD2E' }}>+{completed * 10} PT max</span>
        </div>
        <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            width: `${(completed / matches.length) * 100}%`, height: '100%',
            background: 'linear-gradient(90deg, #FFDD2E, #E6A617)',
            borderRadius: 3, transition: 'width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}/>
        </div>
      </div>

      <div style={{ padding: '0 22px' }}>
        {matches.map((m, i) => {
          const p = picks[m.id] || {};
          const done = p.h !== undefined && p.a !== undefined;
          return (
            <div key={m.id} style={{
              background: done ? 'rgba(61,220,151,0.06)' : '#111830',
              borderRadius: 20, padding: 18, marginBottom: 10,
              border: done ? '1px solid rgba(61,220,151,0.25)' : '1px solid rgba(255,255,255,0.04)',
              transition: 'all 0.3s',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: 'rgba(245,246,250,0.5)', textTransform: 'uppercase', letterSpacing: 1 }}>
                  {m.tip}
                </div>
                <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: '#4C7DFF' }}>{m.time}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10, alignItems: 'center' }}>
                <TeamCell name={m.home} align="right"/>
                <ScoreInput
                  h={p.h} a={p.a}
                  onH={v => setPick(m.id, 'h', v)}
                  onA={v => setPick(m.id, 'a', v)}
                />
                <TeamCell name={m.away} align="left"/>
              </div>
              {/* Quick-picks */}
              <div style={{ display: 'flex', gap: 6, marginTop: 12, justifyContent: 'center' }}>
                {['1-0', '2-1', '1-1', '0-0', '1-2', '0-1'].map(q => {
                  const [h, a] = q.split('-').map(Number);
                  const sel = p.h === h && p.a === a;
                  return (
                    <button key={q} onClick={() => { setPick(m.id, 'h', h); setPick(m.id, 'a', a); }} style={{
                      padding: '6px 12px', borderRadius: 100, border: 0, cursor: 'pointer',
                      background: sel ? '#FFDD2E' : 'rgba(255,255,255,0.04)',
                      color: sel ? '#0A0F1F' : 'rgba(245,246,250,0.6)',
                      fontSize: 12, fontFamily: 'JetBrains Mono', fontWeight: 600,
                      transition: 'all 0.15s',
                    }}>{q}</button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ padding: '16px 22px 30px' }}>
        <button
          disabled={!canSubmit}
          onClick={() => setSubmitted(true)}
          style={{
            width: '100%', background: canSubmit ? '#FFDD2E' : 'rgba(255,255,255,0.06)',
            color: canSubmit ? '#0A0F1F' : 'rgba(245,246,250,0.3)',
            border: 0, borderRadius: 100, padding: '18px',
            fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 16,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            boxShadow: canSubmit ? '0 8px 24px rgba(255,221,46,0.25)' : 'none',
            transition: 'all 0.2s',
          }}
        >
          {canSubmit ? 'Conferma pronostici' : `Completa ${matches.length - completed} manches ancora`}
        </button>
      </div>
      <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } } @keyframes pop { 0% { transform: scale(0.3); } 100% { transform: scale(1); } }`}</style>
    </Screen>
  );
};

function TeamCell({ name, align }) {
  // placeholder crest
  const initials = name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: align === 'right' ? 'flex-end' : 'flex-start', gap: 8 }}>
      <div style={{
        width: 42, height: 42, borderRadius: 12,
        background: 'repeating-linear-gradient(45deg, #2952D9 0 6px, #4C7DFF 6px 12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 14, color: '#0A0F1F',
        boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.1)',
      }}>
        <span style={{ background: 'rgba(255,255,255,0.9)', padding: '2px 4px', borderRadius: 3 }}>{initials}</span>
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, textAlign: align, maxWidth: 80, lineHeight: 1.2 }}>{name}</div>
    </div>
  );
}

function ScoreInput({ h, a, onH, onA }) {
  const cell = (val, set) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <button onClick={() => set((val ?? 0) + 1)} style={{
        background: 'transparent', border: 0, color: 'rgba(245,246,250,0.3)', cursor: 'pointer', padding: 2,
      }}>
        <Icon name="arrowU" size={14}/>
      </button>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: val !== undefined ? '#FFDD2E' : 'rgba(255,255,255,0.06)',
        color: val !== undefined ? '#0A0F1F' : 'rgba(245,246,250,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 22,
        transition: 'all 0.2s',
      }}>{val ?? '—'}</div>
      <button onClick={() => set(Math.max(0, (val ?? 0) - 1))} style={{
        background: 'transparent', border: 0, color: 'rgba(245,246,250,0.3)', cursor: 'pointer', padding: 2,
      }}>
        <Icon name="arrowD" size={14}/>
      </button>
    </div>
  );
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {cell(h, onH)}
      <div style={{ color: 'rgba(245,246,250,0.3)', fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 20 }}>:</div>
      {cell(a, onA)}
    </div>
  );
}
