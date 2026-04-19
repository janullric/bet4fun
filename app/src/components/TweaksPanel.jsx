import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DESTS = [
  { label: 'Landing',     path: '/' },
  { label: 'Iscrizione',  path: '/iscrizione' },
  { label: 'Dashboard',   path: '/home' },
  { label: 'Pronostici',  path: '/pronostici' },
  { label: 'Classifiche', path: '/classifiche' },
  { label: 'Premi',       path: '/premi' },
  { label: 'Profilo',     path: '/profilo' },
];

// Pannello di sviluppo: bottone ✦ in basso a destra che apre una tendina
// con i link a tutte le schermate. Utile per demo e QA.
export default function TweaksPanel() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <button
        aria-label="Apri pannello tweaks"
        onClick={() => setOpen((v) => !v)}
        style={{
          position: 'fixed',
          right: 20,
          bottom: 20,
          zIndex: 1001,
          width: 48,
          height: 48,
          borderRadius: 24,
          border: 0,
          cursor: 'pointer',
          background: '#FFDD2E',
          color: '#0A0F1F',
          fontSize: 20,
          boxShadow: '0 10px 30px rgba(255,221,46,0.3)',
        }}
      >
        ✦
      </button>

      {open && (
        <div
          style={{
            position: 'fixed',
            right: 20,
            bottom: 80,
            width: 280,
            background: 'rgba(17,24,48,0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 20,
            padding: 16,
            color: '#F5F6FA',
            fontFamily: 'Inter',
            fontSize: 12,
            zIndex: 1000,
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}
        >
          <div
            style={{
              fontFamily: 'Space Grotesk',
              fontWeight: 700,
              fontSize: 14,
              marginBottom: 12,
              letterSpacing: -0.3,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            Tweaks
            <button
              aria-label="Chiudi"
              onClick={() => setOpen(false)}
              style={{
                background: 'none',
                border: 0,
                color: 'rgba(245,246,250,0.5)',
                fontSize: 18,
                cursor: 'pointer',
              }}
            >
              ×
            </button>
          </div>

          <div
            style={{
              fontSize: 10,
              color: 'rgba(245,246,250,0.5)',
              fontFamily: 'JetBrains Mono',
              textTransform: 'uppercase',
              letterSpacing: 1.2,
              marginBottom: 8,
            }}
          >
            Vai a schermata
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            {DESTS.map((d) => (
              <button
                key={d.path}
                onClick={() => {
                  navigate(d.path);
                  setOpen(false);
                }}
                style={{
                  padding: '6px 10px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#F5F6FA',
                  borderRadius: 100,
                  fontSize: 11,
                  cursor: 'pointer',
                  fontFamily: 'Inter',
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
