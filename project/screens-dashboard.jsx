// Dashboard (loggato), Pronostici list, Schedina detail
const { useState: useState2 } = React;

window.Dashboard = function Dashboard({ go, funnies }) {
  return (
    <Screen
      title={<span>Ciao, <span style={{ color: '#FFDD2E' }}>Luca</span></span>}
      subtitle="Ecco il riepilogo del tuo mese."
      headerRight={
        <button style={{
          background: 'rgba(255,255,255,0.06)', border: 0, color: '#F5F6FA',
          width: 40, height: 40, borderRadius: 14, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
        }}>
          <Icon name="bell" size={20}/>
          <span style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, background: '#FF5A6A' }}/>
        </button>
      }
    >
      {/* Funnies balance card — hero */}
      <div style={{ padding: '0 22px 20px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #FFDD2E 0%, #E6A617 100%)',
          borderRadius: 24, padding: '22px 22px 20px', color: '#1A0F00',
          position: 'relative', overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(255,221,46,0.22)',
        }}>
          <div style={{
            position: 'absolute', right: -30, top: -30, width: 160, height: 160,
            borderRadius: '50%', background: 'rgba(255,255,255,0.12)',
          }}/>
          <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: 1.5, opacity: 0.7 }}>Il tuo saldo</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
            <Funnie size={34}/>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 42, letterSpacing: -1.5, lineHeight: 1 }}>
              {funnies.toLocaleString('it-IT')}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 18, fontSize: 12, fontWeight: 600, position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icon name="arrowU" size={14}/> +2.430 questa sett.
            </div>
            <div style={{ opacity: 0.6 }}>|</div>
            <div>Pos #247</div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ padding: '0 22px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <QuickAction onClick={() => go('pronostici')} icon="bolt" label="Pronostica" sub="3 concorsi aperti" accent/>
        <QuickAction onClick={() => go('funbooster')} icon="flame" label="FunBooster" sub="Moltiplica le vincite"/>
        <QuickAction onClick={() => go('sfida')} icon="sparkle" label="Sfida mese" sub="120.000 in palio"/>
        <QuickAction onClick={() => go('gruppi')} icon="users" label="Gruppi" sub="5 attivi"/>
      </div>

      {/* Live manches */}
      <SectionHeader title="Prossime manches" action="Vedi tutte" onAction={() => go('pronostici')}/>
      <div style={{ padding: '0 22px' }}>
        {[
          { league: 'Champions League', match: 'Inter — Real Madrid', time: '2h 14m', sport: 'football', points: 500, urgent: true },
          { league: 'Serie A, 28ª giornata', match: 'Milan — Juventus', time: 'Domani 20:45', sport: 'football', points: 350 },
          { league: 'ATP Miami', match: 'Sinner — Alcaraz', time: 'Dom 15 Mag', sport: 'tennis', points: 250 },
        ].map((m, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '14px 16px', marginBottom: 8,
            background: '#111830', borderRadius: 18,
            border: '1px solid rgba(255,255,255,0.04)',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: m.urgent ? 'rgba(255,90,106,0.15)' : 'rgba(76,125,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Icon name={m.sport} size={22} color={m.urgent ? '#FF5A6A' : '#4C7DFF'}/>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: 'rgba(245,246,250,0.5)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: 1 }}>{m.league}</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.match}</div>
              <div style={{ fontSize: 12, color: m.urgent ? '#FF5A6A' : 'rgba(245,246,250,0.6)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
                {m.urgent && <span style={{ width: 6, height: 6, borderRadius: 3, background: '#FF5A6A', animation: 'pulse 1.5s ease-in-out infinite' }}/>}
                {m.time} · <Funnie size={11}/> <span style={{ color: '#FFDD2E', fontWeight: 600 }}>{m.points}</span>
              </div>
            </div>
            <Icon name="chevR" size={16} color="rgba(245,246,250,0.3)"/>
          </div>
        ))}
      </div>

      {/* Sfida mese widget */}
      <div style={{ padding: '20px 22px 0' }}>
        <div style={{
          background: 'linear-gradient(135deg, #1A2240 0%, #2952D9 100%)',
          borderRadius: 22, padding: '20px', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', right: -20, bottom: -40,
            fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 140,
            color: 'rgba(255,255,255,0.04)', letterSpacing: -8, lineHeight: 1,
          }}>10</div>
          <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: '#FFDD2E', textTransform: 'uppercase', letterSpacing: 1.5 }}>Sfida del mese</div>
          <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 24, letterSpacing: -0.6, marginTop: 6, lineHeight: 1.1 }}>
            10 manches,<br/>120.000 Funnies in palio.
          </div>
          <div style={{ marginTop: 14, fontSize: 13, color: 'rgba(245,246,250,0.7)' }}>
            Hai pronosticato 4/10 · 72º posto
          </div>
          <div style={{ marginTop: 12, height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: '40%', height: '100%', background: '#FFDD2E', borderRadius: 3 }}/>
          </div>
          <button onClick={() => go('sfida')} style={{
            marginTop: 16, background: '#FFDD2E', color: '#0A0F1F', border: 0,
            borderRadius: 100, padding: '11px 20px', fontFamily: 'Space Grotesk',
            fontWeight: 700, fontSize: 14, cursor: 'pointer',
          }}>Continua la sfida →</button>
        </div>
      </div>

      <SectionHeader title="Top classifica" action="Vedi classifica" onAction={() => go('classifiche')}/>
      <div style={{ padding: '0 22px 30px' }}>
        {[
          { n: 1, nick: 'CP72', pts: 9195, delta: 0 },
          { n: 2, nick: 'ValerioLazio', pts: 9147, delta: 0 },
          { n: 3, nick: 'emricci', pts: 9089, delta: 1 },
        ].map((p) => (
          <LeaderRow key={p.n} {...p}/>
        ))}
      </div>

      <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
    </Screen>
  );
};

