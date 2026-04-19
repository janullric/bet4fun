// Placeholder decorativo a strisce diagonali, usato al posto delle immagini.
const TONES = {
  yellow: ['#FFDD2E', '#E6C320'],
  blue:   ['#4C7DFF', '#2952D9'],
  dark:   ['#1A2240', '#0A0F1F'],
};

export default function Stripe({ h = 120, label, tone = 'yellow', style = {} }) {
  const [c1, c2] = TONES[tone] || TONES.yellow;
  return (
    <div
      style={{
        height: h,
        borderRadius: 18,
        overflow: 'hidden',
        position: 'relative',
        background: `repeating-linear-gradient(135deg, ${c1} 0 14px, ${c2} 14px 28px)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      {label && (
        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10,
            color: 'rgba(0,0,0,0.6)',
            textTransform: 'uppercase',
            letterSpacing: 1.5,
            background: 'rgba(255,255,255,0.7)',
            padding: '3px 8px',
            borderRadius: 4,
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
}
