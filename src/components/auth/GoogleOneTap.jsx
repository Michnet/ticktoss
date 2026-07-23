'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import useAppStore from '@/store/useAppStore';

// Skip re-prompting for this long after an explicit sign-out
const LOGOUT_COOLDOWN_MS = 5 * 60 * 1000;

function recentlyLoggedOut() {
  if (typeof window === 'undefined') return false;
  const loggedOutAt = localStorage.getItem('oneTapLogoutTime');
  if (!loggedOutAt) return false;
  return Date.now() - parseInt(loggedOutAt, 10) < LOGOUT_COOLDOWN_MS;
}

async function generateNonce() {
  const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(nonce));
  const hashedNonce = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return [nonce, hashedNonce];
}

/**
 * Renders nothing — loads the Google Identity Services script and prompts
 * Google One Tap for signed-out visitors, signing them in via Supabase.
 */
export default function GoogleOneTap() {
  const { user, isAuthLoading, authModalOpen, setUser, setProfile, addToast } = useAppStore();
  const [scriptReady, setScriptReady] = useState(false);
  const promptedRef = useRef(false);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;
    if (!scriptReady || isAuthLoading || user || authModalOpen) return;
    if (promptedRef.current || !window.google?.accounts?.id) return;
    promptedRef.current = true;

    const supabase = getSupabaseBrowserClient();

    const handleCredentialResponse = async (response, nonce) => {
      try {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: response.credential,
          nonce,
        });

        if (error) {
          addToast({ type: 'error', message: 'Failed to sign in with Google.' });
          return;
        }

        if (data?.session?.user) {
          const signedInUser = data.session.user;
          setUser(signedInUser);

          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', signedInUser.id)
            .single();
          if (profileData) setProfile(profileData);

          localStorage.removeItem('oneTapLogoutTime');
          addToast({ type: 'success', message: 'Signed in with Google.' });
        }
      } catch (err) {
        console.error('Google One Tap sign-in error:', err);
        addToast({ type: 'error', message: 'Failed to sign in with Google.' });
      }
    };

    (async () => {
      const [nonce, hashedNonce] = await generateNonce();

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => handleCredentialResponse(response, nonce),
        auto_select: !recentlyLoggedOut(),
        use_fedcm_for_prompt: true,
        itp_support: true,
        cancel_on_tap_outside: false,
        ux_mode: 'popup',
        nonce: hashedNonce,
      });

      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed?.()) {
          console.warn('Google One Tap skipped:', notification.getNotDisplayedReason?.());
        }
      });
    })();

    return () => {
      window.google?.accounts?.id?.cancel();
    };
  }, [scriptReady, isAuthLoading, user, authModalOpen, setUser, setProfile, addToast]);

  return (
    <Script
      src="https://accounts.google.com/gsi/client"
      strategy="afterInteractive"
      onReady={() => setScriptReady(true)}
    />
  );
}
