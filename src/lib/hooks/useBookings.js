'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import useAppStore from '@/store/useAppStore';

const supabase = getSupabaseBrowserClient();

async function fetchBookings(userId, role = 'buyer') {
  const field = role === 'vendor' ? 'vendor_id' : 'user_id';
  const { data, error } = await supabase
    .from('product_orders')
    .select(`
      id, status, quantity, unit_price, payment_method,
      shipping_address, created_at, updated_at,
      cancelled_by, cancel_reason,
      products(id, name, slug, featured_image, sale_price),
      profiles!user_id(display_name, phone)
    `)
    .eq(field, userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export function useBookings(userId, role = 'buyer') {
  return useQuery({
    queryKey: ['bookings', role, userId],
    queryFn: () => fetchBookings(userId, role),
    enabled: !!userId,
    staleTime: 10 * 1000,
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  const { addToast } = useAppStore();

  return useMutation({
    mutationFn: async (bookingData) => {
      const res = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Booking failed');
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      addToast({ type: 'success', message: 'Booking confirmed! The vendor will contact you shortly.' });
    },
    onError: (err) => {
      addToast({ type: 'error', message: err.message });
    },
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  const { addToast } = useAppStore();

  return useMutation({
    mutationFn: async ({ bookingId, reason }) => {
      const res = await fetch('/api/bookings/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, reason }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Cancellation failed');
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      addToast({ type: 'info', message: 'Booking cancelled. Stock has been restored.' });
    },
    onError: (err) => {
      addToast({ type: 'error', message: err.message });
    },
  });
}

/**
 * Vendor: update booking status
 */
export function useUpdateBookingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ bookingId, status }) => {
      const { error } = await supabase
        .from('product_orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', bookingId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
  });
}
