'use client';

import Link from 'next/link';
import * as LucideIcons from 'lucide-react';

/**
 * BannerSlideIcon — Icon-based promotional banner slide.
 * Uses react-lucide icons instead of PNG images.
 *
 * item shape:
 * {
 *   id:          string,
 *   title:       string,
 *   subtitle?:   string,           // eyebrow line
 *   description: string,
 *   cta?:        { label: string, href: string },
 *   cta2?:       { label: string, href: string },
 *   icon:        string,           // Lucide icon name e.g. 'Zap', 'ShoppingBag', 'Tag'
 *   iconSize?:   number,           // icon px size (default 80)
 *   accent:      string,           // primary accent color
 *   accentLight: string,           // lighter tint
 *   badge?:      string,
 *   bgFrom?:     string,
 *   bgTo?:       string,
 *   textColor?:  string,
 *   stats?:      { label: string, value: string }[],  // optional mini stat pills
 *   features?:   { icon: string, text: string }[],   // icon+text feature list
 * }
 */
export default function BannerSlideIcon({ item }) {
  const {
    title = '',
    subtitle = '',
    description = '',
    cta,
    cta2,
    icon = 'Zap',
    iconSize = 80,
    accent = '#FF4D00',
    accentLight = 'rgba(255,77,0,0.15)',
    badge,
    bgFrom,
    bgTo,
    textColor = '#fff',
    stats = [],
    features = [],
  } = item;

  const gradFrom = bgFrom ?? `${accent}22`;
  const gradTo   = bgTo   ?? 'rgba(0,0,0,0.9)';

  // Resolve lucide icon — fallback to Zap
  const IconComp = LucideIcons[icon] ?? LucideIcons.Zap;

  return (
    <article
      className="bs-icon-slide"
      style={{
        background: `linear-gradient(135deg, ${gradTo} 0%, ${gradFrom} 100%)`,
        color: textColor,
      }}
    >
      {/* Grain overlay */}
      <div className="bs-grain" />

      {/* Decorative concentric ring behind icon */}
      <div className="bs-icon-ring-wrap" aria-hidden="true">
        <div
          className="bs-icon-ring bs-icon-ring-outer"
          style={{ borderColor: `${accent}18` }}
        />
        <div
          className="bs-icon-ring bs-icon-ring-mid"
          style={{ borderColor: `${accent}28` }}
        />
        <div
          className="bs-icon-ring bs-icon-ring-inner"
          style={{ borderColor: `${accent}40` }}
        />
      </div>

      {/* Content */}
      <div className="bs-content-wrap">
        {/* Left: Icon showcase */}
        <div className="bs-icon-block">
          {/* Glow */}
          <div
            className="bs-icon-glow"
            style={{ background: `radial-gradient(circle, ${accent}55 0%, transparent 70%)` }}
          />
          {/* Icon container */}
          <div
            className="bs-icon-container"
            style={{
              background: `linear-gradient(135deg, ${accent}30, ${accent}10)`,
              border: `1.5px solid ${accent}55`,
              boxShadow: `0 0 40px ${accent}44, inset 0 1px 0 ${accent}30`,
            }}
          >
            <IconComp
              size={iconSize}
              color={accent}
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </div>

          {/* Stats pills under icon */}
          {stats.length > 0 && (
            <div className="bs-stats-row">
              {stats.map((s, i) => (
                <div
                  key={i}
                  className="bs-stat-pill"
                  style={{
                    background: `${accent}18`,
                    border: `1px solid ${accent}35`,
                  }}
                >
                  <span className="bs-stat-value" style={{ color: accent }}>{s.value}</span>
                  <span className="bs-stat-label">{s.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Text block */}
        <div className="bs-text-block">
          {/* Badge */}
          {badge && (
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
          )}

          {/* Eyebrow */}
          {subtitle && (
            <p className="bs-subtitle" style={{ color: accent }}>
              {subtitle}
            </p>
          )}

          {/* Title */}
          <h2 className="bs-title" style={{ '--accent': accent }}>
            {title}
          </h2>

          {/* Description */}
          {description && (
            <p className="bs-description">{description}</p>
          )}

          {/* Feature list */}
          {features.length > 0 && (
            <ul className="bs-features-list">
              {features.map((f, i) => {
                const FeatIcon = LucideIcons[f.icon] ?? LucideIcons.Check;
                return (
                  <li key={i} className="bs-feature-item">
                    <span
                      className="bs-feature-icon-wrap"
                      style={{ background: `${accent}22`, color: accent }}
                    >
                      <FeatIcon size={13} strokeWidth={2.5} />
                    </span>
                    <span>{f.text}</span>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Accent bar */}
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
                <LucideIcons.ArrowRight size={16} strokeWidth={2.5} aria-hidden="true" />
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
      </div>
    </article>
  );
}
