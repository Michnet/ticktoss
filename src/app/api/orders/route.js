import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import Mailjet from 'node-mailjet';
import { clusterItemsByVendor, calculateOrderTotal, generateTrackingNumber } from '@/lib/orderUtils';

const REQUIRED_ADDRESS_FIELDS = ['firstName', 'lastName', 'phone', 'address', 'city'];

export async function POST(req) {
  try {
    const { items, address, payment_method, notes } = await req.json();

    if (!items || items.length === 0) {
      return Response.json({ error: 'Cart is empty' }, { status: 400 });
    }

    const missingFields = REQUIRED_ADDRESS_FIELDS.filter((field) => !address?.[field]);
    if (missingFields.length > 0) {
      return Response.json({ error: `Missing required address fields: ${missingFields.join(', ')}` }, { status: 400 });
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

    // Re-verify sale window, stock, price and vendor server-side — the cart
    // items sent by the client are just a UI snapshot and can't be trusted
    // for authorization or pricing.
    const productIds = [...new Set(items.map(item => item.id || item.product_id).filter(Boolean))];
    const { data: liveProducts, error: liveProductsError } = await supabaseAdmin
      .from('products')
      .select('id, name, stock, price, sale_price, user_id, sale_start_date, featured_image, tt_location')
      .in('id', productIds);

    if (liveProductsError) throw liveProductsError;

    const liveProductById = new Map((liveProducts || []).map(p => [p.id, p]));

    const variationIds = [...new Set(items.map(item => item.variation_id).filter(Boolean))];
    let liveVariationById = new Map();
    if (variationIds.length > 0) {
      const { data: liveVariations, error: liveVariationsError } = await supabaseAdmin
        .from('product_variations')
        .select('id, product_id, stock_quantity, price, sale_price, attributes')
        .in('id', variationIds);

      if (liveVariationsError) throw liveVariationsError;
      liveVariationById = new Map((liveVariations || []).map(v => [v.id, v]));
    }

    // Aggregate requested quantity per product/variation so a duplicated
    // line item (or the same product added twice) is validated against its
    // total, not checked twice against the same starting stock figure.
    const requestedQtyByProductId = new Map();
    const requestedQtyByVariationId = new Map();
    for (const item of items) {
      const productId = item.id || item.product_id;
      const qty = item.quantity || 1;
      if (item.variation_id) {
        requestedQtyByVariationId.set(item.variation_id, (requestedQtyByVariationId.get(item.variation_id) || 0) + qty);
      } else {
        requestedQtyByProductId.set(productId, (requestedQtyByProductId.get(productId) || 0) + qty);
      }
    }

    for (const [productId, qty] of requestedQtyByProductId) {
      const live = liveProductById.get(productId);
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

    for (const [variationId, qty] of requestedQtyByVariationId) {
      const variation = liveVariationById.get(variationId);
      if (!variation) {
        return Response.json({ error: 'One of the selected options is no longer available.' }, { status: 400 });
      }
      const product = liveProductById.get(variation.product_id);
      if (product?.sale_start_date && new Date(product.sale_start_date) > new Date()) {
        return Response.json({
          error: `"${product.name}" isn't available for purchase yet — remove it from your cart or add it to your watchlist instead.`
        }, { status: 400 });
      }
      if (variation.stock_quantity < qty) {
        return Response.json({ error: `Insufficient stock for "${product?.name || 'selected option'}".` }, { status: 400 });
      }
    }

    // All validation passed — decrement stock once per unique product/variation.
    for (const [productId, qty] of requestedQtyByProductId) {
      const live = liveProductById.get(productId);
      const { error: stockError } = await supabaseAdmin
        .from('products')
        .update({ stock: live.stock - qty })
        .eq('id', productId);
      if (stockError) throw stockError;
    }
    for (const [variationId, qty] of requestedQtyByVariationId) {
      const variation = liveVariationById.get(variationId);
      const { error: stockError } = await supabaseAdmin
        .from('product_variations')
        .update({ stock_quantity: variation.stock_quantity - qty })
        .eq('id', variationId);
      if (stockError) throw stockError;
    }

    // Build line items from live/authoritative data (price, vendor, name,
    // image) rather than trusting the client-supplied cart snapshot.
    const enrichedItems = items.map(item => {
      const productId = item.id || item.product_id;
      const product = liveProductById.get(productId);
      const variation = item.variation_id ? liveVariationById.get(item.variation_id) : null;
      const unitPrice = variation?.sale_price || variation?.price || product.sale_price || product.price;

      return {
        product_id: productId,
        variation_id: item.variation_id || null,
        name: product.name,
        quantity: item.quantity || 1,
        price: unitPrice,
        vendor_id: product.user_id || null,
        image: product.featured_image || null,
        attributes: variation?.attributes || item.attributes || null,
        // Snapshot of which store sold this item — lets contact info be
        // resolved per item rather than per order, since a vendor can run
        // multiple stores and a buyer's items may not all come from one.
        tt_location: product.tt_location || null,
      };
    });

    // Group items by vendor — each vendor's items become their own order row.
    const vendorClusters = clusterItemsByVendor(enrichedItems);
    const createdOrders = [];
    const mailjet = new Mailjet({
      apiKey: process.env.MAILJET_API_KEY,
      apiSecret: process.env.MAILJET_SECRET_KEY
    });

    const userEmail = user.email;
    const userName = [address.firstName, address.lastName].filter(Boolean).join(' ') || 'Customer';

    let allItemsListHtml = '';
    let grandTotal = 0;

    for (const cluster of vendorClusters) {
      const totalAmount = calculateOrderTotal(cluster.items, 0);
      const trackingNumber = generateTrackingNumber('TT');

      const orderData = {
        user_id: user.id,
        vendor_id: cluster.vendor_id,
        status: 'pending',
        items: cluster.items,
        total_amount: totalAmount,
        shipping_address: address,
        billing_address: address,
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

      const clusterHtml = cluster.items.map(item => `<li>${item.name} x ${item.quantity} - UGX ${item.price.toLocaleString()}</li>`).join('');
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

    if (intent === 'buyer_orders') {
      // Opportunistic sweep so a stale pending order shows as `expired`
      // here even if the pg_cron backstop hasn't ticked yet.
      await supabaseAdmin.rpc('tt_expire_stale_orders');

      // `vendor` carries tt_stores purely as a fallback contact source for
      // items placed before per-item tt_location snapshots existed.
      const { data, error } = await supabaseAdmin
        .from('product_orders')
        .select(`
          *,
          products:product_id(name, featured_image, slug),
          vendor:profiles!product_orders_vendor_id_fkey(display_name, tt_stores)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return Response.json({ orders: data || [] });
    }

    if (intent === 'seller_stats') {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('order_stats')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      return Response.json({ order_stats: data?.order_stats || {} });
    }

    return Response.json({ error: 'Invalid intent' }, { status: 400 });

  } catch (error) {
    console.error('Orders GET error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
