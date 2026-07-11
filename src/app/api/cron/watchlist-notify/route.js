import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * GET /api/cron/watchlist-notify
 * Triggered daily by Vercel Cron (see vercel.json).
 * Finds all users with a watch schedule for today, inserts one notification
 * per user, then deletes the processed schedule rows.
 * The push_notices trigger on the notifications table fires automatically
 * for each INSERT → delivers a Web Push to the user.
 */
export async function GET(request) {
  // Authorize — Vercel Cron sends this header automatically in production
  const authHeader = request.headers.get('authorization');
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'

  try {
    // 1. Fetch all schedule rows for today
    const { data: scheduleRows, error: fetchError } = await supabaseAdmin
      .from('product_watch_schedule')
      .select('user_id, sale_date')
      .eq('sale_date', today);

    if (fetchError) throw fetchError;

    if (!scheduleRows || scheduleRows.length === 0) {
      return NextResponse.json({ message: 'No watchlist notifications to send today.', date: today });
    }

    // 2. Build one notification per user
    const notifications = scheduleRows.map((row) => ({
      user_id:   row.user_id,
      title:     '🔥 Your watchlist items go on sale today!',
      message:   'Deals you\'ve been watching are live right now. Tap to see them before they sell out.',
      type:      'watchlist_sale_live',
      link:      '/watchlist',
      is_read:   false,
      metadata:  { sale_date: today },
    }));

    // 3. Insert notifications — push_notices trigger fires per row
    const { error: insertError } = await supabaseAdmin
      .from('notifications')
      .insert(notifications);

    if (insertError) throw insertError;

    // 4. Delete the processed schedule rows for today
    const { error: deleteError } = await supabaseAdmin
      .from('product_watch_schedule')
      .delete()
      .eq('sale_date', today);

    if (deleteError) {
      // Non-fatal: log but don't fail — notifications were already sent
      console.error('Failed to clean up schedule rows:', deleteError);
    }

    return NextResponse.json({
      success: true,
      notified: scheduleRows.length,
      date: today,
    });

  } catch (error) {
    console.error('Watchlist cron error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
