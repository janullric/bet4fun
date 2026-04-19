// App shell: status bar + bottom tab bar, screen routing with transitions
const { useState, useEffect, useRef, createContext, useContext } = React;

window.AppCtx = React.createContext(null);

// Small glyph set — flat, geometric, consistent stroke
window.Icon = function Icon({ name, size = 22, color = 'currentColor', stroke = 2 }) {
  const p = { fill: 'none', stroke: color, strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    home:    <><path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1z" {...p}/></>,
    grid:    <><rect x="3" y="3" width="7" height="7" rx="1.5" {...p}/><rect x="14" y="3" width="7" height="7" rx="1.5" {...p}/><rect x="3" y="14" width="7" height="7" rx="1.5" {...p}/><rect x="14" y="14" width="7" height="7" rx="1.5" {...p}/></>,
    chart:   <><path d="M4 20V8M10 20V4M16 20v-7M22 20H2" {...p}/></>,
    gift:    <><path d="M20 12v9H4v-9M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" {...p}/></>,
    user:    <><circle cx="12" cy="8" r="4" {...p}/><path d="M3 21c0-5 4-8 9-8s9 3 9 8" {...p}/></>,
    bolt:    <><path d="M13 2L4 14h7l-1 8 9-12h-7z" {...p}/></>,
    trophy:  <><path d="M7 4h10v5a5 5 0 01-10 0V4zM5 6H3a2 2 0 002 4M19 6h2a2 2 0 01-2 4M9 14h6M8 21h8M12 14v7" {...p}/></>,
    users:   <><circle cx="9" cy="8" r="3.5" {...p}/><path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6" {...p}/><circle cx="17" cy="6" r="2.5" {...p}/><path d="M22 17c0-2.5-2-4.5-5-4.5" {...p}/></>,
    bell:    <><path d="M6 16V10a6 6 0 0112 0v6l2 3H4zM9 19a3 3 0 006 0" {...p}/></>,
    search:  <><circle cx="11" cy="11" r="7" {...p}/><path d="M20 20l-4-4" {...p}/></>,
    plus:    <><path d="M12 5v14M5 12h14" {...p}/></>,
    check:   <><path d="M4 12l5 5L20 6" {...p}/></>,
    x:       <><path d="M6 6l12 12M18 6L6 18" {...p}/></>,
    chevR:   <><path d="M9 6l6 6-6 6" {...p}/></>,
    chevL:   <><path d="M15 6l-6 6 6 6" {...p}/></>,
    chevD:   <><path d="M6 9l6 6 6-6" {...p}/></>,
    arrowU:  <><path d="M12 19V5M5 12l7-7 7 7" {...p}/></>,
    arrowD:  <><path d="M12 5v14M5 12l7 7 7-7" {...p}/></>,
    flame:   <><path d="M12 2s5 4 5 10a5 5 0 01-10 0c0-2 1-3 2-4 0 2 1 3 2 3-1-3 1-6 1-9zM9 17a3 3 0 006 0c0-2-1.5-3-3-3s-3 1-3 3z" {...p}/></>,
    lock:    <><rect x="4" y="11" width="16" height="10" rx="2" {...p}/><path d="M8 11V7a4 4 0 018 0v4" {...p}/></>,
    mail:    <><rect x="3" y="5" width="18" height="14" rx="2" {...p}/><path d="M3 7l9 6 9-6" {...p}/></>,
    eye:     <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" {...p}/><circle cx="12" cy="12" r="3" {...p}/></>,
    filter:  <><path d="M3 5h18l-7 8v6l-4 2v-8z" {...p}/></>,
    football:<><circle cx="12" cy="12" r="9" {...p}/><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3" {...p}/></>,
    basket:  <><circle cx="12" cy="12" r="9" {...p}/><path d="M3 12h18M12 3v18M5.6 5.6c3 3 3 9.8 0 12.8M18.4 5.6c-3 3-3 9.8 0 12.8" {...p}/></>,
    tennis:  <><circle cx="12" cy="12" r="9" {...p}/><path d="M3.5 9C8 10 16 10 20.5 9M3.5 15C8 14 16 14 20.5 15" {...p}/></>,
    f1:      <><path d="M3 16h18M6 16v-3l3-1 2-3h7l2 3v4M8 16a2 2 0 104 0 2 2 0 00-4 0zM14 16a2 2 0 104 0 2 2 0 00-4 0z" {...p}/></>,
    calendar:<><rect x="3" y="5" width="18" height="16" rx="2" {...p}/><path d="M3 10h18M8 3v4M16 3v4" {...p}/></>,
    sparkle: <><path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2zM20 16l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" {...p}/></>,
    settings:<><circle cx="12" cy="12" r="3" {...p}/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" {...p}/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>{paths[name] || null}</svg>;
};

window.StatusBar = function StatusBar({ dark = true }) {
  const c = dark ? '#fff' : '#000';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '18px 28px 8px', position: 'relative', zIndex: 20,
      fontFamily: 'system-ui',
    }}>
      <span style={{ fontWeight: 600, fontSize: 15, color: c }}>9:41</span>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <svg width="16" height="11" viewBox="0 0 16 11"><path d="M1 10h1M4 8h1M7 5h1M10 2h2M13 1h1" stroke={c} strokeWidth="1.5" strokeLinecap="round"/><rect x="0" y="9" width="2" height="2" rx="0.5" fill={c}/><rect x="3" y="7" width="2" height="4" rx="0.5" fill={c}/><rect x="6" y="4" width="2" height="7" rx="0.5" fill={c}/><rect x="9" y="1" width="2" height="10" rx="0.5" fill={c}/><rect x="12" y="0" width="2" height="11" rx="0.5" fill={c}/></svg>
        <svg width="22" height="11" viewBox="0 0 22 11"><rect x="0.5" y="0.5" width="18" height="10" rx="2.5" fill="none" stroke={c} opacity="0.4"/><rect x="2" y="2" width="15" height="7" rx="1.5" fill={c}/><path d="M20 3v5c0.8-0.3 1.5-1 1.5-2.5S20.8 3.3 20 3z" fill={c} opacity="0.4"/></svg>
      </div>
    </div>
  );
};

