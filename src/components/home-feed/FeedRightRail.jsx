import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import WidgetSuggestedVendors from './widgets/WidgetSuggestedVendors';

const SNAPSHOT_STATS = [
  { label: 'Active Deals', value: '12,421', icon: '🏷️' },
  { label: 'Ending This Hour', value: '38', icon: '⏰' },
  { label: 'Vendors Online', value: '284', icon: '🟢' },
  { label: 'Bookings Today', value: '812', icon: '📦' },
  { label: 'Avg. Discount', value: '37%', icon: '💰' },
];

const URGENCY_LEGEND = [
  { label: '80–100+', desc: 'Critical — ending very soon', color: 'var(--tt-danger)' },
  { label: '50–79', desc: 'High urgency — act fast', color: 'var(--tt-flame)' },
  { label: '20–49', desc: 'Medium — still a good deal', color: 'var(--tt-gold)' },
  { label: '< 20', desc: 'Low — plenty of time', color: 'var(--tt-success)' },
];

async function getTrendingTags() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    const { data, error } = await supabase
      .from('product_tags')
      .select('*')
      .order('count', { ascending: false })
      .limit(12);
    if (error) throw error;
    return data ?? [];
  } catch {
    return [];
  }
}

/**
 * Server component — right sidebar of the /home feed shell. Widgets that
 * only need a request-time read (tags, static stats) render directly here;
 * WidgetSuggestedVendors is a client island for its react-query hook.
 */
export default async function FeedRightRail() {
  const tags = await getTrendingTags();

  return (
    <div className="flex flex-col gap-4 pb-8">
      {/* Market snapshot */}
      <div className="bg-[var(--tt-surface)] border border-[var(--tt-border)] rounded-[var(--tt-radius-lg)] p-4">
        <h3 className="font-['Syne',sans-serif] font-extrabold text-[0.9rem] mb-3">📊 Market Snapshot</h3>
        <div className="flex flex-col gap-[0.5rem]">
          {SNAPSHOT_STATS.map(({ label, value, icon }) => (
            <div key={label} className="flex justify-between items-center py-[0.3rem] border-b border-[var(--tt-border)] last:border-0 last:pb-0">
              <span className="text-[0.75rem] text-[var(--tt-muted)] flex items-center gap-[0.4rem]">
                <span>{icon}</span> {label}
              </span>
              <span className="font-['Syne',sans-serif] font-bold text-[0.85rem]">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Suggested vendors (client island) */}
      <WidgetSuggestedVendors />

      {/* Trending tags */}
      {tags.length > 0 && (
        <div className="bg-[var(--tt-surface)] border border-[var(--tt-border)] rounded-[var(--tt-radius-lg)] p-4">
          <h3 className="font-['Syne',sans-serif] font-extrabold text-[0.9rem] mb-3">🔥 Trending Tags</h3>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Link
                key={tag.slug || tag.id}
                href={`/products?tag_ids=${tag.id}`}
                className="text-[0.72rem] font-medium px-[0.55rem] py-[0.25rem] rounded-full bg-[var(--tt-surface-2)] border border-[var(--tt-border)] text-[var(--tt-muted-2)] hover:text-[var(--tt-flame-2)] hover:border-[var(--tt-flame)]/40 transition-colors"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Urgency legend */}
      <div className="bg-[var(--tt-surface)] border border-[var(--tt-border)] rounded-[var(--tt-radius-lg)] p-4">
        <h3 className="font-['Syne',sans-serif] font-extrabold text-[0.9rem] mb-2">🎯 Urgency Score</h3>
        <p className="text-[0.72rem] text-[var(--tt-muted)] leading-[1.5] mb-3">
          Products are ranked live by discount, time left, and stock scarcity.
        </p>
        {URGENCY_LEGEND.map(({ label, desc, color }) => (
          <div key={label} className="flex gap-2 items-start mb-[0.4rem] last:mb-0">
            <span className="inline-block w-[3px] self-stretch rounded-full shrink-0 min-h-[28px]" style={{ background: color }} />
            <div>
              <div className="font-['Syne',sans-serif] font-bold text-[0.75rem]" style={{ color }}>Score {label}</div>
              <div className="text-[0.68rem] text-[var(--tt-muted)]">{desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer-derived legal/help links */}
      <div className="px-1 flex flex-wrap gap-x-3 gap-y-1 text-[0.68rem] text-[var(--tt-muted)]">
        <Link href="/products" className="hover:text-[var(--tt-text)]">All Products</Link>
        <Link href="/apply-vendor" className="hover:text-[var(--tt-text)]">Become a Vendor</Link>
        <Link href="/dashboard" className="hover:text-[var(--tt-text)]">Vendor Dashboard</Link>
        <span>© {new Date().getFullYear()} TickToss</span>
      </div>
    </div>
  );
}
