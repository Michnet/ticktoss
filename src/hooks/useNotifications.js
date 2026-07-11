'use client';

import { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

/**
 * Hook to manage user notifications with real-time updates.
 * Ported from next-city/hooks/useNotifications.js.
 *
 * @param {string|null} userId - The Supabase auth user ID
 * @returns {{ notifications, loading, unreadCount, markAsRead, markAllAsRead, refresh }}
 */
export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [loading,        setLoading]       = useState(true);
  const [unreadCount,    setUnreadCount]   = useState(0);

  const fetchNotifications = async () => {
    if (!userId) return;
    setLoading(true);

    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching notifications:', error);
    } else {
      setNotifications(data || []);
      setUnreadCount(data?.filter((n) => !n.is_read).length || 0);
    }
    setLoading(false);
  };

  const markAsRead = async (notificationId) => {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    if (!userId) return;
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    fetchNotifications();

    // Real-time subscription — any change to user's notifications refreshes list
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => fetchNotifications()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  return { notifications, loading, unreadCount, markAsRead, markAllAsRead, refresh: fetchNotifications };
}
