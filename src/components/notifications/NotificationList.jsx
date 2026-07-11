'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Bell, ShoppingBag, Heart, Star, AlertTriangle, CheckCircle, XCircle, Package } from 'lucide-react';

/**
 * Renders the icon and accent colour for each notification type.
 */
function NotificationIcon({ type, isRead }) {
  const base = 'flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all';

  const config = {
    watchlist_sale_live: { icon: Bell,         bg: 'bg-[var(--tt-flame)]/15',  color: 'text-[var(--tt-flame)]'  },
    order_update:        { icon: Package,       bg: 'bg-blue-500/15',           color: 'text-blue-400'           },
    new_product:         { icon: ShoppingBag,   bg: 'bg-green-500/15',          color: 'text-green-400'          },
    like:                { icon: Heart,         bg: 'bg-red-500/15',            color: 'text-red-400'            },
    review:              { icon: Star,          bg: 'bg-yellow-500/15',         color: 'text-yellow-400'         },
    milestone:           { icon: Star,          bg: 'bg-yellow-500/15',         color: 'text-yellow-400'         },
    warning:             { icon: AlertTriangle, bg: 'bg-yellow-500/15',         color: 'text-yellow-400'         },
    success:             { icon: CheckCircle,   bg: 'bg-green-500/15',          color: 'text-green-400'          },
    error:               { icon: XCircle,       bg: 'bg-red-500/15',            color: 'text-red-400'            },
  };

  const { icon: Icon, bg, color } = config[type] ?? { icon: Bell, bg: 'bg-[var(--tt-surface-2)]', color: 'text-[var(--tt-muted)]' };

  return (
    <div className={`${base} ${bg} ${isRead ? 'opacity-50' : ''}`}>
      <Icon size={16} className={color} strokeWidth={2} />
    </div>
  );
}

/**
 * NotificationList — renders a list of notification objects.
 * @param {{ notifications: object[], loading: boolean, markAsRead: Function }} props
 */
export default function NotificationList({ notifications, loading, markAsRead }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--tt-flame)] border-t-transparent animate-spin" />
        <p className="text-sm text-[var(--tt-muted)]">Fetching notifications…</p>
      </div>
    );
  }

  if (!notifications || notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <Bell size={40} className="text-[var(--tt-muted)] opacity-30" strokeWidth={1.5} />
        <h5 className="font-semibold text-[var(--tt-text)]">All caught up!</h5>
        <p className="text-sm text-[var(--tt-muted)]">No notifications yet.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-[var(--tt-border)]">
      {notifications.map((n) => (
        <Link
          key={n.id}
          href={n.link || '#'}
          onClick={() => !n.is_read && markAsRead(n.id)}
          className="flex items-start gap-3 px-4 py-3 hover:bg-[var(--tt-surface-2)] transition-colors no-underline group"
        >
          <NotificationIcon type={n.type} isRead={n.is_read} />

          <div className="flex-1 min-w-0">
            <p className={`text-sm leading-snug ${n.is_read ? 'text-[var(--tt-muted-2)] font-normal' : 'text-[var(--tt-text)] font-semibold'}`}>
              {n.title}
            </p>
            {n.message && (
              <p className="text-xs text-[var(--tt-muted)] mt-0.5 leading-snug line-clamp-2">
                {n.message}
              </p>
            )}
            <p className="text-[0.7rem] text-[var(--tt-muted)] mt-1">
              {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
            </p>
          </div>

          {!n.is_read && (
            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-[var(--tt-flame)] mt-1.5" />
          )}
        </Link>
      ))}
    </div>
  );
}
