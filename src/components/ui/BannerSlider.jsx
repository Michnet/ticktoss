'use client';

import './banner.css';
import { useState, useEffect, useCallback, useRef } from 'react';
import BannerSlideIcon from './BannerSlideIcon';
import BannerSlide from './BannerSlide';

/**
 * BannerSlider — Universal auto-fading banner carousel
 *
 * @param {Object[]} items        - Array of banner data objects (see BannerSlide / BannerSlideIcon for shape)
 * @param {'image'|'icon'|'auto'} variant - Which slide renderer to use.
 *   'auto' picks icon slide when item.icon is present, image slide otherwise.
 * @param {number}  interval      - Auto-advance interval in ms (default 5000)
 * @param {boolean} autoPlay      - Enable auto-advance (default true)
 * @param {boolean} showDots      - Show dot indicators (default true)
 * @param {boolean} showArrows    - Show prev/next arrows (default true)
 * @param {string}  className     - Extra classes on the section wrapper
 * @param {string}  slideHeight   - CSS height applied to each slide (default '340px')
 */
export default function BannerSlider({
  items = [],
  variant = 'auto',
  interval = 5000,
  autoPlay = true,
  showDots = true,
  showArrows = true,
  className = '',
  slideHeight = '340px',
}) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [direction, setDirection] = useState('next'); // 'next' | 'prev'
  const timerRef = useRef(null);

  const count = items.length;

  const goTo = useCallback(
    (idx) => {
      if (idx === active) return;
      setDirection(idx > active ? 'next' : 'prev');
      setActive(idx);
    },
    [active]
  );

  const next = useCallback(() => {
    setDirection('next');
    setActive((a) => (a + 1) % count);
  }, [count]);

  const prev = useCallback(() => {
    setDirection('prev');
    setActive((a) => (a - 1 + count) % count);
  }, [count]);

  useEffect(() => {
    if (!autoPlay || paused || count <= 1) return;
    timerRef.current = setInterval(next, interval);
    return () => clearInterval(timerRef.current);
  }, [autoPlay, paused, count, interval, next]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev]);

  if (!count) return null;

  const resolveVariant = (item) => {
    if (variant === 'icon') return 'icon';
    if (variant === 'image') return 'image';
    return item.icon ? 'icon' : 'image';
  };

  return (
    <section
      className={`banner-slider-root ${className}`}
      aria-label="Promotional banners"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slide stack */}
      <div
        className="banner-slider-track"
        style={{ height: slideHeight }}
      >
        {items.map((item, i) => {
          const v = resolveVariant(item);
          const isActive = i === active;
          const SlideComp = v === 'icon' ? BannerSlideIcon : BannerSlide;

          return (
            <div
              key={item.id ?? i}
              className={`banner-slide-wrapper ${isActive ? 'bs-active' : 'bs-inactive'}`}
              aria-hidden={!isActive}
            >
              <SlideComp item={item} />
            </div>
          );
        })}

        {/* ── Arrow buttons ── */}
        {showArrows && count > 1 && (
          <>
            <button
              className="bs-arrow bs-arrow-left"
              onClick={prev}
              aria-label="Previous banner"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <button
              className="bs-arrow bs-arrow-right"
              onClick={next}
              aria-label="Next banner"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* ── Dot indicators ── */}
      {showDots && count > 1 && (
        <div className="bs-dots" role="tablist" aria-label="Slide indicators">
          {items.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === active}
              aria-label={`Slide ${i + 1}`}
              className={`bs-dot ${i === active ? 'bs-dot-active' : ''}`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
