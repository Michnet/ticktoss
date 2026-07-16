import { createClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';

/**
 * Formats a UGX number: 1_400_000 → "UGX 1.4M", 250_000 → "UGX 250K"
 */
function fmtUGX(n) {
  if (n >= 1_000_000) return `UGX ${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `UGX ${Math.round(n / 1_000)}K`;
  return `UGX ${n.toLocaleString()}`;
}

/**
 * Fetches all data needed to build live ticker messages.
 * Falls back gracefully — if any query fails the rest still work.
 * Returns: string[]
 */
async function _getTickerItems() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const [
    vendorCountRes,
    topDiscountRes,
    flashSaleRes,
    hotLocationRes,
    ordersRes,
    lowStockRes,
    avgDiscountRes,
  ] = await Promise.allSettled([
    // 1. Vendor (tt_vendor) count
    supabase
      .from('profiles')
      .select('user_id', { count: 'exact', head: true })
      .contains('roles', ['tt_vendor']),

    // 2. Top-discounted published product
    supabase
      .from('products')
      .select('name, discount_pct, sale_price')
      .eq('status', 'published')
      .not('discount_pct', 'is', null)
      .order('discount_pct', { ascending: false })
      .limit(1)
      .single(),

    // 3. Active flash-sale count
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published')
      .eq('is_flash_sale', true)
      .gt('sale_end_date', new Date().toISOString()),

    // 4. Busiest location (most published products) — join name from locations
    supabase
      .from('products')
      .select('location, locations(name)')
      .eq('status', 'published')
      .not('location', 'is', null)
      .limit(500), // aggregate client-side; no GROUP BY in JS SDK

    // 5. Orders placed today
    supabase
      .from('product_orders')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),

    // 6. Low-stock but still published products (stock ≤ 10)
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published')
      .not('stock', 'is', null)
      .lte('stock', 10),

    // 7. Average discount across all published products
    supabase
      .from('products')
      .select('discount_pct')
      .eq('status', 'published')
      .not('discount_pct', 'is', null)
      .limit(500),
  ]);

  const items = [];

  // ── Vendor count ────────────────────────────────────────────────────────────
  const vendorCount =
    vendorCountRes.status === 'fulfilled' && vendorCountRes.value.count != null
      ? vendorCountRes.value.count
      : null;
  if (vendorCount !== null && vendorCount > 0) {
    items.push(`🏪 ${vendorCount.toLocaleString()} verified stores on TickToss — Uganda's #1 Discount Marketplace`);
  } else {
    items.push(`🇺🇬 TickToss — Uganda's #1 Discount Marketplace`);
  }

  // ── Top discount ─────────────────────────────────────────────────────────────
  const topDiscount =
    topDiscountRes.status === 'fulfilled' && topDiscountRes.value.data
      ? topDiscountRes.value.data
      : null;
  if (topDiscount) {
    const pct = Math.round(topDiscount.discount_pct);
    const shortName =
      topDiscount.name.length > 40 ? topDiscount.name.slice(0, 37) + '…' : topDiscount.name;
    items.push(`⚡ Top deal today: ${shortName} — ${pct}% off`);
    if (topDiscount.sale_price) {
      items.push(`💰 Save up to ${fmtUGX(topDiscount.sale_price * (pct / 100))} on ${shortName}`);
    }
  } else {
    items.push(`🏷️ Clearance: up to 80% off electronics`);
  }

  // ── Flash sale count ──────────────────────────────────────────────────────────
  const flashCount =
    flashSaleRes.status === 'fulfilled' && flashSaleRes.value.count != null
      ? flashSaleRes.value.count
      : null;
  if (flashCount !== null && flashCount > 0) {
    items.push(`🔥 ${flashCount} active flash sales — limited time only!`);
  }

  // ── Busiest location ──────────────────────────────────────────────────────────
  const locationRows =
    hotLocationRes.status === 'fulfilled' && Array.isArray(hotLocationRes.value.data)
      ? hotLocationRes.value.data
      : [];
  if (locationRows.length > 0) {
    // Count occurrences per location name
    const tally = {};
    for (const row of locationRows) {
      const name = row.locations?.name;
      if (name) tally[name] = (tally[name] || 0) + 1;
    }
    const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1]);
    if (sorted.length >= 3) {
      const top3 = sorted.slice(0, 3).map(([n]) => n).join(', ');
      items.push(`📍 Hottest deal spots: ${top3}`);
    } else if (sorted.length > 0) {
      items.push(`📍 Deals available in ${sorted[0][0]} & more locations`);
    }
  } else {
    items.push(`📍 Deals in Kampala, Jinja, Wakiso & more`);
  }

  // ── Orders today ──────────────────────────────────────────────────────────────
  const todayOrders =
    ordersRes.status === 'fulfilled' && ordersRes.value.count != null
      ? ordersRes.value.count
      : null;
  if (todayOrders !== null && todayOrders > 0) {
    items.push(`🛒 ${todayOrders.toLocaleString()} bookings made today — join the wave!`);
  } else {
    items.push(`📦 Cash on delivery — no online payment needed`);
  }

  // ── Low-stock urgency ─────────────────────────────────────────────────────────
  const lowStock =
    lowStockRes.status === 'fulfilled' && lowStockRes.value.count != null
      ? lowStockRes.value.count
      : null;
  if (lowStock !== null && lowStock > 0) {
    items.push(`⚠️ ${lowStock} products nearly sold out — grab yours now!`);
  }

  // ── Avg discount ─────────────────────────────────────────────────────────────
  const discountRows =
    avgDiscountRes.status === 'fulfilled' && Array.isArray(avgDiscountRes.value.data)
      ? avgDiscountRes.value.data
      : [];
  if (discountRows.length > 0) {
    const avg = Math.round(
      discountRows.reduce((sum, r) => sum + (r.discount_pct || 0), 0) / discountRows.length
    );
    if (avg > 0) {
      items.push(`💸 Average discount across the platform: ${avg}% — deals don't get better than this`);
    }
  }

  // ── Static evergreen messages ────────────────────────────────────────────────
  items.push(`⏰ Every deal has a countdown — book before time runs out`);
  items.push(`📦 Cash on delivery — shop confidently, pay on arrival`);

  return items;
}

/**
 * Cached version — computed once at build time and revalidated every hour via ISR.
 * Math.random() shuffle intentionally removed: non-deterministic output opts Next.js
 * out of static generation.
 */
export const getTickerItems = unstable_cache(
  _getTickerItems,
  ['ticker-items'],
  { revalidate: 3600, tags: ['ticker'] }
);
