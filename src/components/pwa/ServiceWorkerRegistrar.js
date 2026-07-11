'use client';

import { useEffect, useState } from 'react';

export default function ServiceWorkerRegistrar() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Register the service worker
      navigator.serviceWorker
        .register('/sw.js', { scope: '/', updateViaCache: 'none' })
        .then((reg) => {
          console.log('[ServiceWorkerRegistrar] Service Worker registered with scope:', reg.scope);
          setRegistration(reg);

          // Listen for updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // A new service worker is installed and waiting to activate
                  console.log('[ServiceWorkerRegistrar] New update available!');
                  setUpdateAvailable(true);
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('[ServiceWorkerRegistrar] Service Worker registration failed:', error);
        });

      // Handle controller change (when a new service worker takes over)
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  }, []);

  const handleUpdate = () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    setUpdateAvailable(false);
  };

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 animate-in slide-in-from-bottom-2 fade-in duration-300">
      <div className="bg-[var(--tt-surface)] border border-[var(--tt-border)] rounded-[var(--tt-radius-md)] p-4 shadow-lg max-w-sm flex items-center justify-between gap-4">
        <div>
          <h4 className="font-['Syne',sans-serif] font-bold text-[0.95rem] mb-1 text-[var(--tt-text)]">
            Update Available
          </h4>
          <p className="text-[0.8rem] text-[var(--tt-muted)]">
            A new version of TickToss is ready.
          </p>
        </div>
        <button
          onClick={handleUpdate}
          className="tt-btn tt-btn-primary px-4 py-2 whitespace-nowrap text-sm"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
