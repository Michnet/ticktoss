'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const TRICKLE_INTERVAL_MS = 200;
const MAX_AUTO_PROGRESS = 90;
const DONE_HOLD_MS = 200;
const SAFETY_TIMEOUT_MS = 8000;

/**
 * App Router has no router.events, so "navigation started" is inferred from
 * the same signals Next's own router reacts to: an internal <a> click, or a
 * history.pushState/replaceState call (covers router.push/replace and
 * popstate). "Navigation finished" is inferred from usePathname/
 * useSearchParams changing, since Next keeps those in sync with the URL.
 */
function RouteProgressBarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  const runningRef = useRef(false);
  const trickleRef = useRef(null);
  const safetyRef = useRef(null);
  const hideRef = useRef(null);
  const currentUrlRef = useRef(`${pathname}?${searchParams.toString()}`);
  const finishRef = useRef(() => {});

  useEffect(() => {
    const clearTimers = () => {
      clearInterval(trickleRef.current);
      clearTimeout(safetyRef.current);
      clearTimeout(hideRef.current);
    };

    const finish = () => {
      if (!runningRef.current) return;
      runningRef.current = false;
      clearTimers();
      setProgress(100);
      hideRef.current = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, DONE_HOLD_MS);
    };
    finishRef.current = finish;

    const start = () => {
      if (runningRef.current) return;
      runningRef.current = true;
      clearTimers();
      setVisible(true);
      setProgress(8);
      trickleRef.current = setInterval(() => {
        setProgress((p) => (p >= MAX_AUTO_PROGRESS ? p : p + (MAX_AUTO_PROGRESS - p) * 0.2));
      }, TRICKLE_INTERVAL_MS);
      safetyRef.current = setTimeout(finish, SAFETY_TIMEOUT_MS);
    };

    function resolveInternalNavUrl(target) {
      const anchor = target.closest?.('a[href]');
      if (!anchor) return null;
      if (anchor.target && anchor.target !== '_self') return null;
      if (anchor.hasAttribute('download')) return null;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || /^(mailto|tel):/.test(href)) return null;
      let url;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return null;
      }
      if (url.origin !== window.location.origin) return null;
      if (url.pathname + url.search === window.location.pathname + window.location.search) return null;
      return url;
    }

    function onClick(e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (resolveInternalNavUrl(e.target)) start();
    }

    document.addEventListener('click', onClick, true);
    window.addEventListener('popstate', start);

    // Next's router calls history.pushState/replaceState synchronously from
    // inside a useInsertionEffect; scheduling state updates there directly
    // trips React's "useInsertionEffect must not schedule updates" guard, so
    // defer start() to the next tick.
    const deferredStart = () => setTimeout(start, 0);

    const originalPush = window.history.pushState;
    const originalReplace = window.history.replaceState;
    window.history.pushState = function patchedPushState(...args) {
      deferredStart();
      return originalPush.apply(this, args);
    };
    window.history.replaceState = function patchedReplaceState(...args) {
      deferredStart();
      return originalReplace.apply(this, args);
    };

    return () => {
      clearTimers();
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('popstate', start);
      window.history.pushState = originalPush;
      window.history.replaceState = originalReplace;
    };
  }, []);

  useEffect(() => {
    const url = `${pathname}?${searchParams.toString()}`;
    if (url === currentUrlRef.current) return;
    currentUrlRef.current = url;
    finishRef.current();
  }, [pathname, searchParams]);

  if (!visible) return null;

  return (
    <div
      aria-hidden
      style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '3px', zIndex: 10000, pointerEvents: 'none' }}
    >
      <div
        style={{
          height: '100%',
          width: `${progress}%`,
          background: 'linear-gradient(90deg, var(--tt-flame), var(--tt-gold))',
          boxShadow: '0 0 8px var(--tt-flame)',
          opacity: progress === 100 ? 0 : 1,
          transition: progress === 100 ? 'width 150ms ease, opacity 200ms ease 150ms' : 'width 200ms ease',
        }}
      />
    </div>
  );
}

export default function RouteProgressBar() {
  return (
    <Suspense fallback={null}>
      <RouteProgressBarInner />
    </Suspense>
  );
}
