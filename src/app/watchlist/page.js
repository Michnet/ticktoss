'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Bell, Clock, Calendar, Flame, Telescope } from 'lucide-react';
import useAppStore from '@/store/useAppStore';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { resizedImage } from '@/helpers/universal';

// Helper: categorise products by sale_start_date
function groupByDate(products) {
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 7);

  const groups = { today: [], tomorrow: [], thisWeek: [], later: [], ended: [] };

  for (const p of products) {
    if (!p.sale_start_date) { groups.later.push(p); continue; }
    const d = new Date(p.sale_start_date);
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    if (p.sale_end_date && new Date(p.sale_end_date) < now) {
      groups.ended.push(p);
    } else if (day.getTime() === today.getTime()) {
      groups.today.push(p);
    } else if (day.getTime() === tomorrow.getTime()) {
      groups.tomorrow.push(p);
    } else if (day < nextWeek) {
      groups.thisWeek.push(p);
    } else {
      groups.later.push(p);
    }
  }
  return groups;
}

function ProductRow({ product }) {
  const { featured_image, name, slug, sale_start_date, price, sale_price, watchers } = product;
  return (
    <Link
      href={`/products/${slug}`}
      className="flex items-center gap-3 p-3 rounded-[var(--tt-radius-md)] hover:bg-[var(--tt-surface-2)] transition-colors no-underline group"
    >
      <div className="w-14 h-14 rounded-[var(--tt-radius-sm)] overflow-hidden bg-[var(--tt-surface-2)] flex-shrink-0">
        {featured_image ? (
          <img src={resizedImage(featured_image.url, 'thumbnail')} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-[var(--tt-text)] truncate group-hover:text-[var(--tt-flame)] transition-colors">
          {name}
        </p>
        {sale_start_date && (
          <p className="text-xs text-[var(--tt-muted)] mt-0.5">
            {new Date(sale_start_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
        {watchers > 0 && (
          <p className="text-[0.68rem] text-[var(--tt-muted)] mt-0.5">👁 {watchers} watching</p>
        )}
      </div>

      <div className="text-right flex-shrink-0">
        {sale_price && (
          <p className="text-sm font-bold text-[var(--tt-flame)]">
            UGX {sale_price.toLocaleString()}
          </p>
        )}
        {price && (
          <p className={`text-xs ${sale_price ? 'line-through text-[var(--tt-muted)]' : 'text-[var(--tt-text)] font-semibold'}`}>
            UGX {price.toLocaleString()}
          </p>
        )}
      </div>
    </Link>
  );
}

function Section({ icon: Icon, title, accent, products }) {
  if (!products?.length) return null;
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3 px-1">
        <Icon size={16} className={accent} strokeWidth={2} />
        <h3 className={`font-bold text-sm uppercase tracking-wide ${accent}`}>{title}</h3>
        <span className="text-xs text-[var(--tt-muted)] ml-1">({products.length})</span>
      </div>
      <div className="tt-card overflow-hidden p-0">
        {products.map((p) => <ProductRow key={p.id} product={p} />)}
      </div>
    </div>
  );
}

export default function WatchlistPage() {
  const user    = useAppStore((s) => s.user);
  const profile = useAppStore((s) => s.profile);
  const router  = useRouter();

  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    // Redirect guests
    if (user === null) { router.replace('/'); }
  }, [user, router]);

  useEffect(() => {
    if (!profile?.watched_products?.length) {
      setLoading(false);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    supabase
      .from('products')
      .select('id, name, slug, price, sale_price, sale_start_date, sale_end_date, featured_image, watchers')
      .in('id', profile.watched_products)
      .eq('status', 'published')
      .then(({ data }) => {
        setProducts(data || []);
        setLoading(false);
      });
  }, [profile?.watched_products]);

  const groups = groupByDate(products);

  return (
    <div className="tt-container tt-container-padding py-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-full bg-[var(--tt-flame)]/15 flex items-center justify-center">
          <Bell size={20} className="text-[var(--tt-flame)]" strokeWidth={2} />
        </div>
        <div>
          <h1 className="font-extrabold text-xl text-[var(--tt-text)]">My Watchlist</h1>
          <p className="text-sm text-[var(--tt-muted)]">Deals you're waiting for</p>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--tt-flame)] border-t-transparent animate-spin" />
        </div>
      )}

      {!loading && products.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <Bell size={48} className="mx-auto text-[var(--tt-muted)] opacity-30 mb-4" strokeWidth={1.5} />
          <h2 className="font-bold text-[var(--tt-text)] mb-2">Nothing on your watchlist yet</h2>
          <p className="text-sm text-[var(--tt-muted)] mb-6">
            Find products with a future sale date and click the 🔔 icon to watch them.
          </p>
          <Link href="/products" className="tt-btn tt-btn-primary tt-shimmer">
            Browse Products
          </Link>
        </motion.div>
      )}

      {!loading && products.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Section icon={Flame}     title="On Sale Today" accent="text-[var(--tt-flame)]"  products={groups.today}     />
          <Section icon={Clock}     title="Tomorrow"      accent="text-blue-400"            products={groups.tomorrow}  />
          <Section icon={Calendar}  title="This Week"     accent="text-purple-400"          products={groups.thisWeek}  />
          <Section icon={Telescope} title="Coming Later"  accent="text-[var(--tt-muted-2)]" products={groups.later}     />
          {groups.ended.length > 0 && (
            <details className="mt-4">
              <summary className="text-xs text-[var(--tt-muted)] cursor-pointer select-none mb-2">
                {groups.ended.length} ended sale{groups.ended.length !== 1 ? 's' : ''}
              </summary>
              <div className="opacity-50">
                <Section icon={Clock} title="Sale Ended" accent="text-[var(--tt-muted)]" products={groups.ended} />
              </div>
            </details>
          )}
        </motion.div>
      )}
    </div>
  );
}
