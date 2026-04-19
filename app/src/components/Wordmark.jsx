// Logo testuale "Bet4Fun".
export default function Wordmark({ size = 22, mono = false }) {
  const accent = mono ? '#F5F6FA' : '#FFDD2E';
  return (
    <div
      style={{
        fontFamily: 'Space Grotesk, sans-serif',
        fontWeight: 700,
        fontSize: size,
        letterSpacing: -0.5,
        color: '#F5F6FA',
        display: 'flex',
        alignItems: 'center',
        lineHeight: 1,
      }}
    >
      Bet<span style={{ color: accent, fontWeight: 800 }}>4</span>Fun
    </div>
  );
}
