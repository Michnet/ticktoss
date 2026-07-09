import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import Mailjet from 'node-mailjet';

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
    const { meta, note } = body;

    const ttStore = meta?.tt_store;
    if (!ttStore?.name || !Array.isArray(ttStore?.calls) || ttStore.calls.length === 0 || !ttStore?.location) {
      return NextResponse.json(
        { error: 'Please provide all required business details (name, at least one call number, and location)' },
        { status: 400 }
      );
    }

    // Insert the application — business data lives in meta.tt_store
    const { data: application, error: appError } = await supabase
      .from('roles_applications')
      .insert([{
        user_id: user.id,
        roles_applied: ['vendor'],
        status: 'pending',
        meta: { tt_store: ttStore },
        note,
      }])
      .select()
      .single();

    if (appError) {
      console.error('Error submitting vendor application:', appError);
      return NextResponse.json({ error: 'Failed to submit application. You may have already applied.' }, { status: 500 });
    }

    // Send Emails via Mailjet
    const mailjet = new Mailjet({
      apiKey: process.env.MAILJET_API_KEY,
      apiSecret: process.env.MAILJET_SECRET_KEY
    });

    const userEmail = user.email;
    const userName = user?.user_metadata?.first_name || user?.user_metadata?.name || 'Applicant';
    const siteManagers = process.env.SITE_MANAGERS ? JSON.parse(process.env.SITE_MANAGERS) : {};
    const adminEmail = siteManagers?.admin?.email;

    const storeName = ttStore.name;
    const storePhone = ttStore.calls?.join(', ') || 'N/A';
    const storeWhatsApp = ttStore.whatsapp?.join(', ') || 'N/A';
    const storeLocation = ttStore.location;

    // 1. Email Admin
    if (adminEmail) {
      try {
        await mailjet.post('send', { version: 'v3.1' }).request({
          Messages: [{
            From: { Email: "support@lyvecity.com", Name: "TickToss Admin" },
            To: [{ Email: adminEmail, Name: "Admin" }],
            Subject: `New Vendor Application: ${storeName}`,
            HTMLPart: `<h3>New Vendor Application</h3>
              <p>A new vendor application has been submitted.</p>
              <p><strong>Business Name:</strong> ${storeName}</p>
              <p><strong>Call Numbers:</strong> ${storePhone}</p>
              <p><strong>WhatsApp:</strong> ${storeWhatsApp}</p>
              <p><strong>Location:</strong> ${storeLocation}</p>
              <p><strong>Note:</strong> ${note || 'N/A'}</p>
              <p><strong>User Email:</strong> ${userEmail || 'N/A'}</p>`
          }]
        });
      } catch (e) {
        console.error('Failed to email admin about vendor application:', e);
      }
    }

    // 2. Email Applicant
    if (userEmail) {
      try {
        await mailjet.post('send', { version: 'v3.1' }).request({
          Messages: [{
            From: { Email: "support@lyvecity.com", Name: "TickToss" },
            To: [{ Email: userEmail, Name: userName }],
            Subject: `Vendor Application Received`,
            HTMLPart: `<h3>Application Received</h3>
              <p>Hello ${userName},</p>
              <p>We have received your application to become a vendor on TickToss for <strong>${storeName}</strong>.</p>
              <p>Our team will review your details and get back to you shortly.</p>
              <p>Thank you for choosing TickToss!</p>`
          }]
        });
      } catch (e) {
        console.error('Failed to email applicant:', e);
      }
    }

    return NextResponse.json({ success: true, application });
  } catch (err) {
    console.error('Vendor application API error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
