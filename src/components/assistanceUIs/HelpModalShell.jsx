'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function HelpModalShell({ open, onClose, title, subTitle, children }) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(8px)',
            }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="tt-card tt-glass"
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '420px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '1.75rem',
              background: 'var(--tt-surface)',
              borderTop: '4px solid var(--tt-flame)',
            }}
          >
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'none',
                border: 'none',
                color: 'var(--tt-muted)',
                cursor: 'pointer',
                display: 'flex',
              }}
            >
              <X size={20} />
            </button>

            {title && (
              <h3
                className="tt-section-title"
                style={{ fontSize: '1.25rem', marginBottom: subTitle ? '0.25rem' : '1rem', paddingRight: '1.5rem' }}
              >
                {title}
              </h3>
            )}
            {subTitle && (
              <p style={{ color: 'var(--tt-muted-2)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                {subTitle}
              </p>
            )}

            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
