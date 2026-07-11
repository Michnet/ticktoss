import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/push/subscribe
 * Saves a Web Push subscription to push_subscriptions.
 * Mirrors the save_push_subscription intent in next-city.
 * Body: { subscription: PushSubscription, user_id?: string }
 */
export async function POST(request) {
  try {
    const { subscription, user_id } = await request.json();

    if (!subscription?.endpoint) {
      return NextResponse.json({ error: 'Invalid subscription data' }, { status: 400 });
    }

    const { endpoint, keys } = subscription;
    const p256dh_key = keys?.p256dh;
    const auth_key   = keys?.auth;

    if (!p256dh_key || !auth_key) {
      return NextResponse.json({ error: 'Missing subscription keys' }, { status: 400 });
    }

    // Upsert on endpoint (unique column) — updates user_id if user just logged in
    const { error } = await supabaseAdmin
      .from('push_subscriptions')
      .upsert(
        {
          endpoint,
          p256dh_key,
          auth_key,
          user_id: user_id || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'endpoint' }
      );

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Subscription saved' });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
