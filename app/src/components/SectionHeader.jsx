// Titolo di sezione con eventuale link di azione a destra.
export default function SectionHeader({ title, action, onAction }) {
  return (
    <div
      style={{
        padding: '8px 22px 12px',
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
      }}
    >
      <div
        style={{
          fontFamily: 'Space Grotesk',
          fontWeight: 700,
          fontSize: 18,
          letterSpacing: -0.4,
        }}
      >
        {title}
      </div>
      {action && (
        <button
          onClick={onAction}
          style={{
            background: 'transparent',
            border: 0,
            color: '#4C7DFF',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'Inter',
          }}
        >
          {action} →
        </button>
      )}
    </div>
  );
}
