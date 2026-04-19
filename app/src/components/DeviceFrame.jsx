import { useEffect, useState } from 'react';
import Wordmark from './Wordmark.jsx';

// Cornice iPhone per desktop. Su schermi stretti (<600px) mostra l'app a tutta pagina
// senza la cornice, come un'app mobile reale.
export default function DeviceFrame({ children }) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 600 : false
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 600);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (isMobile) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: '#0A0F1F',
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        background:
          'radial-gradient(60% 40% at 20% 0%, rgba(76,125,255,0.12) 0%, transparent 60%),' +
          'radial-gradient(50% 35% at 80% 100%, rgba(255,221,46,0.08) 0%, transparent 60%),' +
          '#05070F',
      }}
    >
      <div style={{ display: 'flex', gap: 60, alignItems: 'center' }}>
        {/* etichetta sinistra */}
        <div style={sideLabel('right')}>
          <span>01 · Prototipo mobile</span>
          <Wordmark size={22} />
          <span>Pronostici gratuiti · 2026</span>
        </div>

        {/* cornice iPhone */}
        <div
          style={{
            width: 390,
            height: 844,
            borderRadius: 52,
            overflow: 'hidden',
            position: 'relative',
            background: '#000',
            boxShadow:
              '0 50px 100px rgba(0,0,0,0.55),' +
              '0 0 0 12px #111,' +
              '0 0 0 13px #2a2a2a,' +
              'inset 0 0 0 2px rgba(255,255,255,0.04)',
          }}
        >
          {/* dynamic island */}
          <div
            style={{
              position: 'absolute',
              top: 11,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 120,
              height: 35,
              borderRadius: 20,
              background: '#000',
              zIndex: 100,
            }}
          />
          {/* area interna */}
          <div
            style={{
              width: '100%',
              height: '100%',
              overflow: 'hidden',
              position: 'relative',
              background: '#0A0F1F',
            }}
          >
            {children}
          </div>
          {/* home indicator */}
          <div
            style={{
              position: 'absolute',
              bottom: 8,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 134,
              height: 5,
              borderRadius: 100,
              background: 'rgba(255,255,255,0.4)',
              zIndex: 100,
            }}
          />
        </div>

        {/* etichetta destra */}
        <div style={sideLabel('left')}>
          <span>Navigazione</span>
          <span
            style={{
              fontSize: 14,
              fontFamily: 'Inter',
              fontWeight: 500,
              lineHeight: 1.6,
              color: 'rgba(245,246,250,0.7)',
              textTransform: 'none',
              letterSpacing: 0,
            }}
          >
            Usa la bottom tab e i pulsanti nel flusso — tutto cliccabile: login,
            schedina con calcolo punti, classifiche, premi.
          </span>
          <span style={{ marginTop: 14 }}>Tweaks: tasto in basso a destra</span>
        </div>
      </div>
    </div>
  );
}

function sideLabel(align) {
  return {
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: 11,
    color: 'rgba(245,246,250,0.35)',
    textTransform: 'uppercase',
    letterSpacing: 2,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    maxWidth: 220,
    textAlign: align,
  };
}
