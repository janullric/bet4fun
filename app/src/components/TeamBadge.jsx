import { teamStyle } from '../lib/teamColors.js';

// Badge squadra: banda diagonale con i due colori sociali + sigla.
// Fallback: colore hash + iniziali del nome.
export default function TeamBadge({ name, size = 42 }) {
  const { primary, secondary, code } = teamStyle(name);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size / 3.5),
        background: `linear-gradient(135deg, ${primary} 0%, ${primary} 50%, ${secondary} 50%, ${secondary} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.12), 0 2px 8px rgba(0,0,0,0.25)',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          background: 'rgba(255,255,255,0.95)',
          color: '#0A0F1F',
          padding: `${Math.round(size / 14)}px ${Math.round(size / 10)}px`,
          borderRadius: Math.round(size / 10),
          fontFamily: 'Space Grotesk, sans-serif',
          fontWeight: 800,
          fontSize: Math.max(10, Math.round(size / 3.5)),
          letterSpacing: 0.3,
          lineHeight: 1,
        }}
      >
        {code}
      </span>
    </div>
  );
}
