import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Screen from '../components/Screen.jsx';
import SectionHeader from '../components/SectionHeader.jsx';
import { useApp } from '../context/AppContext.jsx';

// Privacy e sicurezza: cambio password e visualizzazione email dell'account.
export default function Sicurezza() {
  const navigate = useNavigate();
  const { user, updatePassword, isSupabaseConfigured } = useApp();

  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  const changePassword = async () => {
    setMsg(null); setErr(null);
    if (pw.length < 6) { setErr('La password deve avere almeno 6 caratteri.'); return; }
    if (pw !== pw2) { setErr('Le due password non coincidono.'); return; }
    setBusy(true);
    try {
      await updatePassword(pw);
      setMsg('Password aggiornata ✓');
      setPw(''); setPw2('');
    } catch (e) {
      setErr(e?.message || 'Errore nel salvataggio.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title="Privacy e sicurezza" subtitle="Gestisci accesso e dati dell'account." onBack={() => navigate('/profilo')}>
      <SectionHeader title="Account" />
      <div style={{ padding: '0 22px 20px' }}>
        <Row label="Email" value={user?.email || '—'} />
        <div style={{ fontSize: 12, color: 'rgba(245,246,250,0.5)', marginTop: 6, lineHeight: 1.5 }}>
          L'email serve per accedere e recuperare la password. Per cambiarla scrivi al gestore del gruppo.
        </div>
      </div>

      <SectionHeader title="Cambia password" />
      <div style={{ padding: '0 22px 30px' }}>
        {!isSupabaseConfigured ? (
          <div style={{ color: 'rgba(245,246,250,0.6)', fontSize: 13 }}>
            Disponibile solo con account reale.
          </div>
        ) : (
          <>
            <input
              type="password" value={pw} onChange={(e) => setPw(e.target.value)}
              placeholder="Nuova password (min 6)" autoComplete="new-password" style={input}
            />
            <input
              type="password" value={pw2} onChange={(e) => setPw2(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') changePassword(); }}
              placeholder="Ripeti la password" autoComplete="new-password" style={input}
            />
            {msg && <div style={{ color: '#3DDC97', fontSize: 13, marginTop: 10 }}>{msg}</div>}
            {err && <div style={{ color: '#FF5A6A', fontSize: 13, marginTop: 10 }}>{err}</div>}
            <button
              onClick={changePassword}
              disabled={busy || !pw || !pw2}
              style={{
                marginTop: 16, width: '100%',
                background: busy || !pw || !pw2 ? 'rgba(255,255,255,0.08)' : '#FFDD2E',
                color: busy || !pw || !pw2 ? 'rgba(245,246,250,0.4)' : '#0A0F1F',
                border: 0, borderRadius: 100, padding: 15,
                fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 15,
                cursor: busy || !pw || !pw2 ? 'not-allowed' : 'pointer',
              }}
            >
              {busy ? 'Salvo…' : 'Aggiorna password'}
            </button>
          </>
        )}
      </div>
    </Screen>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111830', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 14, padding: '14px 16px' }}>
      <span style={{ fontSize: 12, color: 'rgba(245,246,250,0.55)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  );
}

const input = {
  width: '100%', boxSizing: 'border-box', marginTop: 10,
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12, padding: '13px 15px', color: '#F5F6FA',
  fontFamily: 'Inter', fontSize: 15, outline: 'none',
};
