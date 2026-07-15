import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { generateSlug } from '@/lib/slug';

async function getAuthedUser() {
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
  const { data: { user }, error } = await supabase.auth.getUser();
  return error ? null : user;
}

export async function GET(request) {
  try {
    const user = await getAuthedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();
    const page = parseInt(searchParams.get('page') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    if (q.length < 3) {
      return NextResponse.json({ data: [], hasMore: false });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const from = page * limit;
    const to = from + limit - 1;

    const { data, error } = await supabaseAdmin
      .from('tags')
      .select('id, name')
      .ilike('name', `%${q}%`)
      .order('name')
      .range(from, to + 1);

    if (error) {
      console.error('Failed to search tags:', error);
      return NextResponse.json({ error: 'Failed to search tags' }, { status: 500 });
    }

    const hasMore = data.length > limit;
    return NextResponse.json({ data: data.slice(0, limit), hasMore });
  } catch (err) {
    console.error('GET /api/tags error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getAuthedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await request.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Tag name is required' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const trimmedName = name.trim();
    const slug = generateSlug(trimmedName);

    // Reuse an existing tag with the same slug instead of creating a duplicate
    const { data: existing } = await supabaseAdmin
      .from('tags')
      .select('id, name')
      .eq('slug', slug)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(existing);
    }

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('tags')
      .insert([{ name: trimmedName, slug }])
      .select('id, name')
      .single();

    if (insertError) {
      console.error('Failed to create tag:', insertError);
      return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 });
    }

    return NextResponse.json(inserted);
  } catch (err) {
    console.error('POST /api/tags error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
