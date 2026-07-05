/**
 * Currency utilities for TickToss.
 * Default currency: UGX (Uganda Shillings).
 * Geo-based conversion is fetched on-demand from fawazahmed0 currency API.
 */

const DEFAULT_CURRENCY = 'UGX';

/**
 * Format a number as UGX currency string.
 * @param {number} amount
 * @returns {string}  e.g. "UGX 45,000"
 */
export function formatUGX(amount) {
  if (amount == null || isNaN(amount)) return '—';
  return `UGX ${Number(amount).toLocaleString('en-UG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

/**
 * Format a discount percentage.
 * @param {number} pct
 * @returns {string}  e.g. "35% OFF"
 */
export function formatDiscountPct(pct) {
  if (!pct) return '';
  return `${Math.round(pct)}% OFF`;
}

/**
 * Compute discount percentage given original and sale price.
 * @param {number} price
 * @param {number} salePrice
 * @returns {number}
 */
export function computeDiscountPct(price, salePrice) {
  if (!price || !salePrice || salePrice >= price) return 0;
  return ((price - salePrice) / price) * 100;
}

/**
 * Fetch current exchange rate from UGX to the visitor's local currency.
 * Uses the free fawazahmed0 currency API (no API key needed).
 * @param {string} targetCurrency  ISO 4217 code, e.g. 'USD', 'KES', 'EUR'
 * @returns {Promise<number|null>}  Rate: 1 UGX = X targetCurrency
 */
export async function fetchExchangeRate(targetCurrency) {
  if (!targetCurrency || targetCurrency.toUpperCase() === DEFAULT_CURRENCY) return 1;

  try {
    const currency = targetCurrency.toLowerCase();
    const date = 'latest';
    const url = `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${date}/v1/currencies/ugx.json`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error('Rate fetch failed');
    const data = await res.json();
    return data.ugx?.[currency] ?? null;
  } catch {
    return null;
  }
}

/**
 * Detect the visitor's likely currency from browser locale.
 * Falls back to 'USD'.
 * @returns {string}
 */
export function detectVisitorCurrency() {
  if (typeof navigator === 'undefined') return 'USD';
  try {
    const locale = navigator.language || 'en-US';
    const currency = new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' })
      .resolvedOptions().currency;
    return currency || 'USD';
  } catch {
    return 'USD';
  }
}

/**
 * Format an amount in a foreign currency.
 * @param {number} amountUGX
 * @param {number} rate        Exchange rate from fetchExchangeRate()
 * @param {string} currency    Target currency code
 * @returns {string}
 */
export function formatForeignCurrency(amountUGX, rate, currency) {
  if (!rate || !currency) return '';
  const converted = amountUGX * rate;
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(converted);
  } catch {
    return `${currency} ${converted.toFixed(2)}`;
  }
}
