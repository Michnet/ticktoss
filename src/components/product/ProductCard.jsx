'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import CountdownClock from './CountdownClock';
import DiscountBadge from './DiscountBadge';
import UrgencyBar from './UrgencyBar';
import { formatUGX } from '@/lib/currency';
import { getUrgencyLevel } from '@/lib/urgency';
import { resizedImage } from '@/helpers/universal';

/**
 * ProductCard — glassmorphism card with live countdown, discount badge, urgency bar.
 *
 * @param {{ product: object, rank?: number, prevRank?: number, priority?: boolean }} props
 */
export default function ProductCard({ product, rank, prevRank, priority = false }) {
  const {
    id, name, slug,
    price, sale_price,
    sale_end_date,
    featured_image,
    stock, stock_alert_level,
    discount_pct,
    product_categories,
  } = product;

  const level = getUrgencyLevel(sale_end_date);
  const isLowStock = stock !== null && stock <= (stock_alert_level ?? 5) && stock > 0;
  const isOutOfStock = stock !== null && stock <= 0;
  const rankChange = prevRank !== undefined && rank !== undefined ? prevRank - rank : 0;

  const imageUrl = featured_image?.url ?? featured_image?.src ?? null;
  const categoryColor = product_categories?.color ?? 'var(--tt-flame)';
  const categoryName  = product_categories?.name ?? '';

  return (
    <motion.div
      layout
      layoutId={`product-${id}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      style={{ position: 'relative' }}
    >
      <Link href={`/products/${slug}`} style={{ textDecoration: 'none', display: 'block' }}>
        <div
          className="tt-card"
          style={{
            height: '100%',
            cursor: 'pointer',
            boxShadow: level === 'critical'
              ? `0 0 20px rgba(255, 45, 85, 0.18), inset 0 0 0 1px rgba(255, 45, 85, 0.15)`
              : 'none',
          }}
        >
          {/* Image */}
          <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden', background: 'var(--tt-surface-2)' }}>
            {imageUrl ? (
              <img
                src={resizedImage(imageUrl, 'medium')}
                alt={name}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                style={{ objectFit: 'cover', transition: 'transform 0.4s' }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.5rem',
                  background: 'var(--tt-surface-2)',
                }}
              >
                📦
              </div>
            )}

            {/* Countdown overlay (top right) */}
            <div
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: 'rgba(13, 13, 20, 0.85)',
                backdropFilter: 'blur(8px)',
                borderRadius: 'var(--tt-radius-sm)',
                padding: '4px 8px',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <CountdownClock saleEndDate={sale_end_date} size="sm" />
            </div>

            {/* Discount badge (top left) */}
            {discount_pct > 0 && (
              <div style={{ position: 'absolute', top: '8px', left: '8px' }}>
                <DiscountBadge discountPct={discount_pct} saleEndDate={sale_end_date} size="sm" />
              </div>
            )}

            {/* Category pill */}
            {categoryName && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '8px',
                  left: '8px',
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '99px',
                  background: `${categoryColor}33`,
                  color: categoryColor,
                  border: `1px solid ${categoryColor}55`,
                  backdropFilter: 'blur(4px)',
                }}
              >
                {categoryName}
              </div>
            )}

            {/* Rank change indicator */}
            {rankChange !== 0 && (
              <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ delay: 1.5, duration: 0.5 }}
                style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '8px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: rankChange > 0 ? 'var(--tt-success)' : 'var(--tt-danger)',
                  background: 'rgba(13,13,20,0.8)',
                  borderRadius: '99px',
                  padding: '2px 6px',
                }}
              >
                {rankChange > 0 ? `↑${rankChange}` : `↓${Math.abs(rankChange)}`}
              </motion.div>
            )}

            {/* Out of stock overlay */}
            {isOutOfStock && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(13, 13, 20, 0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span
                  style={{
                    background: 'var(--tt-danger)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    padding: '0.4rem 1rem',
                    borderRadius: '99px',
                  }}
                >
                  SOLD OUT
                </span>
              </div>
            )}
          </div>

          {/* Body */}
          <div style={{ padding: '0.875rem' }}>
            {/* Name */}
            <h3
              style={{
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'var(--tt-text)',
                marginBottom: '0.4rem',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: 1.35,
              }}
            >
              {name}
            </h3>

            {/* Prices */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span
                style={{
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 700,
                  fontSize: '1rem',
                  color: level === 'critical' ? 'var(--tt-danger)' : 'var(--tt-text)',
                }}
              >
                {formatUGX(sale_price)}
              </span>
              {price && price > sale_price && (
                <span style={{ fontSize: '0.78rem', color: 'var(--tt-muted)', textDecoration: 'line-through' }}>
                  {formatUGX(price)}
                </span>
              )}
            </div>

            {/* Low stock warning */}
            {isLowStock && !isOutOfStock && (
              <p style={{ fontSize: '0.72rem', color: 'var(--tt-danger)', fontWeight: 600, marginBottom: '0.5rem' }}>
                🔥 Only {stock} left!
              </p>
            )}

            {/* Book Now CTA */}
            <button
              onClick={(e) => e.preventDefault()} // handled by parent Link + product page
              className="tt-btn tt-btn-primary tt-shimmer"
              style={{ width: '100%', marginBottom: '0.6rem', padding: '0.5rem', fontSize: '0.82rem' }}
            >
              Book Now
            </button>

            {/* Urgency bar */}
            <UrgencyBar saleEndDate={sale_end_date} />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
