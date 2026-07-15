import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { generateSlug } from '@/lib/slug';

export async function POST(request) {
  try {
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
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { attribute_id, option_name } = await request.json();
    if (!attribute_id || !option_name || !option_name.trim()) {
      return NextResponse.json({ error: 'attribute_id and option_name are required' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: attribute, error: fetchError } = await supabaseAdmin
      .from('product_attributes')
      .select('id, options, custom_options')
      .eq('id', attribute_id)
      .single();

    if (fetchError || !attribute) {
      return NextResponse.json({ error: 'Attribute not found' }, { status: 404 });
    }

    if (!attribute.custom_options) {
      return NextResponse.json({ error: 'This attribute does not accept custom options' }, { status: 403 });
    }

    const trimmedName = option_name.trim();
    const optionSlug = generateSlug(trimmedName);
    const existingOptions = attribute.options || [];

    if (existingOptions.some(o => o.slug === optionSlug)) {
      return NextResponse.json({ error: 'This option already exists' }, { status: 409 });
    }

    const updatedOptions = [...existingOptions, { name: trimmedName, slug: optionSlug }];

    const { data: updatedAttribute, error: updateError } = await supabaseAdmin
      .from('product_attributes')
      .update({ options: updatedOptions })
      .eq('id', attribute_id)
      .select('id, name, slug, options, custom_options')
      .single();

    if (updateError) {
      console.error('Failed to add attribute option:', updateError);
      return NextResponse.json({ error: 'Failed to add option' }, { status: 500 });
    }

    return NextResponse.json({ success: true, attribute: updatedAttribute });
  } catch (err) {
    console.error('POST /api/vendor/products/attributes error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
