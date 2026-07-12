'use client';

import { useMemo, useState } from 'react';
import { getProductLabels } from '@/lib/productLabels';
import { randomEither } from '@/helpers/universal';

const VARIANT_STYLES = {
  danger: {
    bg: 'rgba(255, 59, 48, 0.12)',
    border: 'rgba(255, 59, 48, 0.35)',
    color: 'var(--tt-danger, #ff3b30)',
  },
  warning: {
    bg: 'rgba(255, 149, 0, 0.12)',
    border: 'rgba(255, 149, 0, 0.35)',
    color: 'var(--tt-flame-2, #ff9500)',
  },
  success: {
    bg: 'rgba(52, 199, 89, 0.12)',
    border: 'rgba(52, 199, 89, 0.35)',
    color: 'var(--tt-success, #34c759)',
  },
  info: {
    bg: 'rgba(0, 190, 210, 0.12)',
    border: 'rgba(0, 190, 210, 0.35)',
    color: 'var(--tt-info, #00bed2)',
  },
  neutral: {
    bg: 'rgba(130, 130, 140, 0.12)',
    border: 'rgba(130, 130, 140, 0.35)',
    color: 'var(--tt-muted, #8a8a9a)',
  },
};

const SIZE_STYLES = {
  sm: {
    fontSize: '0.58rem',
    padding: '2px 6px',
    iconPadding: '3px 5px',
    gap: '3px',
    borderRadius: '99px',
    fontWeight: 700,
    letterSpacing: '0.04em',
  },
  md: {
    fontSize: '0.72rem',
    padding: '4px 10px',
    iconPadding: '4px 8px',
    gap: '4px',
    borderRadius: '99px',
    fontWeight: 700,
    letterSpacing: '0.03em',
  },
};

/**
 * @param {{
 *   label:    object,
 *   size?:    'sm'|'md',
 *   noIcon?:  boolean,
 *   noBg?:    boolean,
 *   noText?:  boolean,
 *   hideIcon?: boolean,
 * }} props
 */
export default function ProductLabel({
  label,
  size = 'sm',
  noIcon = false,
  noBg = false,
  noText = false,
  style = {},
  hideIcon = false,   // backwards-compat alias
}) {
  const [hovered, setHovered] = useState(false);

  if (!label) return null;

  const variantStyle = VARIANT_STYLES[label.variant] ?? VARIANT_STYLES.neutral;
  const sizeStyle    = SIZE_STYLES[size] ?? SIZE_STYLES.sm;
  const suppressIcon = noIcon || hideIcon;

  // noText: icon-only chip — text shown as tooltip on hover
  if (noText && label.icon && !suppressIcon) {
    return (
      <span
        role="img"
        aria-label={label.text}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: noBg ? '0' : sizeStyle.iconPadding,
          borderRadius: noBg ? '0' : sizeStyle.borderRadius,
          lineHeight: 1,
          background: noBg ? 'transparent' : variantStyle.bg,
          border: noBg ? 'none' : `1px solid ${variantStyle.border}`,
          color: variantStyle.color,
          backdropFilter: noBg ? 'none' : 'blur(4px)',
          WebkitBackdropFilter: noBg ? 'none' : 'blur(4px)',
          cursor: 'default',
          userSelect: 'none',
          fontSize: size === 'md' ? '0.9rem' : '0.78rem',
          ...style
        }}
      >
        {label.icon}

        {/* Tooltip */}
        {hovered && (
          <span
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 6px)',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--tt-surface, #1a1a2e)',
              border: `1px solid ${variantStyle.border}`,
              color: variantStyle.color,
              fontSize: '0.6rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              padding: '3px 8px',
              borderRadius: '6px',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              zIndex: 50,
              boxShadow: '0 4px 12px rgba(0,0,0,0.25)'
            }}
          >
            {label.text}
            {/* Caret */}
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderTop: `5px solid ${variantStyle.border}`,
              }}
            />
          </span>
        )}
      </span>
    );
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: sizeStyle.gap,
        fontSize: sizeStyle.fontSize,
        fontWeight: sizeStyle.fontWeight,
        letterSpacing: sizeStyle.letterSpacing,
        padding: noBg ? '0' : sizeStyle.padding,
        borderRadius: noBg ? '0' : sizeStyle.borderRadius,
        lineHeight: 1.2,
        background: noBg ? 'transparent' : variantStyle.bg,
        border: noBg ? 'none' : `1px solid ${variantStyle.border}`,
        color: variantStyle.color,
        backdropFilter: noBg ? 'none' : 'blur(4px)',
        WebkitBackdropFilter: noBg ? 'none' : 'blur(4px)',
        whiteSpace: 'nowrap',
        userSelect: 'none',
        ...style
      }}
    >
      {!suppressIcon && label.icon && (
        <span aria-hidden="true" style={{ lineHeight: 1 }}>
          {label.icon}
        </span>
      )}
      {label.text}
    </span>
  );
}

/**
 * ProductLabelRow — renders up to `max` label chips in a flex row.
 *
 * Props:
 *   product   {object}         — raw product object
 *   max       {number}         — max chips to show (default 3)
 *   size      {'sm'|'md'}      — chip size
 *   noIcon    {boolean}        — hide icons on all chips
 *   noBg      {boolean}        — strip bg/border/blur on all chips
 *   noText    {boolean}        — icon-only mode with hover tooltip on all chips
 *   hideIcons {boolean}        — alias for noIcon (backwards compat)
 *   className {string}         — extra wrapper className
 *   style     {CSSProperties}  — extra wrapper style
 */
export function ProductLabelRow({ product, max = 3, size = 'sm', noIcon = false, noBg = false, noText = false, hideIcons = false, className = '', style = {}, itemStyle = {}, random = false, }) {
  const labels = getProductLabels(product, { maxLabels: max });

  if (!labels.length) return null;
  const activeLabel = useMemo(() => {
    return randomEither(labels)
  }, [product.id, labels?.length]);

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: noBg ? '6px' : '4px',
        alignItems: 'center',
        ...style,
      }}
    >
      {random ? <ProductLabel
        key={activeLabel.key}
        label={activeLabel}
        size={size}
        noIcon={noIcon || hideIcons}
        noBg={noBg}
        noText={noText}
        style={itemStyle} /> :
        labels.map(label => (
        <ProductLabel
          key={label.key}
          label={label}
          size={size}
          noIcon={noIcon || hideIcons}
          noBg={noBg}
          noText={noText}
          style={itemStyle}
        />
      ))}
    </div>
  );
}
