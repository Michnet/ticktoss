'use client';

import { useState, useEffect, useCallback } from 'react';
import useAppStore from '@/store/useAppStore';

// Utility: convert VAPID base64 URL-safe key to Uint8Array
const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const GRACE_PERIOD_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Hook for managing Web Push notification subscriptions.
 * Ported from next-city/hooks/usePushNotifications.js,
 * adapted to use Zustand (useAppStore) instead of Jotai.
 */
export function usePushNotifications() {
  const user          = useAppStore((s) => s.user);
  const firstVisitTime = useAppStore((s) => s.firstVisitTime);

  const [isSupported, setIsSupported] = useState(false);
  const [permission,  setPermission]  = useState('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading,      setLoading]    = useState(false);

  // Check support and existing subscription on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);

      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((sub) => {
          setIsSubscribed(!!sub);
        });
      });
    }
  }, []);

  // Sync anonymous subscription to the authenticated user when they log in
  useEffect(() => {
    const userId = user?.id;
    if (!userId || !isSubscribed) return;

    const syncKey = `tt_push_synced_${userId}`;
    if (localStorage.getItem(syncKey)) return;

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((sub) => {
          if (!sub) return;
          fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subscription: sub, user_id: userId }),
          })
            .then(() => localStorage.setItem(syncKey, 'true'))
            .catch((err) => console.error('Failed to sync push subscription:', err));
        });
      });
    }
  }, [user?.id, isSubscribed]);

  const isWithinGracePeriod = useCallback(() => {
    if (!firstVisitTime) return true;
    return Date.now() - firstVisitTime < GRACE_PERIOD_MS;
  }, [firstVisitTime]);

  /** Show soft prompt only after grace period has elapsed */
  const shouldShowSoftPrompt = useCallback(() => {
    if (!isSupported || permission !== 'default') return false;
    return !isWithinGracePeriod();
  }, [isSupported, permission, isWithinGracePeriod]);

  /** High-intent prompt (e.g. user clicks Watch) — bypasses grace period */
  const shouldShowHighIntentPrompt = useCallback(() => {
    if (!isSupported || permission !== 'default') return false;
    return true;
  }, [isSupported, permission]);

  const subscribeToPush = async () => {
    if (!isSupported) return false;
    setLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== 'granted') return false;

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        console.error('VAPID public key not configured');
        return false;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription, user_id: user?.id || null }),
      });

      setIsSubscribed(true);
      return true;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    isSupported,
    permission,
    isSubscribed,
    loading,
    shouldShowSoftPrompt,
    shouldShowHighIntentPrompt,
    subscribeToPush,
  };
}
