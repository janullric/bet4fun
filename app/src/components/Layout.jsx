import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import TabBar from './TabBar.jsx';

// Breakpoint desktop / mobile.
const DESKTOP = 900;

// Alcune pagine (landing, iscrizione) sono a pieno schermo senza nav.
function isChromeless(pathname) {
  return pathname === '/' || pathname === '/iscrizione';
}

function useIsDesktop() {
  const [desktop, setDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= DESKTOP : true
  );
  useEffect(() => {
    const onResize = () => setDesktop(window.innerWidth >= DESKTOP);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return desktop;
}

export default function Layout({ children }) {
  const { pathname } = useLocation();
  const isDesktop = useIsDesktop();
  const chromeless = isChromeless(pathname);

  if (chromeless) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </div>
    );
  }

  if (isDesktop) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          minHeight: '100vh',
          background:
            'radial-gradient(60% 40% at 15% 0%, rgba(76,125,255,0.08) 0%, transparent 55%),' +
            '#05070F',
        }}
      >
        <Sidebar />
        <main
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ maxWidth: 1100, width: '100%', margin: '0 auto', padding: '24px 16px 80px' }}>
            {children}
          </div>
        </main>
      </div>
    );
  }

  // Mobile: bottom nav fissa.
  return (
    <div
      style={{
        minHeight: '100vh',
        paddingBottom: 90,
        background: '#0A0F1F',
      }}
    >
      {children}
      <TabBar />
    </div>
  );
}
