import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import Mailjet from 'node-mailjet';
import { isAdmin } from '@/lib/roles';
import { getCategoryColor } from '@/lib/colors';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const intent = searchParams.get('intent');

     const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          cookies: {
            getAll() { return cookieStore.getAll(); },
            setAll() {},
          },
        }
      );

    if (intent === 'list') {
      const { data, error } = await supabase
        .from('profiles')
        .select('tt_stores')
        .overlaps('roles', ['tt_vendor'])

      if (error) {
        console.error('Error fetching profiles:', error);
        return NextResponse.json({ error: 'Failed to load profiles' }, { status: 500 });
      }

      return NextResponse.json({ applications: data });
    }

    if (intent === 'admin_vendor_directory') {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user || !isAdmin(user)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, email, tt_stores')
        .overlaps('roles', ['tt_vendor'])
        .not('tt_stores', 'is', null)
        .order('display_name');

      if (error) {
        console.error('Error fetching vendor directory:', error);
        return NextResponse.json({ error: 'Failed to load vendors' }, { status: 500 });
      }

      const vendors = (data ?? []).filter(v => v.tt_stores?.length);

      return NextResponse.json({ vendors });
    }

    if (intent === 'featured') {
      const limit = Number(searchParams.get('limit')) || 4;

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar, tt_stores')
        .overlaps('roles', ['tt_vendor'])
        .not('tt_stores', 'is', null)
        .limit(limit * 6);

      if (profilesError) {
        console.error('Error fetching vendor profiles:', profilesError);
        return NextResponse.json({ error: 'Failed to load vendors' }, { status: 500 });
      }

      const cacheHeaders = { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' };

      if (!profiles?.length) {
        return NextResponse.json({ vendors: [] }, { headers: cacheHeaders });
      }

      const vendorIds = profiles.map((p) => p.user_id);

      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('user_id, rating, reviews, is_flash_sale')
        .eq('status', 'published')
        .in('user_id', vendorIds);

      if (productsError) {
        console.error('Error fetching vendor product stats:', productsError);
        return NextResponse.json({ error: 'Failed to load vendors' }, { status: 500 });
      }

      // Aggregate per-vendor stats client-side — no vendor-level stats view/RPC exists yet
      const stats = new Map();
      for (const p of products ?? []) {
        const s = stats.get(p.user_id) ?? { activeDeals: 0, ratingSum: 0, ratingCount: 0, reviews: 0, hasFlashSale: false };
        s.activeDeals += 1;
        if (p.rating) {
          s.ratingSum += p.rating;
          s.ratingCount += 1;
        }
        s.reviews += p.reviews ?? 0;
        if (p.is_flash_sale) s.hasFlashSale = true;
        stats.set(p.user_id, s);
      }

      const vendors = profiles
        .map((profile) => {
          const store = profile.tt_stores?.[0];
          const s = stats.get(profile.user_id);
          if (!store || !s?.activeDeals) return null;
          return {
            id: profile.user_id,
            slug: profile.user_id,
            image:store.cover_image,
            name: store.name || profile.display_name || 'Vendor',
            color: getCategoryColor(store.name || profile.display_name),
            city: store.address || null,
            avatar: profile.avatar || null,
            rating: s.ratingCount ? Number((s.ratingSum / s.ratingCount).toFixed(1)) : null,
            reviews: s.reviews,
            activeDeals: s.activeDeals,
            hasFlashSale: s.hasFlashSale,
            verified: true, // tt_vendor role is only granted after admin approval
          };
        })
        .filter(Boolean)
        .sort((a, b) => b.activeDeals - a.activeDeals)
        .slice(0, limit);

      return NextResponse.json({ vendors }, { headers: cacheHeaders });
    }

    if (intent === 'get_applications') {
      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          cookies: {
            getAll() { return cookieStore.getAll(); },
            setAll() {},
          },
        }
      );

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user || !isAdmin(user)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      const { data, error } = await supabaseAdmin
        .from('roles_applications')
        .select('*, profiles(email, display_name)')
        .eq('status', 'pending')
        .contains('roles_applied', ['vendor'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching applications:', error);
        return NextResponse.json({ error: 'Failed to load applications' }, { status: 500 });
      }

      return NextResponse.json({ applications: data });
    }

    return NextResponse.json({ error: 'Invalid intent' }, { status: 400 });
  } catch (err) {
    console.error('Admin API GET error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            // Read-only in API
          },
        },
      }
    );

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify Admin
    if (!isAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { intent, application_id, user_id } = body;

    if (intent === 'approval') {
      if (!application_id || !user_id) {
        return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
      }

      // Use service role for elevated privileges (updating other users' profiles)
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      // 1. Update roles_applications status to approved
      const { data: appData, error: appError } = await supabaseAdmin
        .from('roles_applications')
        .update({ 
          status: 'approved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', application_id)
        .select()
        .single();

      if (appError) {
        console.error('Failed to update application status:', appError);
        return NextResponse.json({ error: 'Failed to approve application' }, { status: 500 });
      }

      // 2. Append 'tt_vendor' to roles and add tt_store to profiles.tt_stores
      // Fetch current profile
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('roles, tt_stores, email, display_name')
        .eq('user_id', user_id)
        .single();

      if (profileError) {
        console.error('Failed to fetch user profile:', profileError);
        return NextResponse.json({ error: 'Failed to retrieve user profile' }, { status: 500 });
      }

      const currentRoles = profile.roles || [];
      const currentStores = profile.tt_stores || [];
      const ttStore = appData.meta?.tt_store ?? null;

      const profileUpdates = {};

      if (!currentRoles.includes('tt_vendor')) {
        profileUpdates.roles = [...currentRoles, 'tt_vendor'];
      }

      if (ttStore) {
        profileUpdates.tt_stores = [...currentStores, ttStore];
      }

      if (Object.keys(profileUpdates).length > 0) {
        const { error: updateProfileError } = await supabaseAdmin
          .from('profiles')
          .update(profileUpdates)
          .eq('user_id', user_id);

        if (updateProfileError) {
          console.error('Failed to update profile:', updateProfileError);
          return NextResponse.json({ error: 'Failed to update user profile' }, { status: 500 });
        }
      }

      // 3. Send approval email via Mailjet
      const applicantEmail = profile.email;
      if (applicantEmail) {
        try {
          const mailjet = new Mailjet({
            apiKey: process.env.MAILJET_API_KEY,
            apiSecret: process.env.MAILJET_SECRET_KEY
          });

          const applicantName = profile.display_name || 'TickToss Vendor';
          
          await mailjet.post('send', { version: 'v3.1' }).request({
            Messages: [{
              From: { Email: "support@lyvecity.com", Name: "TickToss Admin" },
              To: [{ Email: applicantEmail, Name: applicantName }],
              Subject: `Congratulations! Your Vendor Application is Approved`,
              HTMLPart: `<h3>Welcome to TickToss!</h3>
                <p>Hello ${applicantName},</p>
                <p>Great news! Your application to become a vendor has been approved.</p>
                <p>You can now log in and access the Vendor Dashboard to start posting your flash deals.</p>
                <p><a href="https://ticktoss.com/dashboard">Go to Vendor Dashboard</a></p>
                <p>We are excited to see what you have to offer.</p>
                <p>Thank you,<br/>TickToss Team</p>`
            }]
          });
        } catch (e) {
          console.error('Failed to send approval email to applicant:', e);
          // Don't fail the request if just the email fails
        }
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid intent' }, { status: 400 });

  } catch (err) {
    console.error('Admin API error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
