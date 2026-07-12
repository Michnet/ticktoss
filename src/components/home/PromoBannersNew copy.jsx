'use client';

/**
 * PromoBannersNew — Demo showcase for the BannerSlider system.
 *
 * Demonstrates how the SAME items array renders differently
 * depending on which display-control props you pass to BannerSlider:
 *
 *   Slider A — bgImage + fgImage, all text elements
 *   Slider B — bgImage + icon,    no description / features (compact)
 *   Slider C — icon only,         full text with stats & features
 */

import BannerSlider from '@/components/ui/BannerSlider';

/* ────────────────────────────────────────────────────────────
   SHARED ITEMS ARRAY
   Every item carries all three visual-layer properties.
   The parent BannerSlider decides which ones to render.
   ──────────────────────────────────────────────────────────── */
const BANNERS = [
  {
    id: 'flash-deals',
    badge: '🔥 Flash Sale — Ends Tonight',
    subtitle: 'Don\'t Miss Out',
    title: 'Grab the Moment',
    description:
      'Hourly flash discounts across Uganda. Once the clock hits zero, the deal disappears forever.',
    cta:  { label: 'Shop Live Deals', href: '/products?sort=discount' },
    cta2: { label: 'See All', href: '/products' },
    // Three independent visual layers:
    bgImage: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=1400&auto=format&fit=crop',
    fgImage: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=400&auto=format&fit=crop',
    icon: 'Zap',
    iconSize: 72,
    imageSide: 'right',
    accent: '#FF4D00',
    accentLight: 'rgba(255,77,0,0.18)',
    bgOverlay: 'linear-gradient(to right, rgba(20,5,0,0.88) 0%, rgba(180,60,0,0.5) 60%, rgba(0,0,0,0.1) 100%)',
    textColor: '#fff',
    stats: [
      { value: '12K+', label: 'Active Deals' },
      { value: '37%', label: 'Avg Discount' },
    ],
    features: [
      { icon: 'Clock',     text: 'Real-time countdown on every listing' },
      { icon: 'TrendingUp',text: 'Urgency score updated live' },
      { icon: 'BellRing',  text: 'Watchlist push notifications' },
    ],
  },
  {
    id: 'multivendor',
    badge: '🏪 Multivendor Marketplace',
    subtitle: 'Trusted Sellers',
    title: 'Top Vendors Nationwide',
    description:
      'Discover amazing deals from verified local and national vendors. Quality guaranteed.',
    cta:  { label: 'Explore Vendors', href: '/vendors' },
    cta2: { label: 'Sell With Us', href: '/apply-vendor' },
    bgImage: 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?q=80&w=1400&auto=format&fit=crop',
    fgImage: 'https://images.unsplash.com/photo-1600857062241-98e5dba7f954?q=80&w=400&auto=format&fit=crop',
    icon: 'Store',
    iconSize: 72,
    imageSide: 'right',
    accent: '#7B2FF7',
    accentLight: 'rgba(123,47,247,0.18)',
    bgOverlay: 'linear-gradient(to right, rgba(10,0,30,0.90) 0%, rgba(80,20,180,0.50) 60%, rgba(0,0,0,0.10) 100%)',
    textColor: '#fff',
    stats: [
      { value: '284', label: 'Vendors' },
      { value: '812', label: 'Sales Today' },
    ],
    features: [
      { icon: 'ShieldCheck', text: 'Verified seller profiles' },
      { icon: 'Star',        text: 'Buyer ratings & reviews' },
      { icon: 'MessageCircle', text: 'Direct buyer-vendor chat' },
    ],
  },
  {
    id: 'nearby',
    badge: '📍 Hyper-Local',
    subtitle: 'Start Now',
    title: 'Daily Essentials Near You',
    description:
      'Find heavily discounted products available for immediate pickup in your neighbourhood.',
    cta:  { label: 'Find Nearby Deals', href: '/near-me' },
    bgImage: 'https://images.unsplash.com/photo-1555529771-835f59fc5efe?q=80&w=1400&auto=format&fit=crop',
    fgImage: 'https://images.unsplash.com/photo-1622227922682-f1f9f2e95de7?q=80&w=400&auto=format&fit=crop',
    icon: 'MapPin',
    iconSize: 72,
    imageSide: 'right',
    accent: '#00C07A',
    accentLight: 'rgba(0,192,122,0.18)',
    bgOverlay: 'linear-gradient(to right, rgba(0,20,10,0.90) 0%, rgba(0,120,70,0.50) 60%, rgba(0,0,0,0.10) 100%)',
    textColor: '#fff',
    stats: [
      { value: '50+', label: 'Cities' },
      { value: '<5km', label: 'Avg Radius' },
    ],
    features: [
      { icon: 'Navigation', text: 'Filter deals by distance' },
      { icon: 'Store',      text: 'Walk-in pickup supported' },
      { icon: 'Phone',      text: 'Click-to-call vendor' },
    ],
  },
  {
    id: 'vendor-cta',
    badge: '🚀 Free to Start',
    subtitle: 'OTC Items',
    title: "Nature's Best at Your Service",
    description:
      'Join 284+ vendors already selling on TickToss. Set a price, add a deadline, and watch buyers compete.',
    cta:  { label: 'Become a Vendor', href: '/apply-vendor' },
    cta2: { label: 'See Plans', href: '/pricing' },
    bgImage: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1400&auto=format&fit=crop',
    fgImage: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&auto=format&fit=crop',
    icon: 'Leaf',
    iconSize: 72,
    imageSide: 'right',
    accent: '#FFB800',
    accentLight: 'rgba(255,184,0,0.18)',
    bgOverlay: 'linear-gradient(to right, rgba(20,14,0,0.92) 0%, rgba(150,100,0,0.55) 60%, rgba(0,0,0,0.10) 100%)',
    textColor: '#fff',
    stats: [
      { value: '284', label: 'Vendors' },
      { value: 'Free', label: 'Listings' },
    ],
    features: [
      { icon: 'PlusCircle', text: 'Free product listings' },
      { icon: 'BarChart3',  text: 'Live sales dashboard' },
      { icon: 'CreditCard', text: 'Mobile Money payouts' },
    ],
  },
];

/* ────────────────────────────────────────────────────────────
   Component — three slider instances using same BANNERS data
   ──────────────────────────────────────────────────────────── */
export default function PromoBannersNew() {
  return (
    <div className="tt-container tt-container-padding" style={{ paddingTop: '1.5rem', paddingBottom: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/*
        ── Slider A ──────────────────────────────────────
        Classic hero style: bgImage + fgImage PNG, full text
      */}
      <BannerSlider
        items={BANNERS}
        slideHeight="clamp(200px, 38vw, 340px)"
        showBgImage
        showFgImage
        showIcon={false}
        showElements={['badge', 'subtitle', 'title', 'description', 'cta', 'cta2', 'accentBar']}
        mediaAlign="right"
        autoPlay
        interval={5500}
      />

      {/*
        ── Slider B ──────────────────────────────────────
        Compact strip: bgImage + icon, no description
      */}
      <BannerSlider
        items={BANNERS}
        slideHeight="clamp(160px, 28vw, 240px)"
        showBgImage = {false}
        showFgImage={false}
        showIcon
        showElements={['badge', 'subtitle', 'title', 'cta', 'accentBar']}
        mediaAlign="right"
        autoPlay
        interval={4000}
        showDots={false}
      />

    </div>
  );
}
