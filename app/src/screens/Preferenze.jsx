import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Screen from '../components/Screen.jsx';
import Icon from '../components/Icon.jsx';
import { useApp } from '../context/AppContext.jsx';

const SPORTS = [
  { id: 'calcio',     label: 'Calcio',     icon: 'football' },
  { id: 'basket',     label: 'Basket',     icon: 'basket' },
  { id: 'tennis',     label: 'Tennis',     icon: 'tennis' },
  { id: 'f1',         label: 'Formula 1',  icon: 'f1' },
  { id: 'motogp',     label: 'MotoGP',     icon: 'f1' },
  { id: 'ciclismo',   label: 'Ciclismo',   icon: 'bike' },
  { id: 'ufc',        label: 'UFC',        icon: 'trophy' },
  { id: 'nfl',        label: 'NFL',        icon: 'football' },
];

// Preferenze sportive: l'utente sceglie gli sport che gli interessano.
// Salvate in profiles.preferences (array di id).
export default function Preferenze() {
  const navigate = useNavigate();
  const { profile, updatePreferences, isSupabaseConfigured } = useApp();
  const [sel, setSel] = useState([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    setSel(Array.isArray(profile?.preferences) ? profile.preferences : []);
  }, [profile]);

  const toggle = (id) =>
    setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const save = async () => {
    setMsg(null); setErr(null); setBusy(true);
    try {
      await updatePreferences(sel);
      setMsg('Preferenze salvate ✓');
    } catch (e) {
      setErr(e?.message || 'Errore nel salvataggio.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title="Preferenze sportive" subtitle="Scegli gli sport che ti interessano di più." onBack={() => navigate('/profilo')}>
      <div style={{ padding: '0 22px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {SPORTS.map((s) => {
          const on = sel.includes(s.id);
          return (
            <button
              key={s.id}
              onClick={() => toggle(s.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: on ? 'rgba(255,221,46,0.08)' : '#111830',
                border: on ? '1px solid rgba(255,221,46,0.4)' : '1px solid rgba(255,255,255,0.06)',
                borderRadius: 14, padding: 14, cursor: 'pointer', color: '#F5F6FA', fontFamily: 'Inter',
              }}
            >
              <div style={{ width: 34, height: 34, borderRadius: 10, background: on ? '#FFDD2E' : 'rgba(76,125,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={s.icon} size={18} color={on ? '#0A0F1F' : '#4C7DFF'} />
              </div>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{s.label}</span>
              {on && <span style={{ marginLeft: 'auto', color: '#FFDD2E', fontWeight: 700 }}>✓</span>}
            </button>
          );
        })}
      </div>

      <div style={{ padding: '0 22px 30px' }}>
        {!isSupabaseConfigured && (
          <div style={{ color: 'rgba(245,246,250,0.6)', fontSize: 13, marginBottom: 12 }}>
            Disponibile solo con account reale.
          </div>
        )}
        {msg && <div style={{ color: '#3DDC97', fontSize: 13, marginBottom: 10 }}>{msg}</div>}
        {err && <div style={{ color: '#FF5A6A', fontSize: 13, marginBottom: 10 }}>{err}</div>}
        <button
          onClick={save}
          disabled={busy || !isSupabaseConfigured}
          style={{
            width: '100%', background: busy ? 'rgba(255,255,255,0.08)' : '#FFDD2E',
            color: '#0A0F1F', border: 0, borderRadius: 100, padding: 15,
            fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 15,
            cursor: busy ? 'wait' : 'pointer',
          }}
        >
          {busy ? 'Salvo…' : 'Salva preferenze'}
        </button>
      </div>
    </Screen>
  );
}
