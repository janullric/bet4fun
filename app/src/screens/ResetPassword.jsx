import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';

// Mostrata quando l'utente arriva dal link "Password dimenticata?".
// Supabase ha già aperto una sessione di recupero: qui imposta la nuova password.
export default function ResetPassword() {
  const navigate = useNavigate();
  const { updatePassword } = useApp();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const submit = async () => {
    setError('');
    if (pw.length < 6) { setError('La password deve avere almeno 6 caratteri.'); return; }
    if (pw !== pw2) { setError('Le due password non coincidono.'); return; }
    setBusy(true);
    try {
      await updatePassword(pw);
      setDone(true);
      setTimeout(() => navigate('/home'), 1200);
    } catch (e) {
      setError(e?.message || 'Errore nel salvataggio.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0A0F1F',
        color: '#F5F6FA',
        fontFamily: 'Inter',
        maxWidth: 520,
        margin: '0 auto',
        padding: '60px 22px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 30, letterSpacing: -1, lineHeight: 1.1 }}>
        Nuova
        <br />
        password.
      </div>

      {done ? (
        <div style={{ marginTop: 16, color: '#3DDC97', fontSize: 15 }}>
          Password aggiornata ✓ Ti porto dentro…
        </div>
      ) : (
        <>
          <div style={{ marginTop: 10, color: 'rgba(245,246,250,0.6)', fontSize: 14 }}>
            Scegli una nuova password per il tuo account.
          </div>

          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="Nuova password (min 6)"
            autoComplete="new-password"
            style={inputStyle}
          />
          <input
            type="password"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
            placeholder="Ripeti la password"
            autoComplete="new-password"
            style={inputStyle}
          />

          {error && <div style={{ marginTop: 12, color: '#FF5A6A', fontSize: 13 }}>{error}</div>}

          <button
            onClick={submit}
            disabled={busy}
            style={{
              marginTop: 20,
              width: '100%',
              background: busy ? 'rgba(255,255,255,0.08)' : '#FFDD2E',
              color: busy ? 'rgba(245,246,250,0.4)' : '#0A0F1F',
              border: 0,
              borderRadius: 100,
              padding: 16,
              fontFamily: 'Space Grotesk',
              fontWeight: 700,
              fontSize: 16,
              cursor: busy ? 'not-allowed' : 'pointer',
            }}
          >
            {busy ? 'Salvo…' : 'Salva la nuova password'}
          </button>
        </>
      )}
    </div>
  );
}

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  marginTop: 12,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
  padding: '14px 16px',
  color: '#F5F6FA',
  fontFamily: 'Inter',
  fontSize: 15,
  outline: 'none',
};
