'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Search } from 'lucide-react';

const QUICK_FILTERS = [
  { label: '⏰ Ending Soon', href: '/products?clusters=ending-soon' },
  { label: '⚡ Flash Sales', href: '/products?clusters=flash-sale' },
  { label: '🆕 New In', href: '/products?sort=new' },
  { label: '💸 Under 10k', href: '/products?clusters=below-10k' },
  { label: '⭐ Featured', href: '/products?filter=featured' },
];

export default function FeedComposerBar() {
  const router = useRouter();
  const [q, setQ] = useState('');

  const submit = (e) => {
    e.preventDefault();
    router.push(q.trim() ? `/products?search=${encodeURIComponent(q.trim())}` : '/products');
  };

  return (
    <div className="bg-[var(--tt-theme)] border border-[var(--tt-border)] rounded-[var(--tt-radius-lg)] p-3.5">
      <form onSubmit={submit} className="flex items-center gap-2">
        <span className="w-9 h-9 rounded-full flex items-center justify-center text-[1.1rem] shrink-0" style={{ background: 'var(--tt-gradient-flame)' }}>
          🔥
        </span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="What deal are you hunting today?"
          className="tt-input flex-1 !py-[0.55rem]"
        />
        <button type="submit" className="tt-btn tt-btn-primary p-[0.6rem]" aria-label="Search">
          <Search size={16} />
        </button>
      </form>
      <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
        {QUICK_FILTERS.map((f) => (
          <a
            key={f.href}
            href={f.href}
            className="shrink-0 text-[0.75rem] font-semibold px-3 py-[0.4rem] rounded-full bg-[var(--tt-surface-2)] border border-[var(--tt-border)] text-[var(--tt-muted-2)] hover:text-[var(--tt-flame-2)] hover:border-[var(--tt-flame)]/40 transition-colors"
          >
            {f.label}
          </a>
        ))}
      </div>
    </div>
  );
}
