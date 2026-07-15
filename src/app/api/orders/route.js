import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import Mailjet from 'node-mailjet';
import { clusterItemsByVendor, calculateOrderTotal, generateTrackingNumber, formatLineItems } from '@/lib/orderUtils';

export async function POST(req) {
  try {
    const { cartItems, shipping_address, billing_address, payment_method, notes } = await req.json();

    if (!cartItems || cartItems.length === 0) {
      return Response.json({ error: 'Cart is empty' }, { status: 400 });
    }

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
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return Response.json({ error: 'Unauthorized. Please login or register to checkout.' }, { status: 401 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Re-verify sale window and stock server-side — the cart items sent by the
    // client are just a UI snapshot and can't be trusted for authorization.
    const productIds = [...new Set(cartItems.map(item => item.id || item.product_id).filter(Boolean))];
    const { data: liveProducts, error: liveProductsError } = await supabaseAdmin
      .from('products')
      .select('id, name, stock, sale_start_date')
      .in('id', productIds);

    if (liveProductsError) throw liveProductsError;

    const liveProductById = new Map((liveProducts || []).map(p => [p.id, p]));
    const requestedQtyById = new Map();
    for (const item of cartItems) {
      const id = item.id || item.product_id;
      requestedQtyById.set(id, (requestedQtyById.get(id) || 0) + (item.quantity || 1));
    }

    for (const [id, qty] of requestedQtyById) {
      const live = liveProductById.get(id);
      if (!live) {
        return Response.json({ error: 'One of the items in your cart is no longer available.' }, { status: 400 });
      }
      if (live.sale_start_date && new Date(live.sale_start_date) > new Date()) {
        return Response.json({
          error: `"${live.name}" isn't available for purchase yet — remove it from your cart or add it to your watchlist instead.`
        }, { status: 400 });
      }
      if (live.stock !== null && live.stock < qty) {
        return Response.json({ error: `Insufficient stock for "${live.name}".` }, { status: 400 });
      }
    }

    // Group items by vendor
    const vendorClusters = clusterItemsByVendor(cartItems);
    const createdOrders = [];
    const mailjet = new Mailjet({
      apiKey: process.env.MAILJET_API_KEY,
      apiSecret: process.env.MAILJET_SECRET_KEY
    });

    const userEmail = user.email || shipping_address?.email || billing_address?.email;
    const userName = shipping_address?.firstName || user?.user_metadata?.first_name || 'Customer';

    let allItemsListHtml = '';
    let grandTotal = 0;

    for (const cluster of vendorClusters) {
      const formattedItems = formatLineItems(cluster.items);
      const totalAmount = calculateOrderTotal(formattedItems, 0);
      const trackingNumber = generateTrackingNumber('TT');

      const orderData = {
        user_id: user.id,
        status: 'pending',
        items: formattedItems,
        total_amount: totalAmount,
        shipping_address: shipping_address || {},
        billing_address: billing_address || {},
        payment_method: payment_method || 'cash_on_delivery',
        payment_status: 'unpaid',
        shipping_cost: 0,
        tracking_number: trackingNumber,
        notes: notes || '',
      };

      const { data: order, error: insertError } = await supabaseAdmin
        .from('product_orders')
        .insert([orderData])
        .select()
        .single();

      if (insertError) throw insertError;
      createdOrders.push(order);

      // Build HTML for this cluster for the customer email
      const clusterHtml = formattedItems.map(item => `<li>${item.name} x ${item.quantity} - UGX ${item.price.toLocaleString()}</li>`).join('');
      allItemsListHtml += `<h4>Order ${trackingNumber}</h4><ul>${clusterHtml}</ul><p>Subtotal: UGX ${totalAmount.toLocaleString()}</p>`;
      grandTotal += totalAmount;

      // Send email to the specific vendor if vendor_id exists
      if (cluster.vendor_id) {
        const { data: vendorData } = await supabaseAdmin.from('profiles').select('email, name, display_name').eq('user_id', cluster.vendor_id).single();
        const vEmail = vendorData?.email;
        if (vEmail) {
          try {
            await mailjet.post('send', { version: 'v3.1' }).request({
              Messages: [{
                From: { Email: "support@lyvecity.com", Name: "TickToss Orders" },
                To: [{ Email: vEmail, Name: vendorData.display_name || vendorData.name || 'Vendor' }],
                Subject: `New Order Received - #${trackingNumber}`,
                HTMLPart: `<h3>New Order Alert</h3>
                  <p>You have received a new order on TickToss.</p>
                  <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
                  <p><strong>Items:</strong></p><ul>${clusterHtml}</ul>
                  <p><strong>Total for your items:</strong> UGX ${totalAmount.toLocaleString()}</p>`
              }]
            });
          } catch (e) {
            console.error('Failed to notify vendor:', e);
          }
        }
      }
    }

    // Email Customer
    if (userEmail) {
      try {
        await mailjet.post('send', { version: 'v3.1' }).request({
          Messages: [{
            From: { Email: "support@lyvecity.com", Name: "TickToss Dispatch" },
            To: [{ Email: userEmail, Name: userName }],
            Subject: `TickToss Order Confirmation`,
            HTMLPart: `<h3>Order Confirmation</h3>
              <p>Hello ${userName},</p>
              <p>Your order(s) have been placed successfully!</p>
              ${allItemsListHtml}
              <p><strong>Grand Total:</strong> UGX ${grandTotal.toLocaleString()}</p>
              <p>We will notify you once your order is processed.</p>
              <p>Thank you for shopping with us!</p>`
          }]
        });
      } catch (e) {
        console.error('Failed to email customer:', e);
      }
    }

    // Email Admin
    const siteManagers = JSON.parse(process.env.SITE_MANAGERS || '{}');
    const adminEmail = siteManagers?.admin?.email;
    if (adminEmail) {
      try {
        await mailjet.post('send', { version: 'v3.1' }).request({
          Messages: [{
            From: { Email: "support@lyvecity.com", Name: "TickToss Orders" },
            To: [{ Email: adminEmail, Name: "Admin" }],
            Subject: `New Orders Placed`,
            HTMLPart: `<h3>New Order Alert</h3>
              <p>New orders have been placed on TickToss.</p>
              <p><strong>Customer:</strong> ${userName} (${userEmail})</p>
              ${allItemsListHtml}
              <p><strong>Grand Total:</strong> UGX ${grandTotal.toLocaleString()}</p>`
          }]
        });
      } catch (e) {
        console.error('Failed to email admin:', e);
      }
    }

    return Response.json({ success: true, orders: createdOrders });

  } catch (error) {
    console.error('Order creation error:', error.message);
    return Response.json({ error: error.message }, { status: 400 });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const intent = searchParams.get('intent');

    if (!intent) {
      return Response.json({ error: 'Intent is required' }, { status: 400 });
    }

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
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    if (intent === 'get_vendor_orders') {
      const { data, error } = await supabaseAdmin
        .from('product_orders')
        .select(`
          *,
          profiles:user_id(display_name, email, phone)
        `)
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return Response.json({ orders: data || [] });
    }

    return Response.json({ error: 'Invalid intent' }, { status: 400 });

  } catch (error) {
    console.error('Orders GET error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
