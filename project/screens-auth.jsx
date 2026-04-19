// Landing / Auth screens: HomePublic, Iscrizione, Login
const { useState: useState1 } = React;

// Public landing — shown when not logged in. Bold hero, funnies explainer, CTAs.
window.HomePublic = function HomePublic({ onAuth }) {
  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      color: '#F5F6FA', fontFamily: 'Inter, system-ui',
      background: 'radial-gradient(120% 60% at 50% 0%, #1A2240 0%, #0A0F1F 55%)',
      position: 'relative', overflow: 'hidden',
    }}>
      <StatusBar />

      {/* decorative stripes background */}
      <div style={{
        position: 'absolute', top: -40, right: -80, width: 260, height: 260,
        borderRadius: '50%', opacity: 0.15, pointerEvents: 'none',
        background: 'repeating-linear-gradient(45deg, #FFDD2E 0 10px, transparent 10px 20px)',
      }}/>
      <div style={{
        position: 'absolute', top: 180, left: -60, width: 180, height: 180,
        borderRadius: '50%', opacity: 0.12, pointerEvents: 'none',
        background: 'repeating-linear-gradient(-45deg, #4C7DFF 0 8px, transparent 8px 16px)',
      }}/>

      {/* top bar */}
      <div style={{ padding: '8px 22px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Wordmark size={22}/>
        <button onClick={() => onAuth('login')} style={{
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
          color: '#F5F6FA', padding: '8px 14px', borderRadius: 100, fontSize: 13, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'Inter',
        }}>Accedi</button>
      </div>

      {/* hero */}
      <div style={{ flex: 1, padding: '30px 22px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#FFDD2E',
          textTransform: 'uppercase', letterSpacing: 2, marginBottom: 14,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFDD2E', boxShadow: '0 0 8px #FFDD2E' }}/>
          Pronostici sportivi — 100% gratis
        </div>
        <div style={{
          fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 52,
          letterSpacing: -2.2, lineHeight: 0.95, marginBottom: 18,
        }}>
          Gioca.<br/>
          Pronostica.<br/>
          <span style={{ color: '#FFDD2E' }}>Vinci veri premi.</span>
        </div>
        <div style={{ color: 'rgba(245,246,250,0.65)', fontSize: 15, lineHeight: 1.5, marginBottom: 30, maxWidth: 320 }}>
          Pronostica i risultati sportivi, accumula Funnies, sfida gli amici e riscatta premi reali. Senza mai tirare fuori un euro.
        </div>

        {/* funnies counter strip */}
        <div style={{
          display: 'flex', gap: 10, marginBottom: 28, padding: '14px 16px',
          background: 'rgba(26,34,64,0.6)', borderRadius: 18,
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'rgba(245,246,250,0.5)', textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'JetBrains Mono' }}>Montepremi mese</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <Funnie size={18}/>
              <span style={{ fontFamily: 'Space Grotesk', fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>120.000</span>
            </div>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.08)' }}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'rgba(245,246,250,0.5)', textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'JetBrains Mono' }}>Giocatori online</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#3DDC97', boxShadow: '0 0 6px #3DDC97' }}/>
              <span style={{ fontFamily: 'Space Grotesk', fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>12.847</span>
            </div>
          </div>
        </div>

        <button onClick={() => onAuth('signup')} style={{
          background: '#FFDD2E', color: '#0A0F1F', border: 0, borderRadius: 100,
          padding: '18px 20px', fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 17,
          letterSpacing: -0.3, cursor: 'pointer', boxShadow: '0 8px 24px rgba(255,221,46,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          Crea account gratis
          <Icon name="chevR" size={18}/>
        </button>
        <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: 'rgba(245,246,250,0.4)' }}>
          300 Funnies di benvenuto · nessuna carta richiesta
        </div>
      </div>

      {/* sport chips at bottom */}
      <div style={{ padding: '0 22px 30px', display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        {[['football','Calcio'],['basket','Basket'],['tennis','Tennis'],['f1','F1']].map(([i, l]) => (
          <div key={l} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 12px', background: 'rgba(255,255,255,0.06)',
            borderRadius: 100, fontSize: 12, fontWeight: 500, color: 'rgba(245,246,250,0.8)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <Icon name={i} size={14}/>
            {l}
          </div>
        ))}
      </div>
    </div>
  );
};

// Multi-step signup
window.Iscrizione = function Iscrizione({ onDone, onBack }) {
  const [step, setStep] = useState1(0);
  const [data, setData] = useState1({ nick: '', email: '', sport: [] });
  const sports = [
    { id: 'calcio', l: 'Calcio', i: 'football' },
    { id: 'basket', l: 'Basket', i: 'basket' },
    { id: 'tennis', l: 'Tennis', i: 'tennis' },
    { id: 'f1', l: 'Formula 1', i: 'f1' },
  ];
  const toggle = (id) => setData(d => ({ ...d, sport: d.sport.includes(id) ? d.sport.filter(x => x !== id) : [...d.sport, id] }));
  const steps = ['Account', 'Preferenze', 'Pronti'];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#0A0F1F', color: '#F5F6FA', fontFamily: 'Inter' }}>
      <StatusBar />
      <div style={{ padding: '8px 22px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={step === 0 ? onBack : () => setStep(step - 1)} style={{
          background: 'rgba(255,255,255,0.06)', border: 0, color: '#F5F6FA',
          width: 36, height: 36, borderRadius: 12, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="chevL" size={18}/>
        </button>
        <div style={{ flex: 1, display: 'flex', gap: 6 }}>
          {steps.map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: i <= step ? '#FFDD2E' : 'rgba(255,255,255,0.12)',
              transition: 'background 0.3s',
            }}/>
          ))}
        </div>
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'rgba(245,246,250,0.5)' }}>
          {step + 1}/{steps.length}
        </div>
      </div>

      <div style={{ flex: 1, padding: '30px 22px', overflowY: 'auto' }}>
        {step === 0 && (
          <>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 32, letterSpacing: -1, lineHeight: 1.05 }}>Crea il tuo<br/>account.</div>
            <div style={{ color: 'rgba(245,246,250,0.6)', fontSize: 14, marginTop: 10, marginBottom: 28 }}>Ti servono solo 60 secondi.</div>

            <Field label="Nickname" icon="user">
              <input value={data.nick} onChange={e => setData({...data, nick: e.target.value})} placeholder="pronostico_99" style={inputStyle} />
            </Field>
            <Field label="Email" icon="mail">
              <input value={data.email} onChange={e => setData({...data, email: e.target.value})} placeholder="mario@mail.it" style={inputStyle} />
            </Field>
            <Field label="Password" icon="lock">
              <input type="password" defaultValue="••••••••" style={inputStyle}/>
              <Icon name="eye" size={18} color="rgba(245,246,250,0.4)"/>
            </Field>
          </>
        )}
        {step === 1 && (
          <>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 32, letterSpacing: -1, lineHeight: 1.05 }}>Quali sport<br/>ti appassionano?</div>
            <div style={{ color: 'rgba(245,246,250,0.6)', fontSize: 14, marginTop: 10, marginBottom: 28 }}>Personalizziamo i tuoi concorsi.</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {sports.map(s => {
                const on = data.sport.includes(s.id);
                return (
                  <button key={s.id} onClick={() => toggle(s.id)} style={{
                    background: on ? 'rgba(255,221,46,0.12)' : 'rgba(26,34,64,0.6)',
                    border: on ? '1.5px solid #FFDD2E' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 18, padding: '18px 14px', cursor: 'pointer', color: '#F5F6FA',
                    display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10,
                    transition: 'all 0.2s', fontFamily: 'Inter',
                  }}>
                    <Icon name={s.i} size={26} color={on ? '#FFDD2E' : '#F5F6FA'}/>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{s.l}</div>
                    <div style={{ fontSize: 11, color: 'rgba(245,246,250,0.4)', fontFamily: 'JetBrains Mono' }}>
                      {on ? '✓ SELEZIONATO' : 'TOCCA PER AGGIUNGERE'}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
        {step === 2 && (
          <div style={{ textAlign: 'center', paddingTop: 20 }}>
            <div style={{
              width: 120, height: 120, borderRadius: 60, margin: '0 auto 28px',
              background: 'radial-gradient(circle at 30% 30%, #FFE769, #E6A617)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 20px 50px rgba(255,221,46,0.4)',
              fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 64, color: '#3D2800',
              animation: 'pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}>ƒ</div>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 30, letterSpacing: -1, lineHeight: 1.05 }}>
              Benvenuto,<br/>{data.nick || 'pronostico_99'}!
            </div>
            <div style={{ color: 'rgba(245,246,250,0.6)', fontSize: 15, marginTop: 14, marginBottom: 30 }}>
              Abbiamo accreditato 300 Funnies sul tuo conto.<br/>Ora tocca a te pronosticare.
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '12px 20px', background: 'rgba(255,221,46,0.1)',
              border: '1px solid rgba(255,221,46,0.25)', borderRadius: 100,
              fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 24,
            }}>
              <Funnie size={22} glow/>
              +300 Funnies
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '0 22px 30px' }}>
        <button onClick={() => step < 2 ? setStep(step + 1) : onDone()} style={{
          width: '100%', background: '#FFDD2E', color: '#0A0F1F', border: 0, borderRadius: 100,
          padding: '18px', fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 16,
          cursor: 'pointer', boxShadow: '0 8px 24px rgba(255,221,46,0.25)',
        }}>
          {step === 0 ? 'Continua' : step === 1 ? 'Quasi fatto' : 'Entra'}
        </button>
      </div>
      <style>{`@keyframes pop { 0% { transform: scale(0.3); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }`}</style>
    </div>
  );
};

function Field({ label, icon, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, color: 'rgba(245,246,250,0.5)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6, fontFamily: 'JetBrains Mono' }}>{label}</div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'rgba(26,34,64,0.6)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 14, padding: '14px 16px',
      }}>
        <Icon name={icon} size={18} color="rgba(245,246,250,0.5)"/>
        {children}
      </div>
    </div>
  );
}
const inputStyle = {
  flex: 1, background: 'transparent', border: 0, outline: 'none',
  color: '#F5F6FA', fontSize: 15, fontFamily: 'Inter', padding: 0,
};
