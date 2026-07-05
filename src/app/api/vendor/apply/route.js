import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

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

    const body = await request.json();
    const { business_name, business_phone, business_location, note } = body;

    if (!business_name || !business_phone || !business_location) {
      return NextResponse.json({ error: 'Please provide all required business details' }, { status: 400 });
    }

    // Insert the application
    const { data: application, error: appError } = await supabase
      .from('roles_applications')
      .insert([{
        user_id: user.id,
        roles_applied: ['vendor'],
        status: 'pending',
        business_name,
        business_phone,
        business_location,
        note
      }])
      .select()
      .single();

    if (appError) {
      console.error('Error submitting vendor application:', appError);
      // Check if unique violation or already applied etc.
      return NextResponse.json({ error: 'Failed to submit application. You may have already applied.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, application });
  } catch (err) {
    console.error('Vendor application API error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
