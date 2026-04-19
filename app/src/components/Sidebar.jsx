import { useLocation, useNavigate } from 'react-router-dom';
import Wordmark from './Wordmark.jsx';
import Icon from './Icon.jsx';
import Funnie from './Funnie.jsx';
import { useApp } from '../context/AppContext.jsx';

const NAV = [
  { path: '/home',        label: 'Home',        icon: 'home' },
  { path: '/pronostici',  label: 'Pronostici',  icon: 'bolt' },
  { path: '/classifiche', label: 'Classifiche', icon: 'trophy' },
  { path: '/gruppi',      label: 'Gruppi',      icon: 'users' },
  { path: '/boost',       label: 'Lead Boost',  icon: 'sparkle' },
  { path: '/premi',       label: 'Premi',       icon: 'gift' },
  { path: '/profilo',     label: 'Profilo',     icon: 'user' },
];

export default function Sidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { funnies, user } = useApp();

  return (
    <aside
      style={{
        width: 260,
        flexShrink: 0,
        height: '100vh',
        position: 'sticky',
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        padding: '26px 18px 20px',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(10,15,31,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div style={{ padding: '0 10px 26px' }}>
        <Wordmark size={24} />
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {NAV.map((n) => {
          const active = pathname.startsWith(n.path);
          return (
            <button
              key={n.path}
              onClick={() => navigate(n.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '11px 14px',
                borderRadius: 12,
                border: 0,
                cursor: 'pointer',
                background: active ? 'rgba(255,221,46,0.1)' : 'transparent',
                color: active ? '#FFDD2E' : 'rgba(245,246,250,0.7)',
                fontFamily: 'Inter',
                fontSize: 14,
                fontWeight: 500,
                textAlign: 'left',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              <Icon name={n.icon} size={20} stroke={active ? 2.2 : 1.8} />
              {n.label}
            </button>
          );
        })}
      </nav>

      <div style={{ flex: 1 }} />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 14px',
          marginBottom: 10,
          background: 'rgba(255,221,46,0.08)',
          border: '1px solid rgba(255,221,46,0.18)',
          borderRadius: 14,
        }}
      >
        <Funnie size={18} />
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 10,
              color: 'rgba(245,246,250,0.5)',
              fontFamily: 'JetBrains Mono',
              textTransform: 'uppercase',
              letterSpacing: 0.8,
            }}
          >
            Saldo
          </div>
          <div
            style={{
              fontFamily: 'Space Grotesk',
              fontWeight: 700,
              fontSize: 16,
              color: '#FFDD2E',
              letterSpacing: -0.3,
              lineHeight: 1.1,
            }}
          >
            {funnies.toLocaleString('it-IT')}
          </div>
        </div>
      </div>

      <button
        onClick={() => navigate('/profilo')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: 10,
          border: 0,
          background: 'transparent',
          cursor: 'pointer',
          borderRadius: 12,
          color: '#F5F6FA',
          textAlign: 'left',
          fontFamily: 'Inter',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #FFDD2E 0%, #E6A617 100%)',
            color: '#1A0F00',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Space Grotesk',
            fontWeight: 800,
            fontSize: 15,
          }}
        >
          {(user?.nick?.[0] || '?').toUpperCase()}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.nick || 'Utente'}</div>
          <div
            style={{
              fontSize: 11,
              color: 'rgba(245,246,250,0.5)',
              fontFamily: 'JetBrains Mono',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {user?.handle ? `@${user.handle}` : (user?.email || '')}
          </div>
        </div>
      </button>
    </aside>
  );
}
