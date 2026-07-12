/**
 * productLabels.js
 *
 * Derives an ordered array of contextual label objects for a product,
 * suitable for rendering on product cards and single-product pages.
 *
 * Each label has the shape:
 * {
 *   key:      string   — unique identifier (use as React key)
 *   text:     string   — display text, e.g. "28% off"
 *   variant:  string   — 'danger' | 'warning' | 'success' | 'info' | 'neutral'
 *   icon:     string   — emoji / icon string
 *   priority: number   — lower = more prominent (used for ordering/truncating)
 * }
 */

/** Sale ends within this many hours → "Ending today" label. */
const ENDING_TODAY_HOURS = 24;

/** Sale ends within this many hours → "Ending soon" label (but not today). */
const ENDING_SOON_HOURS = 72; // 3 days

/** Sale starts within this many hours → "Dropping today" label. */
const DROPPING_TODAY_HOURS = 24;

/** Star rating threshold to be "Top rated". */
const TOP_RATED_THRESHOLD = 4;

/** Number of reviews needed to earn "Top rated" (guards against 1 review = 5★). */
const TOP_RATED_MIN_REVIEWS = 3;

/** Price ceiling (in UGX) for the "Below 10k" label. */
const BUDGET_PRICE_CEILING = 10_000;

/**
 * Returns hours remaining until a future date, or null if falsy / already past.
 * @param {string|Date|null} date
 * @returns {number|null}
 */
function hoursRemaining(date) {
  if (!date) return null;
  const ms = new Date(date).getTime() - Date.now();
  if (ms <= 0) return null; // expired / past
  return ms / (1000 * 60 * 60);
}

/**
 * Returns hours until a future date, or null if falsy / already started.
 * (Complement of hoursRemaining — used for sale_start_date.)
 * @param {string|Date|null} date
 * @returns {number|null}
 */
function hoursUntil(date) {
  if (!date) return null;
  const ms = new Date(date).getTime() - Date.now();
  if (ms <= 0) return null; // already started / past
  return ms / (1000 * 60 * 60);
}

/**
 * Formats hours into a short human-readable string like "6h" or "2d 3h".
 * @param {number} hours
 * @returns {string}
 */
function formatHours(hours) {
  if (hours < 1) {
    return `${Math.ceil(hours * 60)}m`;
  }
  if (hours < 24) {
    return `${Math.round(hours)}h`;
  }
  const days = Math.floor(hours / 24);
  const rem  = Math.round(hours % 24);
  return rem > 0 ? `${days}d ${rem}h` : `${days}d`;
}

/**
 * Derive contextual labels for a product.
 *
 * @param {object} product - Raw product row from Supabase.
 * @param {object} [opts]
 * @param {number} [opts.maxLabels=4] - Cap on how many labels to return.
 * @returns {Array<{key:string, text:string, variant:string, icon:string, priority:number}>}
 *
 * @example
 * const labels = getProductLabels(product);
 * // [{ key:'low-stock', text:'Only 3 left', variant:'danger', icon:'🔥', priority:1 }, ...]
 */
