import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { addToFluentCrm } from '@/lib/fluentCrm';

export async function POST(request) {
  try {
    const url = new URL(request.url);
    const intent = url.searchParams.get('intent');
    const supabase = await createClient();

    if (intent === 'post_signup') {
      const { email, name, userId } = await request.json();

      if (!email) {
        return NextResponse.json({ error: 'Missing email' }, { status: 400 });
      }

      const result = await addToFluentCrm(email, name || 'User', '3', { lyve_user_id: userId });
      return NextResponse.json({ success: result.success });
    }

    if (intent === 'sign_in') {
      const { email, password } = await request.json();

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        return NextResponse.json({ error: authError.message }, { status: 400 });
      }

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authData.user.id)
        .single();

      return NextResponse.json({ user: authData.user, profile: profileData || null });
    }

    if (intent === 'sign_out') {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid intent' }, { status: 400 });

  } catch (error) {
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 });
  }
}
