import Link from 'next/link';

export const metadata = {
  title: 'Offline | TickToss',
};

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-20 h-20 mb-6 bg-gradient-to-br from-[var(--tt-flame)] to-[var(--tt-gold)] rounded-full flex items-center justify-center shadow-lg animate-pulse">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="32" height="32" 
          viewBox="0 0 24 24" 
          fill="none" stroke="white" strokeWidth="2.5" 
          strokeLinecap="round" strokeLinejoin="round"
        >
          <line x1="1" y1="1" x2="23" y2="23"></line>
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
          <path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path>
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path>
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
          <line x1="12" y1="20" x2="12.01" y2="20"></line>
        </svg>
      </div>
      
      <h1 className="font-['Syne',sans-serif] font-extrabold text-3xl mb-4 text-[var(--tt-text)]">
        You're Offline
      </h1>
      
      <p className="text-[var(--tt-muted)] text-lg mb-8 max-w-md">
        It seems like you've lost your connection. Check your network and try again.
      </p>
      
      <Link 
        href="/"
        className="tt-btn tt-btn-primary px-8 py-3 rounded-full text-base font-semibold"
      >
        Try Again
      </Link>
    </div>
  );
}
