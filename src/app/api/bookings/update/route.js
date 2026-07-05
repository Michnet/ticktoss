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
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { order_id, new_status, cancel_reason } = await request.json();

    if (!order_id || !new_status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch the order to verify ownership
    const { data: order, error: fetchError } = await supabase
      .from('product_orders')
      .select('id, vendor_id, user_id, status, product_id, quantity')
      .eq('id', order_id)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Only the vendor or the buyer can update this order (usually buyer can only cancel)
    const isVendor = order.vendor_id === user.id;
    const isBuyer = order.user_id === user.id;

    if (!isVendor && !isBuyer) {
      return NextResponse.json({ error: 'Unauthorized to modify this order' }, { status: 403 });
    }

    // If buyer is updating, they can ONLY cancel pending orders
    if (isBuyer && !isVendor) {
      if (new_status !== 'cancelled') {
        return NextResponse.json({ error: 'Buyers can only cancel orders' }, { status: 403 });
      }
      if (order.status !== 'pending') {
        return NextResponse.json({ error: 'Only pending orders can be cancelled' }, { status: 400 });
      }
    }

    // If cancelling, we need to return stock
    if (new_status === 'cancelled' && order.status !== 'cancelled') {
      const { data: product } = await supabase
        .from('products')
        .select('stock')
        .eq('id', order.product_id)
        .single();
        
      if (product) {
        await supabase
          .from('products')
          .update({ stock: product.stock + order.quantity })
          .eq('id', order.product_id);
      }
    }

    // Update the order
    const updatePayload = {
      status: new_status,
      updated_at: new Date().toISOString()
    };

    if (new_status === 'cancelled') {
      updatePayload.cancelled_by = isVendor ? 'vendor' : 'buyer';
      updatePayload.cancel_reason = cancel_reason || '';
    }

    const { data: updatedOrder, error: updateError } = await supabase
      .from('product_orders')
      .update(updatePayload)
      .eq('id', order_id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (err) {
    console.error('Update booking API error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
