import { getSupabaseBrowserClient } from '@/lib/supabase/client';
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
            // Not setting cookies in API route strictly needed here, just passing through
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
    const { product_id, variation_id, quantity = 1, shipping_address } = body;

    if (!product_id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // 1. Fetch product to verify stock, price, and sale window
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, stock, sale_price, user_id, sale_start_date, featured_image')
      .eq('id', product_id)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (product.sale_start_date && new Date(product.sale_start_date) > new Date()) {
      return NextResponse.json({
        error: "This item isn't available for purchase yet — add it to your watchlist to be notified when it launches."
      }, { status: 400 });
    }

    // 2. If a variation was selected, validate and decrement its stock instead
    // of the parent product's — variation stock is tracked independently.
    let unitPrice = product.sale_price;
    let originalVariationStock = null;
    if (variation_id) {
      const { data: variation, error: variationError } = await supabase
        .from('product_variations')
        .select('id, stock_quantity, price, sale_price')
        .eq('id', variation_id)
        .eq('product_id', product_id)
        .single();

      if (variationError || !variation) {
        return NextResponse.json({ error: 'Selected option is no longer available' }, { status: 404 });
      }

      if (variation.stock_quantity < quantity) {
        return NextResponse.json({ error: 'Insufficient stock available' }, { status: 400 });
      }

      unitPrice = variation.sale_price || variation.price || product.sale_price;
      originalVariationStock = variation.stock_quantity;

      const { error: updateError } = await supabase
        .from('product_variations')
        .update({ stock_quantity: variation.stock_quantity - quantity })
        .eq('id', variation_id);

      if (updateError) {
        throw updateError;
      }
    } else {
      if (product.stock < quantity) {
        return NextResponse.json({ error: 'Insufficient stock available' }, { status: 400 });
      }

      // Perform atomic stock decrement using RPC or simply by decrementing
      // (In a full prod environment, you'd use a Postgres function to prevent race conditions.
      // For MVP, we update directly via API, though it can suffer from race conditions)
      const newStock = product.stock - quantity;
      const { error: updateError } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', product_id);

      if (updateError) {
        throw updateError;
      }
    }

    // 3. Insert the order/booking
    // `items` mirrors the singular columns above as a one-entry snapshot —
    // it's what order_stats tracking and the vendor's resolution flow key
    // off of, so every order (cart checkout or single booking) needs one.
    const total_amount = unitPrice * quantity;
    const orderData = {
      user_id: user.id,
      vendor_id: product.user_id,
      product_id: product.id,
      variation_id: variation_id || null,
      quantity,
      unit_price: unitPrice,
      total_amount,
      shipping_address,
      status: 'pending',
      payment_method: 'cash_on_delivery',
      payment_status: 'pending',
      items: [{
        product_id: product.id,
        variation_id: variation_id || null,
        name: product.name,
        quantity,
        price: unitPrice,
        vendor_id: product.user_id,
        image: product.featured_image || null,
      }],
    };

    const { data: order, error: orderError } = await supabase
      .from('product_orders')
      .insert([orderData])
      .select()
      .single();

    if (orderError) {
      // Rollback stock (best effort)
      if (variation_id) {
        await supabase.from('product_variations').update({ stock_quantity: originalVariationStock }).eq('id', variation_id);
      } else {
        await supabase.from('products').update({ stock: product.stock }).eq('id', product_id);
      }
      throw orderError;
    }

    return NextResponse.json({ success: true, booking: order });
  } catch (err) {
    console.error('Booking API error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
