'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import useAppStore from '@/store/useAppStore';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationList from '@/components/notifications/NotificationList';

export default function NotificationsPage() {
  const user   = useAppStore((s) => s.user);
  const router = useRouter();

  const { notifications, loading, markAsRead, markAllAsRead, unreadCount } = useNotifications(user?.id ?? null);

  useEffect(() => {
    if (user === null) { router.replace('/'); }
  }, [user, router]);

  return (
    <div className="tt-container py-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--tt-flame)]/15 flex items-center justify-center">
            <Bell size={20} className="text-[var(--tt-flame)]" strokeWidth={2} />
          </div>
          <div>
            <h1 className="font-extrabold text-xl text-[var(--tt-text)]">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-xs text-[var(--tt-muted)]">{unreadCount} unread</p>
            )}
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="tt-btn tt-btn-ghost flex items-center gap-1.5 text-xs py-1.5 px-3"
          >
            <CheckCheck size={14} strokeWidth={2} />
            Mark all read
          </button>
        )}
      </div>

      {/* Notification list */}
      <div className="tt-card overflow-hidden p-0">
        <NotificationList
          notifications={notifications}
          loading={loading}
          markAsRead={markAsRead}
        />
      </div>

      {!loading && notifications.length > 0 && (
        <p className="text-center text-xs text-[var(--tt-muted)] mt-4 opacity-60">
          Showing {notifications.length} recent notification{notifications.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
