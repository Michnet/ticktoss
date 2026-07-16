'use client';

import Link from 'next/link';
//import Image from 'next/image';

/**
 * BannerSlide — Image-based promotional banner slide.
 *
 * item shape:
 * {
 *   id:          string,
 *   title:       string,           // large headline
 *   subtitle?:   string,           // smaller label/eyebrow above title
 *   description: string,           // body copy below title
 *   cta?:        { label: string, href: string },
 *   cta2?:       { label: string, href: string }, // secondary CTA
 *   image?:      string,           // URL of transparent PNG or any image
 *   imageSide?:  'left'|'right',   // which side the image appears (default 'right')
 *   accent:      string,           // CSS color used for color-coded elements
 *   accentLight: string,           // lighter tint of accent (e.g. rgba)
 *   badge?:      string,           // optional floating badge text (e.g. '🔥 HOT DEAL')
 *   bgFrom?:     string,           // gradient start color (default derived from accent)
 *   bgTo?:       string,           // gradient end color
 *   textColor?:  string,           // override text color
 * }
 */
export default function BannerSlide({ item }) {
  const {
    title = '',
    subtitle = '',
    description = '',
    cta,
    cta2,
    image,
    imageSide = 'right',
    accent = '#FF4D00',
    accentLight = 'rgba(255,77,0,0.15)',
    badge,
    bgFrom,
    bgTo,
    textColor = '#fff',
  } = item;

  const gradFrom = bgFrom ?? accent;
  const gradTo   = bgTo   ?? 'rgba(0,0,0,0.85)';

  // Gradient always pushes from the image side so text stays readable
  const gradientDir = imageSide === 'right' ? 'to right' : 'to left';

  return (
    <article
      className="bs-image-slide"
      style={{
        background: `linear-gradient(135deg, ${gradTo} 0%, ${gradFrom}55 100%)`,
        color: textColor,
      }}
    >
      {/* Decorative noise/grain overlay */}
      <div className="bs-grain" />

      {/* Decorative accent circle */}
      <div
        className="bs-accent-circle"
        style={{ background: `radial-gradient(circle, ${accent}40 0%, transparent 70%)` }}
      />

      {/* Content */}
      <div className={`bs-content-wrap !pt-[var(--tt-nav-height)] ${imageSide === 'left' ? 'bs-content-reverse' : ''}`}>
        {/* Text block */}
        <div className="bs-text-block">
          {/* Badge */}
          {/* {badge && (
            <span
              className="bs-badge"
              style={{
                background: accentLight,
                borderColor: `${accent}50`,
                color: accent,
              }}
            >
              {badge}
            </span>
          )} */}

          {/* Eyebrow / subtitle */}
          {subtitle && (
            <p
              className="bs-subtitle"
              style={{ color: `${accent}` }}
            >
              {subtitle}
            </p>
          )}

          {/* Title */}
          <h2
            className="bs-title"
            style={{
              '--accent': accent,
            }}
          >
            {title}
          </h2>

          {/* Description */}
          {description && (
            <p className="bs-description">
              {description}
            </p>
          )}

          {/* Color-coded accent bar */}
          <div
            className="bs-accent-bar"
            style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
          />

          {/* CTAs */}
          <div className="bs-cta-row">
            {cta && (
              <Link
                href={cta.href}
                className="bs-cta-primary tt-btn"
                style={{
                  background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                  boxShadow: `0 4px 20px ${accent}55`,
                }}
              >
                {cta.label}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </Link>
            )}
            {cta2 && (
              <Link
                href={cta2.href}
                className="bs-cta-ghost tt-btn"
                style={{ borderColor: `${accent}60`, color: textColor }}
              >
                {cta2.label}
              </Link>
            )}
          </div>
        </div>

        {/* Image block */}
        {image && (
          <div className="bs-image-block">
            <div className="bs-image-glow" style={{ background: `radial-gradient(circle, ${accent}50 0%, transparent 70%)` }} />
            <img
              src={image}
              alt={title}
              className="bs-image"
              loading="lazy"
            />
          </div>
        )}
      </div>
    </article>
  );
}
