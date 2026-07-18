import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// Restores `qty` units of stock for one order item — to the variation's
// stock if the item was booked with a variation, otherwise the parent
// product's stock.
async function restoreItemStock(supabase, item, qty) {
  if (!qty) return;

  if (item.variation_id) {
    const { data: variation } = await supabase
      .from('product_variations')
      .select('stock_quantity')
      .eq('id', item.variation_id)
      .single();
    if (variation) {
      await supabase
        .from('product_variations')
        .update({ stock_quantity: variation.stock_quantity + qty })
        .eq('id', item.variation_id);
    }
    return;
  }

  const { data: product } = await supabase
    .from('products')
    .select('stock')
    .eq('id', item.product_id)
    .single();
  if (product) {
    await supabase
      .from('products')
      .update({ stock: product.stock + qty })
      .eq('id', item.product_id);
  }
}

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

    const { order_id, new_status, cancel_reason, resolution } = await request.json();

    if (!order_id || (!new_status && !resolution)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch the order to verify ownership
    const { data: order, error: fetchError } = await supabase
      .from('product_orders')
      .select('id, vendor_id, user_id, status, product_id, variation_id, quantity, items')
      .eq('id', order_id)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const isVendor = order.vendor_id === user.id;
    const isBuyer = order.user_id === user.id;

    if (!isVendor && !isBuyer) {
      return NextResponse.json({ error: 'Unauthorized to modify this order' }, { status: 403 });
    }

    const orderItems = Array.isArray(order.items) && order.items.length
      ? order.items
      : [{ product_id: order.product_id, variation_id: order.variation_id, quantity: order.quantity || 1 }];

    // ── Per-item resolution: only the vendor can conclude a `processing`
    // order this way, splitting each line item into completed vs cancelled
    // quantities. This is what makes "1 of 2 shipped, 1 cancelled" possible.
    if (resolution) {
      if (!isVendor) {
        return NextResponse.json({ error: 'Only the vendor can resolve an order' }, { status: 403 });
      }
      if (order.status !== 'processing') {
        return NextResponse.json({ error: 'Only processing orders can be resolved' }, { status: 400 });
      }

      const submittedItems = Array.isArray(resolution.items) ? resolution.items : [];
      const resolvedItems = [];
      let anyCompleted = false;

      for (const orderItem of orderItems) {
        const submitted = submittedItems.find(
          (i) => String(i.product_id) === String(orderItem.product_id) &&
            (i.variation_id ?? null) === (orderItem.variation_id ?? null)
        );
        const quantity = orderItem.quantity || 1;
        const completedQty = Math.max(0, Number(submitted?.completed_qty) || 0);
        const cancelledQty = Math.max(0, Number(submitted?.cancelled_qty) || 0);

        if (completedQty + cancelledQty !== quantity) {
          return NextResponse.json({
            error: `Resolved quantities for "${orderItem.name || orderItem.product_id}" must add up to ${quantity}`
          }, { status: 400 });
        }

        if (completedQty > 0) anyCompleted = true;
        if (cancelledQty > 0) {
          await restoreItemStock(supabase, orderItem, cancelledQty);
        }

        resolvedItems.push({
          product_id: orderItem.product_id,
          variation_id: orderItem.variation_id ?? null,
          quantity,
          completed_qty: completedQty,
          cancelled_qty: cancelledQty,
          cancel_reason: cancelledQty > 0 ? (submitted?.cancel_reason || '') : null,
        });
      }

      const updatePayload = {
        status: anyCompleted ? 'completed' : 'cancelled',
        resolution: { resolved_at: new Date().toISOString(), items: resolvedItems },
        updated_at: new Date().toISOString(),
      };

      const { data: updatedOrder, error: updateError } = await supabase
        .from('product_orders')
        .update(updatePayload)
        .eq('id', order_id)
        .select()
        .single();

      if (updateError) throw updateError;

      return NextResponse.json({ success: true, order: updatedOrder });
    }

    // ── Simple whole-order transitions: accepting a pending order, or
    // cancelling one outright before any per-item resolution ever
    // happened. Cancelling/completing a `processing` order goes through
    // the resolution path above instead.
    if (isBuyer && !isVendor) {
      if (new_status !== 'cancelled') {
        return NextResponse.json({ error: 'Buyers can only cancel orders' }, { status: 403 });
      }
    }

    if (new_status === 'processing') {
      if (order.status !== 'pending') {
        return NextResponse.json({ error: 'Only pending orders can be accepted' }, { status: 400 });
      }
    } else if (new_status === 'cancelled') {
      if (order.status !== 'pending') {
        return NextResponse.json({ error: 'Only pending orders can be cancelled this way — resolve the order instead' }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: 'Unsupported status transition' }, { status: 400 });
    }

    if (new_status === 'cancelled') {
      for (const item of orderItems) {
        await restoreItemStock(supabase, item, item.quantity || 1);
      }
    }

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
