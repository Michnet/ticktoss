'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--tt-surface)' }} />
    );
  }

  const cycleTheme = () => {
    if (theme === 'system') {
      setTheme('light');
    } else if (theme === 'light') {
      setTheme('dark');
    } else {
      setTheme('system');
    }
  };

  const getIcon = () => {
    if (theme === 'system') return '💻';
    if (theme === 'light') return '☀️';
    return '🌙';
  };

  return (
    <button
      onClick={cycleTheme}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 32,
        height: 32,
        borderRadius: 8,
        background: 'var(--tt-surface)',
        border: '1px solid var(--tt-border)',
        cursor: 'pointer',
        fontSize: '1rem',
        color: 'var(--tt-text)',
        transition: 'all 0.2s ease',
      }}
      title={`Current theme: ${theme}. Click to change.`}
      aria-label="Toggle theme"
    >
      {getIcon()}
    </button>
  );
}
