/**
 * Urgency score helpers for TickToss.
 * 
 * Formula:
 *   urgency_score = (discount_pct × 0.5) + (30 / max(hours_remaining, 0.01)) + (20 / max(stock, 1))
 * 
 * Higher score → more urgent → floats to top of listings.
 */

/**
 * Compute urgency score client-side.
 * @param {{ saleEndDate: string|Date, discountPct: number, stock: number }} params
 * @returns {number}
 */
export function computeUrgencyScore({ saleEndDate, discountPct = 0, stock = 1 }) {
  const now = Date.now();
  const endMs = saleEndDate instanceof Date ? saleEndDate.getTime() : new Date(saleEndDate).getTime();
  const msRemaining = Math.max(endMs - now, 0);
  const hoursRemaining = msRemaining / (1000 * 60 * 60);

  const discountFactor  = (discountPct || 0) * 0.5;
  const timeFactor      = 30 / Math.max(hoursRemaining, 0.01);
  const stockFactor     = 20 / Math.max(stock || 1, 1);

  return discountFactor + timeFactor + stockFactor;
}

/**
 * Compute discount percentage from price and sale price.
 * @param {{ price: number, salePrice: number }} params
 * @returns {number}
 */
export function computeDiscountPct({ price, salePrice }) {
  const orig = Number(price) || 0;
  const sale = Number(salePrice) || 0;
  if (orig <= 0) return 0;
  return ((orig - sale) / orig) * 100;
}

/**
 * Single source of truth for deriving a product's discount_pct and
 * urgency_score from its current price/stock/sale window. Used for both
 * single and bulk product creation, vendor edits, and stock-driven
 * recomputation (e.g. after an order decrements stock) so the two columns
 * never drift out of sync with the fields that feed them.
 * @param {{ price: number, sale_price: number, stock: number, sale_end_date: string|Date|null }} params
 * @returns {{ discount_pct: number, urgency_score: number }}
 */
export function deriveProductUrgency({ price, sale_price, stock, sale_end_date }) {
  const discount_pct = computeDiscountPct({ price, salePrice: sale_price });
  const urgency_score = computeUrgencyScore({
    saleEndDate: sale_end_date || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    discountPct: discount_pct,
    stock,
  });
  return { discount_pct, urgency_score };
}

/**
 * Return urgency level label based on hours remaining.
 * @param {string|Date} saleEndDate
 * @returns {'low'|'medium'|'high'|'critical'|'expired'}
 */
export function getUrgencyLevel(saleEndDate) {
  const now = Date.now();
  const endMs = new Date(saleEndDate).getTime();
  const hoursRemaining = (endMs - now) / (1000 * 60 * 60);

  if (hoursRemaining <= 0)  return 'expired';
  if (hoursRemaining <= 1)  return 'critical';
  if (hoursRemaining <= 6)  return 'high';
  if (hoursRemaining <= 24) return 'medium';
  return 'low';
}

/**
 * Parse ms remaining into { days, hours, minutes, seconds, cs, expired }
 * @param {string|Date} saleEndDate
 * @returns {{ days: number, hours: number, minutes: number, seconds: number, cs: number, expired: boolean }}
 */
export function parseTimeRemaining(saleEndDate) {
  const now = Date.now();
  const endMs = new Date(saleEndDate).getTime();
  const diff = endMs - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, cs: 0, expired: true };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days    = Math.floor(totalSeconds / 86400);
  const hours   = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  // centiseconds (0-99) — readable but fast enough to feel live
  const cs      = Math.floor((diff % 1000) / 10);

  return { days, hours, minutes, seconds, cs, expired: false };
}

/**
 * Sort products by urgency score descending.
 * @param {Array} products
 * @returns {Array}
 */
export function sortByUrgency(products) {
  return [...products].sort((a, b) => {
    const scoreA = computeUrgencyScore({
      saleEndDate: a.sale_end_date,
      discountPct: a.discount_pct,
      stock: a.stock,
    });
    const scoreB = computeUrgencyScore({
      saleEndDate: b.sale_end_date,
      discountPct: b.discount_pct,
      stock: b.stock,
    });
    return scoreB - scoreA;
  });
}
