'use client';

import { motion } from 'framer-motion';

/**
 * Generic "post" shell used by every feed item on /home — gives the whole
 * stream a consistent Facebook-post rhythm (avatar/title/meta header, body,
 * optional footer) no matter what kind of content it wraps.
 */
export default function FeedPostCard({className='bg-[var(--tt-theme)] border border-[var(--tt-surface-2)] rounded-[var(--tt-radius-lg)]', contentExClass='', avatar, title, meta, tag, tagVariant = 'flame', children, footer, noPadding = false }) {
  const tagClass =
    tagVariant === 'gold' ? 'tt-badge tt-badge-gold' :
    tagVariant === 'success' ? 'tt-badge tt-badge-success' :
    tagVariant === 'danger' ? 'tt-badge tt-badge-danger' :
    'tt-badge tt-badge-flame';

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.35 }}
      className={`overflow-hidden ${className}`}
    >
      {(title || tag) && (
        <div className="flex items-center gap-3 px-4 pt-3.5 pb-3">
          {avatar && (
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-[1.05rem] shrink-0 bg-[var(--tt-surface-2)] overflow-hidden">
              {avatar}
            </div>
          )}
          <div className="min-w-0 flex-1">
            {title && <div className="text-[0.86rem] font-semibold truncate">{title}</div>}
            {meta && <div className="text-[0.7rem] text-[var(--tt-muted)] truncate">{meta}</div>}
          </div>
          {tag && <span className={`${tagClass} shrink-0 text-[0.65rem]`}>{tag}</span>}
        </div>
      )}

      <div className={`${contentExClass} ${noPadding ? '' : 'px-4 pb-3'}`}>{children}</div>

      {footer && (
        <div className="border-t border-[var(--tt-border)] px-2 py-1">{footer}</div>
      )}
    </motion.article>
  );
}