// Bottom tab bar
window.TabBar = function TabBar({ tab, go }) {
  const tabs = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'pronostici', label: 'Pronostici', icon: 'bolt' },
    { id: 'classifiche', label: 'Classifiche', icon: 'trophy' },
    { id: 'premi', label: 'Premi', icon: 'gift' },
    { id: 'profilo', label: 'Profilo', icon: 'user' },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 40,
      padding: '8px 14px 26px',
      background: 'linear-gradient(180deg, rgba(10,15,31,0) 0%, rgba(10,15,31,0.85) 40%, rgba(10,15,31,1) 100%)',
      pointerEvents: 'none',
    }}>
      <div style={{
        pointerEvents: 'auto',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'rgba(26,34,64,0.92)',
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        borderRadius: 28, padding: '10px 8px',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
      }}>
        {tabs.map(t => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => go(t.id)} style={{
              flex: 1, background: 'transparent', border: 0, cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              padding: '6px 2px', color: active ? '#FFDD2E' : 'rgba(245,246,250,0.5)',
              fontFamily: 'Inter', fontSize: 10, fontWeight: 600, letterSpacing: 0.2,
              transition: 'color 0.2s',
            }}>
              <Icon name={t.icon} size={22} stroke={active ? 2.2 : 1.8} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Screen shell with header
window.Screen = function Screen({ title, subtitle, children, scroll = true, headerRight, onBack, hero }) {
  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      color: '#F5F6FA', fontFamily: 'Inter, system-ui',
    }}>
      <StatusBar />
      {title && (
        <div style={{ padding: '6px 22px 14px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {onBack && (
              <button onClick={onBack} style={{
                background: 'rgba(255,255,255,0.06)', border: 0, color: '#F5F6FA',
                width: 36, height: 36, borderRadius: 12, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 10,
              }}>
                <Icon name="chevL" size={18} />
              </button>
            )}
            <div style={{
              fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 30,
              letterSpacing: -0.8, lineHeight: 1.05,
            }}>{title}</div>
            {subtitle && <div style={{ marginTop: 6, color: 'rgba(245,246,250,0.6)', fontSize: 14 }}>{subtitle}</div>}
          </div>
          {headerRight}
        </div>
      )}
      {hero}
      <div style={{
        flex: 1, overflowY: scroll ? 'auto' : 'hidden',
        paddingBottom: 110, scrollbarWidth: 'none',
      }}>
        {children}
      </div>
    </div>
  );
};