export function getProductLabels(product, { maxLabels = 4 } = {}) {
  if (!product) return [];

  const {
    sale_price,
    price,
    discount_pct,
    stock,
    stock_alert_level,
    sale_end_date,
    sale_start_date,
    urgency_score,
    rating,
    reviews,
    is_featured,
    is_flash_sale,
    created_at,
    updated_at,
  } = product;

  const labels = [];

  // ─── 1. Out of stock ─────────────────────────────────────────────────────
  if (stock !== null && stock !== undefined && stock <= 0) {
    labels.push({
      key: 'out-of-stock',
      text: 'Sold out',
      variant: 'neutral',
      icon: '🚫',
      priority: 0,
    });
    // No other labels make sense once sold out
    return labels.slice(0, maxLabels);
  }

  // ─── 2. Low stock ────────────────────────────────────────────────────────
  const alertLevel = stock_alert_level ?? 5;
  if (stock !== null && stock !== undefined && stock > 0 && stock <= alertLevel) {
    labels.push({
      key: 'low-stock',
      text: `Only ${stock} left`,
      variant: 'danger',
      icon: '🔥',
      priority: 1,
    });
  }

  // ─── 3a. Future sale — not yet started ──────────────────────────────────
  //  (sale_start_date is in the future, so the deal hasn't kicked off yet)
  const hrsUntilStart = hoursUntil(sale_start_date);
  if (hrsUntilStart !== null) {
    if (hrsUntilStart <= DROPPING_TODAY_HOURS) {
      // Starts within 24 hours
      labels.push({
        key: 'dropping-today',
        text: hrsUntilStart < 1
          ? `Dropping in ${Math.ceil(hrsUntilStart * 60)}m`
          : `Dropping in ${formatHours(hrsUntilStart)}`,
        variant: 'danger',
        icon: '⚡',
        priority: 2,
      });
    } else {
      // Starts more than 24 h away
      labels.push({
        key: 'coming-soon',
        text: hrsUntilStart <= 72
          ? `Coming in ${formatHours(hrsUntilStart)}`
          : 'Coming soon',
        variant: 'info',
        icon: '🔔',
        priority: 2,
      });
    }
  }

  // ─── 3b. Sale end — tiered urgency ───────────────────────────────────────
  const hrs = hoursRemaining(sale_end_date);
  if (hrs !== null) {
    if (hrs <= ENDING_TODAY_HOURS) {
      // Less than 24 h left
      labels.push({
        key: 'ending-today',
        text: hrs < 1
          ? `Ends in ${Math.ceil(hrs * 60)}m`
          : `Ending today · ${formatHours(hrs)} left`,
        variant: hrs <= 1 ? 'danger' : 'warning',
        icon: '🔥',
        priority: hrs <= 1 ? 1 : 2, // bump above low-stock when critical
      });
    } else if (hrs <= ENDING_SOON_HOURS) {
      // 24 h – 3 days left
      labels.push({
        key: 'ending-soon',
        text: `Ending soon · ${formatHours(hrs)} left`,
        variant: 'warning',
        icon: '⏳',
        priority: 2,
      });
    }
  }

  // ─── 4. Flash sale / discount badge ──────────────────────────────────────
  // Prefer the stored discount_pct; fall back to computing it on the fly.
  let pct = discount_pct;
  if (!pct && sale_price > 0 && price > 0 && price > sale_price) {
    pct = Math.round(((price - sale_price) / price) * 100);
  }
  if (pct > 0) {
    labels.push({
      key: 'discount',
      text: `${Math.round(pct)}% off`,
      variant: 'warning',
      icon: '🏷️',
      priority: 3,
    });
  }

  // ─── 5. Budget price ─────────────────────────────────────────────────────
  const displayPrice = sale_price || price;
  if (displayPrice > 0 && displayPrice < BUDGET_PRICE_CEILING) {
    labels.push({
      key: 'budget',
      text: 'Under 10k',
      variant: 'success',
      icon: '💰',
      priority: 4,
    });
  }

  // ─── 6. Top rated ────────────────────────────────────────────────────────
  if (rating >= TOP_RATED_THRESHOLD && (reviews ?? 0) >= TOP_RATED_MIN_REVIEWS) {
    labels.push({
      key: 'top-rated',
      text: `Top rated ${rating}★`,
      variant: 'info',
      icon: '⭐',
      priority: 5,
    });
  }

  // ─── 7. High urgency score ───────────────────────────────────────────────
  if (urgency_score >= 50 && !labels.find(l => l.key === 'ending-soon')) {
    labels.push({
      key: 'high-demand',
      text: 'High demand',
      variant: 'warning',
      icon: '📈',
      priority: 6,
    });
  }

  // ─── 8. Featured ─────────────────────────────────────────────────────────
  if (is_featured) {
    labels.push({
      key: 'featured',
      text: 'Featured',
      variant: 'info',
      icon: '✨',
      priority: 7,
    });
  }

  // ─── 9. Flash sale banner ─────────────────────────────────────────────────
  if (is_flash_sale && !labels.find(l => l.key === 'discount')) {
    labels.push({
      key: 'flash-sale',
      text: 'Flash sale',
      variant: 'danger',
      icon: '⚡',
      priority: 3,
    });
  }

  // ─── 10. New arrival ─────────────────────────────────────────────────────
  const itemDate  = new Date(updated_at || created_at);
  const msPerDay  = 1000 * 60 * 60 * 24;
  const ageDays   = (Date.now() - itemDate.getTime()) / msPerDay;
  if (ageDays <= 14) {
    labels.push({
      key: 'new',
      text: 'New arrival',
      variant: 'success',
      icon: '🆕',
      priority: 8,
    });
  }

  // Sort by priority ascending and cap
  return labels
    .sort((a, b) => a.priority - b.priority)
    .slice(0, maxLabels);
}

/**
 * Returns the single most prominent label for compact display contexts
 * (e.g. a single badge on a thumbnail).
 *
 * @param {object} product
 * @returns {{ key:string, text:string, variant:string, icon:string, priority:number } | null}
 */
export function getPrimaryLabel(product) {
  const labels = getProductLabels(product, { maxLabels: 1 });
  return labels[0] ?? null;
}
