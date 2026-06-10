import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import Funnie from '../components/Funnie.jsx';
import { useApp } from '../context/AppContext.jsx';

const SPORTS = [
  { id: 'calcio', label: 'Calcio',    icon: 'football' },
  { id: 'basket', label: 'Basket',    icon: 'basket' },
  { id: 'tennis', label: 'Tennis',    icon: 'tennis' },
  { id: 'f1',     label: 'Formula 1', icon: 'f1' },
];
const STEPS = ['Account', 'Preferenze', 'Consensi', 'Pronti'];

export default function Iscrizione() {
  const navigate = useNavigate();
  const { signUp, signIn, isSupabaseConfigured, nickAvailable } = useApp();

  const [mode, setMode] = useState('signup'); // 'signup' | 'login'
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    nick: '',
    email: '',
    password: '',
    sport: [],
    consents: { tos: false, marketing: false, leadBoost: false },
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const toggleSport = (id) =>
    setData((d) => ({
      ...d,
      sport: d.sport.includes(id) ? d.sport.filter((x) => x !== id) : [...d.sport, id],
    }));

  const onBack = () => {
    setError('');
    if (step === 0) navigate('/');
    else setStep(step - 1);
  };

  const canContinue = () => {
    if (mode === 'login') return data.email && data.password;
    if (step === 0) return data.nick.trim() && data.email.trim() && data.password.length >= 6;
    if (step === 2) return !!data.consents.tos;
    return true;
  };

  const toggleConsent = (key) =>
    setData((d) => ({ ...d, consents: { ...d.consents, [key]: !d.consents[key] } }));

  const onNext = async () => {
    setError('');
    if (mode === 'login') {
      if (!isSupabaseConfigured) {
        setError('Supabase non configurato. Vedi SUPABASE_SETUP.md.');
        return;
      }
      setSubmitting(true);
      try {
        await signIn({ email: data.email, password: data.password });
        navigate('/home');
      } catch (e) {
        setError(e.message || 'Credenziali non valide.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (step === 0 && isSupabaseConfigured) {
      // Verifica subito che il nickname sia libero: meglio scoprirlo qui
      // che con un errore criptico alla fine del wizard.
      setSubmitting(true);
      try {
        const free = await nickAvailable(data.nick.trim());
        if (!free) {
          setError(`Il nickname "${data.nick.trim()}" è già in uso: scegline un altro.`);
          return;
        }
      } finally {
        setSubmitting(false);
      }
    }

    if (step < 3) {
      setStep(step + 1);
      return;
    }
    // step 3: crea davvero l'account
    if (!isSupabaseConfigured) {
      setError('Supabase non configurato. Vedi SUPABASE_SETUP.md per le istruzioni.');
      return;
    }
    setSubmitting(true);
    try {
      await signUp({
        email: data.email,
        password: data.password,
        nick: data.nick.trim(),
        preferences: data.sport,
        consents: data.consents,
      });
      navigate('/home');
    } catch (e) {
      // GoTrue ritorna un 500 generico se il trigger fallisce: traduciamo
      // il caso più comune (nick duplicato in race) in un messaggio utile.
      const msg = String(e?.message || '');
      if (msg.includes('Database error saving new user')) {
        setError('Iscrizione non riuscita: prova con un nickname diverso o riprova tra poco.');
      } else {
        setError(msg || 'Iscrizione fallita.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#0A0F1F',
        color: '#F5F6FA',
        fontFamily: 'Inter',
        width: '100%',
        maxWidth: 520,
        margin: '0 auto',
      }}
    >
      {/* header */}
      <div style={{ padding: '24px 22px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={onBack}
          aria-label="Indietro"
          style={iconBtn}
        >
          <Icon name="chevL" size={18} />
        </button>
        {mode === 'signup' ? (
          <>
            <div style={{ flex: 1, display: 'flex', gap: 6 }}>
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: 4,
                    borderRadius: 2,
                    background: i <= step ? '#FFDD2E' : 'rgba(255,255,255,0.12)',
                    transition: 'background 0.3s',
                  }}
                />
              ))}
            </div>
            <div
              style={{
                fontFamily: 'JetBrains Mono',
                fontSize: 11,
                color: 'rgba(245,246,250,0.5)',
              }}
            >
              {step + 1}/{STEPS.length}
            </div>
          </>
        ) : (
          <div style={{ flex: 1, textAlign: 'right', fontSize: 12, color: 'rgba(245,246,250,0.5)' }}>
            Accesso
          </div>
        )}
      </div>

      <div style={{ flex: 1, padding: '30px 22px' }}>
        {!isSupabaseConfigured && (
          <Banner>
            Database non configurato. L'iscrizione non è ancora persistente:
            segui <code style={{ color: '#FFDD2E' }}>SUPABASE_SETUP.md</code>.
          </Banner>
        )}

        {mode === 'login' && (
          <>
            <Title>
              Bentornato
              <br />
              su Bet4Fun.
            </Title>
            <Subtitle>Accedi con la tua mail.</Subtitle>
            <Field label="Email" icon="mail">
              <input
                value={data.email}
                onChange={(e) => setData({ ...data, email: e.target.value })}
                placeholder="mario@mail.it"
                autoComplete="email"
                style={inputStyle}
              />
            </Field>
            <Field label="Password" icon="lock">
              <input
                type="password"
                value={data.password}
                onChange={(e) => setData({ ...data, password: e.target.value })}
                placeholder="••••••••"
                autoComplete="current-password"
                style={inputStyle}
              />
            </Field>
            <div
              style={{
                marginTop: 18,
                fontSize: 13,
                color: 'rgba(245,246,250,0.6)',
              }}
            >
              Non hai ancora un account?{' '}
              <button
                onClick={() => { setMode('signup'); setStep(0); setError(''); }}
                style={linkBtn}
              >
                Iscriviti
              </button>
            </div>
          </>
        )}

        {mode === 'signup' && step === 0 && (
          <>
            <Title>
              Crea il tuo
              <br />
              account.
            </Title>
            <Subtitle>Ti servono solo 60 secondi.</Subtitle>

            <Field label="Nickname" icon="user">
              <input
                value={data.nick}
                onChange={(e) => setData({ ...data, nick: e.target.value })}
                placeholder="pronostico_99"
                autoComplete="username"
                style={inputStyle}
              />
            </Field>
            <Field label="Email" icon="mail">
              <input
                value={data.email}
                onChange={(e) => setData({ ...data, email: e.target.value })}
                placeholder="mario@mail.it"
                autoComplete="email"
                style={inputStyle}
              />
            </Field>
            <Field label="Password (min 6)" icon="lock">
              <input
                type="password"
                value={data.password}
                onChange={(e) => setData({ ...data, password: e.target.value })}
                placeholder="••••••••"
                autoComplete="new-password"
                style={inputStyle}
              />
            </Field>
            <div
              style={{
                marginTop: 18,
                fontSize: 13,
                color: 'rgba(245,246,250,0.6)',
              }}
            >
              Hai già un account?{' '}
              <button
                onClick={() => { setMode('login'); setError(''); }}
                style={linkBtn}
              >
                Accedi
              </button>
            </div>
          </>
        )}

        {mode === 'signup' && step === 1 && (
          <>
            <Title>
              Quali sport
              <br />
              ti appassionano?
            </Title>
            <Subtitle>Personalizziamo i tuoi concorsi.</Subtitle>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {SPORTS.map((s) => {
                const on = data.sport.includes(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => toggleSport(s.id)}
                    style={{
                      background: on ? 'rgba(255,221,46,0.12)' : 'rgba(26,34,64,0.6)',
                      border: on ? '1.5px solid #FFDD2E' : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 18,
                      padding: '18px 14px',
                      cursor: 'pointer',
                      color: '#F5F6FA',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: 10,
                      transition: 'all 0.2s',
                      fontFamily: 'Inter',
                    }}
                  >
                    <Icon name={s.icon} size={26} color={on ? '#FFDD2E' : '#F5F6FA'} />
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{s.label}</div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'rgba(245,246,250,0.4)',
                        fontFamily: 'JetBrains Mono',
                      }}
                    >
                      {on ? '✓ SELEZIONATO' : 'TOCCA PER AGGIUNGERE'}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {mode === 'signup' && step === 2 && (
          <>
            <Title>
              Consensi
              <br />
              e privacy.
            </Title>
            <Subtitle>
              Solo il primo è obbligatorio. Puoi modificare le scelte dal profilo in qualunque momento.
            </Subtitle>

            <ConsentCheck
              required
              checked={data.consents.tos}
              onToggle={() => toggleConsent('tos')}
              title="Termini di servizio e privacy policy"
              body="Accetto i Termini di servizio e l'informativa Privacy (GDPR). Dichiaro di avere almeno 14 anni."
            />
            <ConsentCheck
              checked={data.consents.marketing}
              onToggle={() => toggleConsent('marketing')}
              title="Email di comunicazione"
              body="Accetto di ricevere comunicazioni sul mio account, nuovi concorsi e novità prodotto. Niente spam, una email ogni tanto."
            />
            <ConsentCheck
              checked={data.consents.leadBoost}
              onToggle={() => toggleConsent('leadBoost')}
              title="Lead Boost (opzionale)"
              body="Autorizzo la condivisione dei dati minimi necessari con i brand delle campagne Lead Boost a cui scelgo di partecipare, in cambio di Funnies bonus. Senza questo consenso non potrai partecipare al Lead Boost — potrai comunque attivarlo dopo dal profilo."
            />
          </>
        )}

        {mode === 'signup' && step === 3 && (
          <div style={{ textAlign: 'center', paddingTop: 20 }}>
            <div
              className="b4f-pop"
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                margin: '0 auto 28px',
                background: 'radial-gradient(circle at 30% 30%, #FFE769, #E6A617)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 20px 50px rgba(255,221,46,0.4)',
                fontFamily: 'Space Grotesk',
                fontWeight: 800,
                fontSize: 64,
                color: '#3D2800',
              }}
            >
              ƒ
            </div>
            <Title>
              Quasi fatto,
              <br />
              {data.nick || 'pronostico_99'}!
            </Title>
            <Subtitle>
              Ti accrediteremo 300 Funnies appena confermi l'iscrizione.
            </Subtitle>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 20px',
                background: 'rgba(255,221,46,0.1)',
                border: '1px solid rgba(255,221,46,0.25)',
                borderRadius: 100,
                fontFamily: 'Space Grotesk',
                fontWeight: 700,
                fontSize: 24,
                marginTop: 14,
              }}
            >
              <Funnie size={22} glow />
              +300 Funnies
            </div>
          </div>
        )}

        {error && (
          <div
            style={{
              marginTop: 18,
              padding: '12px 14px',
              borderRadius: 12,
              background: 'rgba(255,90,106,0.1)',
              border: '1px solid rgba(255,90,106,0.3)',
              color: '#FF8A95',
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}
      </div>

      <div style={{ padding: '0 22px 30px' }}>
        <button
          onClick={onNext}
          disabled={submitting || !canContinue()}
          style={{
            width: '100%',
            background: canContinue() && !submitting ? '#FFDD2E' : 'rgba(255,255,255,0.08)',
            color: canContinue() && !submitting ? '#0A0F1F' : 'rgba(245,246,250,0.4)',
            border: 0,
            borderRadius: 100,
            padding: '18px',
            fontFamily: 'Space Grotesk',
            fontWeight: 700,
            fontSize: 16,
            cursor: canContinue() && !submitting ? 'pointer' : 'not-allowed',
            boxShadow: canContinue() && !submitting ? '0 8px 24px rgba(255,221,46,0.25)' : 'none',
            transition: 'all 0.2s',
          }}
        >
          {submitting
            ? 'Attendi…'
            : mode === 'login'
            ? 'Accedi'
            : step === 0
            ? 'Continua'
            : step === 1
            ? 'Avanti'
            : step === 2
            ? 'Accetta e continua'
            : 'Crea account'}
        </button>
      </div>
    </div>
  );
}

function Title({ children }) {
  return (
    <div
      style={{
        fontFamily: 'Space Grotesk',
        fontWeight: 700,
        fontSize: 32,
        letterSpacing: -1,
        lineHeight: 1.05,
      }}
    >
      {children}
    </div>
  );
}

function Subtitle({ children }) {
  return (
    <div
      style={{
        color: 'rgba(245,246,250,0.6)',
        fontSize: 14,
        marginTop: 10,
        marginBottom: 28,
      }}
    >
      {children}
    </div>
  );
}

function Field({ label, icon, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontSize: 11,
          color: 'rgba(245,246,250,0.5)',
          textTransform: 'uppercase',
          letterSpacing: 1.2,
          marginBottom: 6,
          fontFamily: 'JetBrains Mono',
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'rgba(26,34,64,0.6)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14,
          padding: '14px 16px',
        }}
      >
        <Icon name={icon} size={18} color="rgba(245,246,250,0.5)" />
        {children}
      </div>
    </div>
  );
}

