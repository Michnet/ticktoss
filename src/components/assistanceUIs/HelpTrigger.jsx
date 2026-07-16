'use client';

export default function HelpTrigger({ text, onClick, className, style }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={className}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        color: 'var(--tt-flame)',
        fontSize: '0.85rem',
        fontWeight: 600,
        textDecoration: 'underline',
        textUnderlineOffset: '2px',
        cursor: 'pointer',
        fontFamily: 'inherit',
        ...style,
      }}
    >
      {text}
    </button>
  );
}
