import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

// Assign visual weight relative to max count for the "cloud" effect
function sizeClass(count, maxCount) {
  const ratio = maxCount > 0 ? count / maxCount : 0;
  if (ratio >= 0.8) return 'text-[1rem] font-bold';
  if (ratio >= 0.5) return 'text-[0.9rem] font-semibold';
  if (ratio >= 0.3) return 'text-[0.82rem] font-semibold';
  if (ratio >= 0.15) return 'text-[0.78rem] font-medium';
  return 'text-[0.72rem] font-medium';
}

export default async function TagCloud() {
  const supabase = await createClient();
  const { data: TAGS, error } = await supabase
    .from('product_tags')
    .select('*')
    .order('count', { ascending: false })
    .limit(30);

  if (error || !TAGS || TAGS.length === 0) {
    return null;
  }

  const maxCount = Math.max(...TAGS.map((t) => t.count), 1);

  return (
    <section className="pb-5">
      <div className="tt-container">
        <div className="mb-5">
          <h2 className="font-['Syne',sans-serif] font-extrabold text-[clamp(1.3rem,2.5vw,1.85rem)]">
            Explore by{' '}
            <span className="bg-[image:var(--tt-gradient-flame)] bg-clip-text text-transparent [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]">
              Tag
            </span>
          </h2>
          <p className="text-[var(--tt-muted)] text-[0.875rem] mt-1">
            Popular search tags across all listings
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {TAGS.map((tag, idx) => {
            const sz = sizeClass(tag.count, maxCount);
            const isHot = idx < 3 && tag.count >= maxCount * 0.5 && tag.count > 1; // Top tags get a 🔥
            
            return (
              <Link
                key={tag.slug || tag.id}
                href={`/products?tag_ids=${tag.id}`}
                className={`inline-flex items-center gap-[0.3rem] rounded-full no-underline transition-all duration-[0.18s] hover:-translate-y-[2px] ${isHot ? 'px-[0.7rem] py-[0.3rem] bg-[rgba(255,77,0,0.12)] border border-[rgba(255,77,0,0.3)] text-[var(--tt-flame-2)] hover:bg-[rgba(255,77,0,0.2)] hover:text-white hover:border-[var(--tt-flame)]' : 'px-[0.6rem] py-[0.25rem] bg-[var(--tt-surface-2)] border border-[var(--tt-border)] text-[var(--tt-muted-2)] hover:bg-[var(--tt-surface)] hover:text-[var(--tt-text)] hover:border-[var(--tt-border-2)]'} ${sz}`}
              >
                {isHot && <span className="text-[0.7em]">🔥</span>}
                #{tag.name}
                <span className="text-[0.62rem] text-[var(--tt-muted)] ml-[1px]">
                  {tag.count > 999 ? (tag.count / 1000).toFixed(1) + 'k' : tag.count}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