function ConsentCheck({ checked, onToggle, title, body, required }) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: '100%',
        textAlign: 'left',
        display: 'flex',
        gap: 12,
        padding: '14px 16px',
        marginBottom: 12,
        background: checked ? 'rgba(255,221,46,0.08)' : 'rgba(26,34,64,0.6)',
        border: checked ? '1.5px solid #FFDD2E' : '1px solid rgba(255,255,255,0.08)',
        borderRadius: 14,
        color: '#F5F6FA',
        cursor: 'pointer',
        fontFamily: 'Inter',
      }}
    >
      <div
        style={{
          flexShrink: 0,
          width: 22,
          height: 22,
          borderRadius: 6,
          border: checked ? '1.5px solid #FFDD2E' : '1.5px solid rgba(255,255,255,0.25)',
          background: checked ? '#FFDD2E' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 1,
          color: '#0A0F1F',
          fontWeight: 800,
          fontSize: 13,
        }}
      >
        {checked ? '✓' : ''}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
          {title}
          {required && (
            <span
              style={{
                marginLeft: 8,
                fontSize: 10,
                padding: '2px 6px',
                borderRadius: 4,
                background: 'rgba(255,90,106,0.15)',
                color: '#FF8A95',
                fontFamily: 'JetBrains Mono',
                letterSpacing: 0.5,
              }}
            >
              RICHIESTO
            </span>
          )}
        </div>
        <div style={{ fontSize: 12.5, lineHeight: 1.45, color: 'rgba(245,246,250,0.6)' }}>
          {body}
        </div>
      </div>
    </button>
  );
}

function Banner({ children }) {
  return (
    <div
      style={{
        marginBottom: 22,
        padding: '12px 14px',
        borderRadius: 12,
        background: 'rgba(76,125,255,0.08)',
        border: '1px solid rgba(76,125,255,0.25)',
        color: '#C6D6FF',
        fontSize: 13,
        lineHeight: 1.45,
      }}
    >
      {children}
    </div>
  );
}

const inputStyle = {
  flex: 1,
  background: 'transparent',
  border: 0,
  outline: 'none',
  color: '#F5F6FA',
  fontSize: 15,
  fontFamily: 'Inter',
  padding: 0,
};

const iconBtn = {
  background: 'rgba(255,255,255,0.06)',
  border: 0,
  color: '#F5F6FA',
  width: 36,
  height: 36,
  borderRadius: 12,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const linkBtn = {
  background: 'transparent',
  border: 0,
  color: '#FFDD2E',
  cursor: 'pointer',
  padding: 0,
  font: 'inherit',
  textDecoration: 'underline',
};
