'use client';

import { useQuery } from '@tanstack/react-query';

const VENDOR_STYLES = [
  { accent: '#4C8BFF', bg: 'linear-gradient(135deg, #0D1040 0%, #0D0D20 100%)' },
  { accent: '#FF6B9D', bg: 'linear-gradient(135deg, #300D1E 0%, #1E0D14 100%)' },
  { accent: '#00E87A', bg: 'linear-gradient(135deg, #0D2510 0%, #0D1A0D 100%)' },
  { accent: '#9B6BFF', bg: 'linear-gradient(135deg, #1A0D30 0%, #130D1E 100%)' },
];

// ── Query key factory ──
export const vendorKeys = {
  all: ['vendors'],
  featured: (limit) => ['vendors', 'featured', limit],
  directory: (filters) => ['vendors', 'directory', filters],
};

/**
 * Fetch top vendors ranked by active published listings, via /api/vendors.
 * Cosmetic display fields (badge/accent/bg) are derived here, not by the API.
 */
async function fetchFeaturedVendors(limit) {
  const res = await fetch(`/api/vendors?intent=featured&limit=${limit}`);
  if (!res.ok) throw new Error('Failed to load vendors');

  const { vendors } = await res.json();

  return (vendors ?? []).map((v, i) => {
    const style = VENDOR_STYLES[i % VENDOR_STYLES.length];
    return {
      ...v,
      badge: i === 0 ? 'Top Vendor' : v.hasFlashSale ? 'Flash Seller' : 'Trusted',
      badgeColor: style.accent,
      accent: style.accent,
      bg: style.bg,
    };
  });
}

export function useFeaturedVendors(limit = 4) {
  return useQuery({
    queryKey: vendorKeys.featured(limit),
    queryFn: () => fetchFeaturedVendors(limit),
    staleTime: 5 * 60 * 1000, // vendor roster/stats change slowly
    gcTime: 30 * 60 * 1000,
  });
}

/**
 * Fetch the full vendor directory (search + sort), via /api/vendors.
 * Includes each vendor's raw `orderStats` (profiles.order_stats) for display.
 */
async function fetchVendorDirectory({ search, sort } = {}) {
  const params = new URLSearchParams({ intent: 'directory' });
  if (search) params.set('search', search);
  if (sort) params.set('sort', sort);

  const res = await fetch(`/api/vendors?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to load vendors');

  const { vendors } = await res.json();

  return (vendors ?? []).map((v, i) => {
    const style = VENDOR_STYLES[i % VENDOR_STYLES.length];
    return {
      ...v,
      badge: v.hasFlashSale ? 'Flash Seller' : v.verified ? 'Trusted' : null,
      badgeColor: style.accent,
      accent: style.accent,
      bg: style.bg,
    };
  });
}

export function useVendors(filters = {}) {
  return useQuery({
    queryKey: vendorKeys.directory(filters),
    queryFn: () => fetchVendorDirectory(filters),
    staleTime: 2 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
