import { useId } from 'react';

// Moneta "Funnie" — glifo della valuta in-game.
export default function Funnie({ size = 18, glow = false }) {
  const id = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      style={{
        flexShrink: 0,
        filter: glow ? 'drop-shadow(0 0 6px rgba(255,221,46,0.5))' : undefined,
      }}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFE769" />
          <stop offset="1" stopColor="#E6A617" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="15" fill={`url(#${id})`} stroke="#B98600" strokeWidth="1" />
      <circle
        cx="16" cy="16" r="11"
        fill="none" stroke="#B98600" strokeWidth="0.8"
        strokeDasharray="1 2" opacity="0.5"
      />
      <text
        x="16" y="21" textAnchor="middle"
        fontFamily="Space Grotesk, sans-serif" fontWeight="800" fontSize="13" fill="#3D2800"
      >ƒ</text>
    </svg>
  );
}
