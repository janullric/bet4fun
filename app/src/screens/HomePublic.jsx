import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Wordmark from '../components/Wordmark.jsx';
import Funnie from '../components/Funnie.jsx';
import Icon from '../components/Icon.jsx';
import { useApp } from '../context/AppContext.jsx';

const SPORTS = [
  ['football', 'Calcio'],
  ['basket',   'Basket'],
  ['tennis',   'Tennis'],
  ['f1',       'F1'],
];

export default function HomePublic() {
  const navigate = useNavigate();
  const goSignup = () => navigate('/iscrizione');
  const { publicStats, isSupabaseConfigured } = useApp();

  // Numeri reali dalla RPC public_stats (iscritti + montepremi mese).
  // In modalità demo (senza Supabase) restano i placeholder.
  const [stats, setStats] = useState(null);
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let alive = true;
    publicStats()
      .then((s) => { if (alive) setStats(s); })
      .catch(() => {});
    return () => { alive = false; };
  }, [isSupabaseConfigured, publicStats]);

  const prizeMonth = isSupabaseConfigured
    ? (stats ? Number(stats.prize_month).toLocaleString('it-IT') : '…')
    : '120.000';
  const playersTotal = isSupabaseConfigured
    ? (stats ? Number(stats.players).toLocaleString('it-IT') : '…')
    : '12.847';

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        color: '#F5F6FA',
        fontFamily: 'Inter, system-ui',
        background: 'radial-gradient(120% 60% at 50% 0%, #1A2240 0%, #0A0F1F 55%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* sfondo decorativo */}
      <div
        style={{
          position: 'absolute',
          top: -40,
          right: -80,
          width: 260,
          height: 260,
          borderRadius: '50%',
          opacity: 0.15,
          pointerEvents: 'none',
          background:
            'repeating-linear-gradient(45deg, #FFDD2E 0 10px, transparent 10px 20px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 180,
          left: -60,
          width: 180,
          height: 180,
          borderRadius: '50%',
          opacity: 0.12,
          pointerEvents: 'none',
          background:
            'repeating-linear-gradient(-45deg, #4C7DFF 0 8px, transparent 8px 16px)',
        }}
      />

      {/* topbar */}
      <div
        style={{
          width: '100%',
          maxWidth: 560,
          margin: '0 auto',
          padding: '20px 22px 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Wordmark size={22} />
        <button
          onClick={goSignup}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#F5F6FA',
            padding: '8px 14px',
            borderRadius: 100,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'Inter',
          }}
        >
          Accedi
        </button>
      </div>

      {/* hero */}
      <div
        style={{
          flex: 1,
          width: '100%',
          maxWidth: 560,
          margin: '0 auto',
          padding: '30px 22px 20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            color: '#FFDD2E',
            textTransform: 'uppercase',
            letterSpacing: 2,
            marginBottom: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#FFDD2E',
              boxShadow: '0 0 8px #FFDD2E',
            }}
          />
          Pronostici sportivi — 100% gratis
        </div>
        <div
          style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 700,
            fontSize: 52,
            letterSpacing: -2.2,
            lineHeight: 0.95,
            marginBottom: 18,
          }}
        >
          Gioca.
          <br />
          Pronostica.
          <br />
          <span style={{ color: '#FFDD2E' }}>Vinci veri premi.</span>
        </div>
        <div
          style={{
            color: 'rgba(245,246,250,0.65)',
            fontSize: 15,
            lineHeight: 1.5,
            marginBottom: 30,
            maxWidth: 320,
          }}
        >
          Pronostica i risultati sportivi, accumula Funnies, sfida gli amici
          e riscatta premi reali. Senza mai tirare fuori un euro.
        </div>

        {/* strip montepremi */}
        <div
          style={{
            display: 'flex',
            gap: 10,
            marginBottom: 28,
            padding: '14px 16px',
            background: 'rgba(26,34,64,0.6)',
            borderRadius: 18,
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div style={{ flex: 1 }}>
            <Caption>Montepremi mese</Caption>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <Funnie size={18} />
              <BigNum>{prizeMonth}</BigNum>
            </div>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ flex: 1 }}>
            <Caption>Giocatori iscritti</Caption>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: '#3DDC97',
                  boxShadow: '0 0 6px #3DDC97',
                }}
              />
              <BigNum>{playersTotal}</BigNum>
            </div>
          </div>
        </div>

        <button
          onClick={goSignup}
          style={{
            background: '#FFDD2E',
            color: '#0A0F1F',
            border: 0,
            borderRadius: 100,
            padding: '18px 20px',
            fontFamily: 'Space Grotesk',
            fontWeight: 700,
            fontSize: 17,
            letterSpacing: -0.3,
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(255,221,46,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          Crea account gratis
          <Icon name="chevR" size={18} />
        </button>
        <div
          style={{
            textAlign: 'center',
            marginTop: 12,
            fontSize: 12,
            color: 'rgba(245,246,250,0.4)',
          }}
        >
          300 Funnies di benvenuto · nessuna carta richiesta
        </div>
      </div>

      {/* chips sport */}
      <div
        style={{
          width: '100%',
          maxWidth: 560,
          margin: '0 auto',
          padding: '0 22px 40px',
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {SPORTS.map(([icon, label]) => (
          <div
            key={label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 12px',
              background: 'rgba(255,255,255,0.06)',
              borderRadius: 100,
              fontSize: 12,
              fontWeight: 500,
              color: 'rgba(245,246,250,0.8)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <Icon name={icon} size={14} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

function Caption({ children }) {
  return (
    <div
      style={{
        fontSize: 11,
        color: 'rgba(245,246,250,0.5)',
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontFamily: 'JetBrains Mono',
      }}
    >
      {children}
    </div>
  );
}

function BigNum({ children }) {
  return (
    <span
      style={{
        fontFamily: 'Space Grotesk',
        fontSize: 22,
        fontWeight: 700,
        letterSpacing: -0.5,
      }}
    >
      {children}
    </span>
  );
}
