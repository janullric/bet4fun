import { useLocation, useNavigate } from 'react-router-dom';
import Icon from './Icon.jsx';

const TABS = [
  { id: 'home',        path: '/home',        label: 'Home',        icon: 'home' },
  { id: 'pronostici',  path: '/pronostici',  label: 'Pronostici',  icon: 'bolt' },
  { id: 'classifiche', path: '/classifiche', label: 'Classifiche', icon: 'trophy' },
  { id: 'premi',       path: '/premi',       label: 'Premi',       icon: 'gift' },
  { id: 'profilo',     path: '/profilo',     label: 'Profilo',     icon: 'user' },
];

export default function TabBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const activeId = TABS.find((t) => pathname.startsWith(t.path))?.id ?? 'home';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        padding: '8px 14px calc(12px + env(safe-area-inset-bottom, 0px))',
        background:
          'linear-gradient(180deg, rgba(10,15,31,0) 0%, rgba(10,15,31,0.9) 40%, rgba(10,15,31,1) 100%)',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          pointerEvents: 'auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: 520,
          margin: '0 auto',
          background: 'rgba(26,34,64,0.92)',
          backdropFilter: 'blur(20px) saturate(160%)',
          WebkitBackdropFilter: 'blur(20px) saturate(160%)',
          borderRadius: 28,
          padding: '10px 8px',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
        }}
      >
        {TABS.map((t) => {
          const active = t.id === activeId;
          return (
            <button
              key={t.id}
              onClick={() => navigate(t.path)}
              style={{
                flex: 1,
                background: 'transparent',
                border: 0,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                padding: '6px 2px',
                color: active ? '#FFDD2E' : 'rgba(245,246,250,0.5)',
                fontFamily: 'Inter',
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: 0.2,
                transition: 'color 0.2s',
              }}
            >
              <Icon name={t.icon} size={22} stroke={active ? 2.2 : 1.8} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
