'use client';

import { Bell, Eye, Heart } from 'lucide-react';

/**
 * ProductStats — likes / watchers / views counters, each hidden until it has
 * a nonzero count.
 */
export default function ProductStats({ likes, watchers, views, iconSize = 16, className = '' }) {
  return (
    <div className={`flex items-center gap-3 text-[0.68rem] font-medium text-[var(--tt-muted)] ${className}`}>
      {likes > 0 && <span className="inline-flex items-center gap-2"><Heart size={iconSize} strokeWidth={2.5} />{likes}</span>}
      {watchers > 0 && <span className="inline-flex items-center gap-2"><Bell size={iconSize} strokeWidth={2.5} /> {watchers}</span>}
      {views > 0 && <span className="inline-flex items-center gap-2"><Eye size={iconSize} strokeWidth={2.5} />{views}</span>}
    </div>
  );
}
