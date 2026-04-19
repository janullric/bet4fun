// Bet4Fun design tokens — modern evolution of yellow+blue heritage
// Palette: deep midnight navy, electric yellow, cobalt accents
window.B4F = {
  // surfaces (dark, cool-blue tinted)
  bg:      '#0A0F1F',     // deepest
  bg1:     '#111830',     // card
  bg2:     '#1A2240',     // elevated
  bg3:     '#222C4D',     // hover
  stroke:  'rgba(255,255,255,0.08)',
  strokeStrong: 'rgba(255,255,255,0.14)',

  // text
  text:    '#F5F6FA',
  textMuted: 'rgba(245,246,250,0.62)',
  textFaint: 'rgba(245,246,250,0.38)',

  // brand
  yellow:  '#FFDD2E',      // primary CTA — modernized, slightly less saturated
  yellowDim: '#E6C320',
  yellowGlow: 'rgba(255,221,46,0.35)',
  blue:    '#4C7DFF',      // electric cobalt — replaces heritage baby-blue
  blueDeep:'#2952D9',
  blueGlow:'rgba(76,125,255,0.35)',

  // semantic
  win:     '#3DDC97',
  loss:    '#FF5A6A',
  neutral: '#8C94B0',

  // shadows
  shadowLg: '0 20px 60px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.3)',
  shadowMd: '0 8px 24px rgba(0,0,0,0.35)',
  shadowGlow: '0 0 0 4px rgba(76,125,255,0.18), 0 8px 24px rgba(76,125,255,0.25)',

  // type
  display: '"Space Grotesk", system-ui, sans-serif',
  body:    '"Inter", -apple-system, system-ui, sans-serif',
  mono:    '"JetBrains Mono", ui-monospace, monospace',
};

// Funnie icon — original Bet4Fun coin (NOT the old SPORT4FUN mascot).
// A minimal circular token with B4F monogram, gradient, used as currency glyph.
window.Funnie = function Funnie({ size = 18, glow = false }) {
  const id = 'fg' + Math.random().toString(36).slice(2, 8);
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{ flexShrink: 0, filter: glow ? 'drop-shadow(0 0 6px rgba(255,221,46,0.5))' : undefined }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFE769"/>
          <stop offset="1" stopColor="#E6A617"/>
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="15" fill={`url(#${id})`} stroke="#B98600" strokeWidth="1"/>
      <circle cx="16" cy="16" r="11" fill="none" stroke="#B98600" strokeWidth="0.8" strokeDasharray="1 2" opacity="0.5"/>
      <text x="16" y="21" textAnchor="middle"
        fontFamily="Space Grotesk, sans-serif" fontWeight="800" fontSize="13" fill="#3D2800">ƒ</text>
    </svg>
  );
};

// Diagonal stripe placeholder (imagery-free)
window.Stripe = function Stripe({ h = 120, label, tone = 'yellow', style = {} }) {
  const colors = {
    yellow: ['#FFDD2E', '#E6C320'],
    blue: ['#4C7DFF', '#2952D9'],
    dark: ['#1A2240', '#0A0F1F'],
  };
  const [c1, c2] = colors[tone] || colors.yellow;
  return (
    <div style={{
      height: h, borderRadius: 18, overflow: 'hidden', position: 'relative',
      background: `repeating-linear-gradient(135deg, ${c1} 0 14px, ${c2} 14px 28px)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      ...style,
    }}>
      {label && <div style={{
        fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(0,0,0,0.6)',
        textTransform: 'uppercase', letterSpacing: 1.5, background: 'rgba(255,255,255,0.7)',
        padding: '3px 8px', borderRadius: 4,
      }}>{label}</div>}
    </div>
  );
};

// Bet4Fun wordmark
window.Wordmark = function Wordmark({ size = 22, mono = false }) {
  const y = mono ? '#F5F6FA' : '#FFDD2E';
  return (
    <div style={{
      fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: size,
      letterSpacing: -0.5, color: '#F5F6FA', display: 'flex', alignItems: 'center',
      lineHeight: 1,
    }}>
      Bet<span style={{ color: y, fontWeight: 800 }}>4</span>Fun
    </div>
  );
};
