import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    const supabase = await createClient();

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
  } catch (error) {
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 });
  }
}
