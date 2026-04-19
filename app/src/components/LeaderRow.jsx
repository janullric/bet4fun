import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';
import Funnie from './Funnie.jsx';

// Riga di una classifica: posizione, nickname, punti, delta, eventuale saldo Funnies.
// Il nick è cliccabile e porta al profilo pubblico `/u/:handle` (se `handle` è
// passato) — altrimenti fallback sul nick stesso. Utile per dati legacy.
export default function LeaderRow({ n, nick, pts, delta, funnies, me, handle }) {
  const slug = handle || nick;
  const medal = n === 1 ? '#FFDD2E' : n === 2 ? '#C0C0CC' : n === 3 ? '#CD7F32' : null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '12px 14px',
        marginBottom: 6,
        background: me ? 'rgba(255,221,46,0.08)' : '#111830',
        borderRadius: 14,
        border: me ? '1px solid rgba(255,221,46,0.3)' : '1px solid rgba(255,255,255,0.04)',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          background: medal || 'rgba(255,255,255,0.06)',
          color: medal ? '#0A0F1F' : 'rgba(245,246,250,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Space Grotesk',
          fontWeight: 800,
          fontSize: 14,
        }}
      >
        {n}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          <Link
            to={`/u/${encodeURIComponent(slug)}`}
            style={{ color: 'inherit', textDecoration: 'none' }}
            onMouseOver={(e) => (e.currentTarget.style.color = '#FFDD2E')}
            onMouseOut={(e) => (e.currentTarget.style.color = 'inherit')}
          >
            {nick}
          </Link>
          {me && (
            <span style={{ color: '#FFDD2E', fontSize: 11, fontFamily: 'JetBrains Mono' }}>
              {' · TU'}
            </span>
          )}
        </div>
        {funnies !== undefined && (
          <div
            style={{
              fontSize: 11,
              color: 'rgba(245,246,250,0.5)',
              marginTop: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Funnie size={10} /> {funnies.toLocaleString('it-IT')}
          </div>
        )}
      </div>

      <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 15 }}>
        {pts.toLocaleString('it-IT')}
      </div>

      {delta !== undefined && delta !== 0 && (
        <div
          style={{
            fontSize: 11,
            color: delta > 0 ? '#3DDC97' : '#FF5A6A',
            fontFamily: 'JetBrains Mono',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            width: 28,
            justifyContent: 'flex-end',
          }}
        >
          <Icon name={delta > 0 ? 'arrowU' : 'arrowD'} size={10} />
          {Math.abs(delta)}
        </div>
      )}
      {delta === 0 && (
        <div style={{ width: 28, textAlign: 'right', color: 'rgba(245,246,250,0.3)', fontSize: 12 }}>
          —
        </div>
      )}
    </div>
  );
}
