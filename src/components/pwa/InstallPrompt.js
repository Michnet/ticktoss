'use client';

import { useEffect, useState } from 'react';
import { Download, Share, PlusSquare, X } from 'lucide-react';

export default function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already installed (standalone mode)
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    setIsStandalone(isStandaloneMode);

    if (isStandaloneMode) return;

    // Re-checked at show-time (not just once here) so a dismissal during this
    // session also blocks late/repeat 'beforeinstallprompt' fires and the iOS timer.
    const isDismissed = () => {
      const dismissedAt = localStorage.getItem('tt_pwa_dismissed');
      if (!dismissedAt) return false;
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      return Date.now() - parseInt(dismissedAt, 10) < thirtyDays;
    };

    if (isDismissed()) return;

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Chrome/Android beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault(); // Prevent default mini-infobar
      if (isDismissed()) return;
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If iOS, show prompt after a short delay (since there's no event)
    let timer;
    if (isIOSDevice) {
      timer = setTimeout(() => {
        if (!isDismissed()) setShowPrompt(true);
      }, 3000); // Wait 3 seconds before showing iOS prompt
    }

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[InstallPrompt] User ${outcome} the A2HS prompt`);
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('tt_pwa_dismissed', Date.now().toString());
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 animate-in slide-in-from-bottom-full duration-500 flex justify-center pointer-events-none">
      <div className="bg-[var(--tt-surface)] border border-[var(--tt-border)] rounded-[var(--tt-radius-lg)] p-4 shadow-xl max-w-lg w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pointer-events-auto relative">
        
        <button 
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-2 text-[var(--tt-muted)] hover:text-[var(--tt-text)] transition-colors rounded-full"
          aria-label="Dismiss install prompt"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 pr-6 sm:pr-0">
          <div className="w-12 h-12 bg-gradient-to-br from-[var(--tt-flame)] to-[var(--tt-gold)] rounded-[var(--tt-radius-md)] flex items-center justify-center shrink-0 shadow-md">
             <span className="font-['Syne',sans-serif] font-bold text-white text-lg tracking-tighter leading-none">TT</span>
          </div>
          <div>
            <h4 className="font-['Syne',sans-serif] font-bold text-[1.05rem] mb-1 text-[var(--tt-text)] leading-tight">
              Install TickToss
            </h4>
            <p className="text-[0.85rem] text-[var(--tt-muted)] leading-tight">
              Get the app for faster browsing and instant deal notifications.
            </p>
          </div>
        </div>
        
        <div className="w-full sm:w-auto flex-shrink-0 mt-2 sm:mt-0">
          {!isIOS ? (
            <button
              onClick={handleInstall}
              className="tt-btn tt-btn-primary w-full sm:w-auto px-6 py-2.5 whitespace-nowrap tt-shimmer text-sm flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Install App</span>
            </button>
          ) : (
             <div className="text-[0.8rem] text-[var(--tt-muted)] bg-[var(--tt-surface-2)] p-2.5 rounded-[var(--tt-radius-md)] flex items-center gap-2 mt-2 sm:mt-0 border border-[var(--tt-border-2)] w-full">
               <span className="flex items-center gap-1 shrink-0">Tap <Share className="w-4 h-4 text-[var(--tt-text)]" /></span>
               <span className="shrink-0">then</span>
               <span className="flex items-center gap-1 font-medium text-[var(--tt-text)] truncate"><PlusSquare className="w-4 h-4 shrink-0" /> <span className="truncate">Add to Home Screen</span></span>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