function QuickAction({ icon, label, sub, onClick, accent }) {
  return (
    <button onClick={onClick} style={{
      background: accent ? 'rgba(255,221,46,0.08)' : 'rgba(26,34,64,0.7)',
      border: accent ? '1px solid rgba(255,221,46,0.25)' : '1px solid rgba(255,255,255,0.06)',
      borderRadius: 18, padding: '14px', color: '#F5F6FA', cursor: 'pointer',
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8,
      fontFamily: 'Inter', textAlign: 'left',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: accent ? '#FFDD2E' : 'rgba(76,125,255,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={icon} size={20} color={accent ? '#0A0F1F' : '#4C7DFF'} stroke={2.2}/>
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'Space Grotesk', letterSpacing: -0.3 }}>{label}</div>
        <div style={{ fontSize: 11, color: 'rgba(245,246,250,0.55)', marginTop: 2 }}>{sub}</div>
      </div>
    </button>
  );
}

window.SectionHeader = function SectionHeader({ title, action, onAction }) {
  return (
    <div style={{ padding: '8px 22px 12px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
      <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 18, letterSpacing: -0.4 }}>{title}</div>
      {action && (
        <button onClick={onAction} style={{
          background: 'transparent', border: 0, color: '#4C7DFF', fontSize: 13, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'Inter',
        }}>{action} →</button>
      )}
    </div>
  );
};

window.LeaderRow = function LeaderRow({ n, nick, pts, delta, funnies, me }) {
  const medal = n === 1 ? '#FFDD2E' : n === 2 ? '#C0C0CC' : n === 3 ? '#CD7F32' : null;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '12px 14px', marginBottom: 6,
      background: me ? 'rgba(255,221,46,0.08)' : '#111830',
      borderRadius: 14,
      border: me ? '1px solid rgba(255,221,46,0.3)' : '1px solid rgba(255,255,255,0.04)',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 10,
        background: medal || 'rgba(255,255,255,0.06)',
        color: medal ? '#0A0F1F' : 'rgba(245,246,250,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 14,
      }}>{n}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {nick} {me && <span style={{ color: '#FFDD2E', fontSize: 11, fontFamily: 'JetBrains Mono' }}>· TU</span>}
        </div>
        {funnies !== undefined && (
          <div style={{ fontSize: 11, color: 'rgba(245,246,250,0.5)', marginTop: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Funnie size={10}/> {funnies.toLocaleString('it-IT')}
          </div>
        )}
      </div>
      <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 15 }}>{pts.toLocaleString('it-IT')}</div>
      {delta !== undefined && delta !== 0 && (
        <div style={{
          fontSize: 11, color: delta > 0 ? '#3DDC97' : '#FF5A6A', fontFamily: 'JetBrains Mono',
          display: 'flex', alignItems: 'center', gap: 2, width: 28, justifyContent: 'flex-end',
        }}>
          <Icon name={delta > 0 ? 'arrowU' : 'arrowD'} size={10}/>{Math.abs(delta)}
        </div>
      )}
      {delta === 0 && <div style={{ width: 28, textAlign: 'right', color: 'rgba(245,246,250,0.3)', fontSize: 12 }}>—</div>}
    </div>
  );
};
