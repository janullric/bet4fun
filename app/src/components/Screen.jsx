import Icon from './Icon.jsx';
import NotificationsBell from './NotificationsBell.jsx';

// Layout base di una schermata: header con titolo e area contenuti.
// Il container esterno non ha più altezza fissa: sul web lascia scorrere la pagina.
// La campanella notifiche è SEMPRE presente nell'header (su ogni pagina);
// `headerRight` aggiunge eventuali pulsanti extra accanto ad essa.
export default function Screen({
  title,
  subtitle,
  children,
  headerRight,
  onBack,
  hero,
  hideBell = false,
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        color: '#F5F6FA',
        fontFamily: 'Inter, system-ui',
      }}
    >
      {title && (
        <div
          style={{
            padding: '6px 22px 18px',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            {onBack && (
              <button
                onClick={onBack}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: 0,
                  color: '#F5F6FA',
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 10,
                }}
              >
                <Icon name="chevL" size={18} />
              </button>
            )}
            <div
              style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontWeight: 700,
                fontSize: 32,
                letterSpacing: -0.8,
                lineHeight: 1.05,
              }}
            >
              {title}
            </div>
            {subtitle && (
              <div style={{ marginTop: 6, color: 'rgba(245,246,250,0.6)', fontSize: 14 }}>
                {subtitle}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {headerRight}
            {!hideBell && <NotificationsBell />}
          </div>
        </div>
      )}
      {hero}
      <div>{children}</div>
    </div>
  );
}
