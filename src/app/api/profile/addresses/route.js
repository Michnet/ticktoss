import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

const REQUIRED_ADDRESS_FIELDS = ['firstName', 'lastName', 'phone', 'address', 'city'];

export async function POST(req) {
  try {
    const { address } = await req.json();

    const missingFields = REQUIRED_ADDRESS_FIELDS.filter((field) => !address?.[field]);
    if (missingFields.length > 0) {
      return Response.json({ error: `Missing required address fields: ${missingFields.join(', ')}` }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Read-modify-write against the live row (rather than trusting a
    // client-supplied full array) so two tabs adding addresses back-to-back
    // both land instead of the second overwriting the first.
    const { data: existingProfile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('shopping_addresses')
      .eq('user_id', user.id)
      .single();

    if (fetchError) throw fetchError;

    const updatedAddresses = [...(existingProfile?.shopping_addresses || []), address];

    const { data: profile, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ shopping_addresses: updatedAddresses, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) throw updateError;

    return Response.json({ profile });
  } catch (error) {
    console.error('Save address error:', error.message);
    return Response.json({ error: error.message }, { status: 400 });
  }
}
