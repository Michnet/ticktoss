'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAppStore from '@/store/useAppStore';

const ICONS = {
  success: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  error: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10"/>
      <line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  ),
  info: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  warning: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
};

const TYPE_COLORS = {
  success: 'var(--tt-success)',
  error:   'var(--tt-danger)',
  info:    '#4D9FFF',
  warning: 'var(--tt-gold)',
};

function Toast({ toast }) {
  const { removeToast } = useAppStore();
  const color = TYPE_COLORS[toast.type] ?? TYPE_COLORS.info;

  useEffect(() => {
    const timer = setTimeout(() => removeToast(toast.id), toast.duration ?? 4000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, removeToast]);

  return (
    <motion.div
      layout
      initial={{ x: 120, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 120, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        background: 'var(--tt-surface)',
        border: `1px solid ${color}44`,
        borderLeft: `3px solid ${color}`,
        borderRadius: 'var(--tt-radius-md)',
        padding: '0.75rem 1rem',
        boxShadow: `0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px ${color}22`,
        maxWidth: '360px',
        minWidth: '240px',
      }}
    >
      <span style={{ color, flexShrink: 0, marginTop: '1px' }}>
        {ICONS[toast.type] ?? ICONS.info}
      </span>
      <p style={{ fontSize: '0.875rem', color: 'var(--tt-text)', flex: 1, lineHeight: 1.4 }}>
        {toast.message}
      </p>
      <button
        onClick={() => removeToast(toast.id)}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--tt-muted)',
          cursor: 'pointer',
          flexShrink: 0,
          lineHeight: 1,
          padding: '2px',
          fontSize: '1.1rem',
        }}
      >
        ×
      </button>
    </motion.div>
  );
}

export default function ToastProvider() {
  const { toasts } = useAppStore();

  return (
    <div className="tt-toast-container">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  );
}
