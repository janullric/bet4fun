import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Screen from '../components/Screen.jsx';
import { useApp } from '../context/AppContext.jsx';

// Impostazioni notifiche. Le notifiche in-app (campanella) sono sempre attive;
// qui l'utente gestisce il consenso alle comunicazioni dei brand partner.
export default function NotificheSettings() {
  const navigate = useNavigate();
  const { profile, setConsent, refreshProfile, isSupabaseConfigured } = useApp();
  const [busy, setBusy] = useState(false);

  const marketing = !!profile?.marketing_consent;

  const toggleMarketing = async () => {
    if (!isSupabaseConfigured) return;
    setBusy(true);
    try {
      await setConsent({ scope: 'marketing', granted: !marketing, version: 'profile-v1' });
      await refreshProfile();
    } catch { /* noop */ } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title="Notifiche" subtitle="Gestisci come ti avvisiamo." onBack={() => navigate('/profilo')}>
      <div style={{ padding: '0 22px 24px' }}>
        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>🔔 Notifiche in-app</div>
          <div style={{ fontSize: 13, color: 'rgba(245,246,250,0.65)', lineHeight: 1.5 }}>
            La campanella in alto è sempre attiva: ti avvisa per richieste di amicizia,
            messaggi privati e schedine ancora aperte. È visibile in ogni pagina.
          </div>
        </Card>

        <div style={{ height: 12 }} />

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>📣 Comunicazioni dei partner</div>
              <div style={{ fontSize: 13, color: 'rgba(245,246,250,0.65)', lineHeight: 1.5 }}>
                Ricevi offerte e novità dai brand partner (Lead Boost). Puoi revocare quando vuoi.
              </div>
            </div>
            <button
              onClick={toggleMarketing}
              disabled={busy || !isSupabaseConfigured}
              aria-label="Attiva/disattiva"
              style={{
                width: 50, height: 30, borderRadius: 100, border: 0, flexShrink: 0,
                background: marketing ? '#3DDC97' : 'rgba(255,255,255,0.15)',
                position: 'relative', cursor: busy ? 'wait' : 'pointer', transition: 'background 0.2s',
              }}
            >
              <span style={{
                position: 'absolute', top: 3, left: marketing ? 23 : 3, width: 24, height: 24,
                borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
              }} />
            </button>
          </div>
        </Card>
      </div>
    </Screen>
  );
}

function Card({ children }) {
  return (
    <div style={{ background: '#111830', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 16, padding: 16, color: '#F5F6FA', fontFamily: 'Inter' }}>
      {children}
    </div>
  );
}
