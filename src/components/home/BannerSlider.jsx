'use client';

/**
 * PromoBannersNew — Demo showcase for the BannerSlider system.
 *
 * Demonstrates:
 *   1. Image-based slides (transparent PNG / product images)
 *   2. Icon-based slides (Lucide icons)
 *   3. Mixed-variant auto-detection
 *   4. Full prop API
 *
 * Replace the sample data arrays below with your own content,
 * or pass custom `items` from a parent page / CMS fetch.
 */

import BannerSlider from '@/components/ui/BannerSlider';

/* ────────────────────────────────────────────────────────────
   SAMPLE DATA — Image banners
   Use transparent PNGs for `image` to get the drop-shadow glow effect.
   ──────────────────────────────────────────────────────────── */
export const IMAGE_BANNERS = [
  {
    id: 'flash-deals',
    badge: '🔥 Flash Sale — Ends Tonight',
    subtitle: 'Time-Limited Offers',
    title: 'Grab the Moment',
    description:
      'Hourly flash discounts across Uganda. Once the clock hits zero, the deal disappears forever.',
    cta:  { label: 'Shop Live Deals', href: '/products?sort=discount' },
    cta2: { label: 'See All', href: '/products' },
    image: '/images/img4.png',
    imageSide: 'right',
    accent: '#FF4D00',
    accentLight: 'rgba(255,77,0,0.15)',
    bgFrom: '#FF4D00',
    bgTo: '#1a0800',
    textColor: '#fff',
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
    image: '/images/img3.png',
    imageSide: 'right',
    accent: '#7B2FF7',
    accentLight: 'rgba(123,47,247,0.15)',
    bgFrom: '#7B2FF7',
    bgTo: '#0d0018',
    textColor: '#fff',
  },
  {
    id: 'nearby',
    badge: '📍 Hyper-Local',
    subtitle: 'Near You Now',
    title: 'Hot Sales in Your City',
    description:
      'Find heavily discounted products available for immediate pickup in your neighbourhood.',
    cta:  { label: 'Find Nearby Deals', href: '/near-me' },
    image: '/images/img2.png',
    imageSide: 'right',
    accent: '#00B87A',
    accentLight: 'rgba(0,184,122,0.15)',
    bgFrom: '#00B87A',
    bgTo: '#001a10',
    textColor: '#fff',
  },
  {
    id: 'new-arrivals',
    badge: '✨ Just Dropped',
    subtitle: 'New This Week',
    title: 'Fresh Arrivals Daily',
    description:
      'New products added every day — be the first to snag the best prices before they fly.',
    cta:  { label: 'See New Arrivals', href: '/products?sort=newest' },
    cta2: { label: 'Set Alert', href: '/notifications' },
    image: '/images/img1.png',
    imageSide: 'right',
    accent: '#FFB800',
    accentLight: 'rgba(255,184,0,0.15)',
    bgFrom: '#FFB800',
    bgTo: '#1a1200',
    textColor: '#fff',
  },
];

/* ────────────────────────────────────────────────────────────
   SAMPLE DATA — Icon banners
   ──────────────────────────────────────────────────────────── */
export const ICON_BANNERS = [
  {
    id: 'icon-urgency',
    badge: '⚡ Live Urgency Scores',
    subtitle: 'Real-Time Ranking',
    title: 'Deals Ranked by Urgency',
    description:
      'Our live urgency algorithm surfaces the deals expiring soonest with the deepest discounts — updated every minute.',
    cta:  { label: 'See Leaderboard', href: '/products?sort=urgency' },
    cta2: { label: 'Learn How', href: '/how-it-works' },
    icon: 'Zap',
    iconSize: 72,
    accent: '#FF4D00',
    accentLight: 'rgba(255,77,0,0.18)',
    bgFrom: '#FF4D00',
    bgTo: '#0f0500',
    textColor: '#fff',
    stats: [
      { value: '12K+', label: 'Active Deals' },
      { value: '37%', label: 'Avg Discount' },
    ],
    features: [
      { icon: 'Clock', text: 'Real-time countdown on every listing' },
      { icon: 'TrendingUp', text: 'Urgency score updated live' },
      { icon: 'BellRing', text: 'Watchlist push notifications' },
    ],
  },
  {
    id: 'icon-wallet',
    badge: '💰 Smart Savings',
    subtitle: 'Price Intelligence',
    title: 'Never Overpay Again',
    description:
      'TickToss compares prices across all vendors in real-time so you always land the sharpest deal.',
    cta:  { label: 'Compare Prices', href: '/compare' },
    icon: 'Wallet',
    iconSize: 72,
    accent: '#FFB800',
    accentLight: 'rgba(255,184,0,0.18)',
    bgFrom: '#c98000',
    bgTo: '#0f0a00',
    textColor: '#fff',
    stats: [
      { value: 'UGX', label: 'Local Currency' },
      { value: '284', label: 'Vendors' },
    ],
    features: [
      { icon: 'BarChart2', text: 'Price history charts' },
      { icon: 'RefreshCw', text: 'Live vendor stock sync' },
      { icon: 'ShieldCheck', text: 'Verified seller reviews' },
    ],
  },
  {
    id: 'icon-location',
    badge: '📍 Hyper-Local',
    subtitle: 'Kampala & Beyond',
    title: 'Deals Right Where You Are',
    description:
      'Browse deals available for immediate pickup near your location. No delivery wait, no shipping fees.',
    cta:  { label: 'Open Map View', href: '/near-me' },
    icon: 'MapPin',
    iconSize: 72,
    accent: '#00D084',
    accentLight: 'rgba(0,208,132,0.18)',
    bgFrom: '#006040',
    bgTo: '#001a10',
    textColor: '#fff',
    stats: [
      { value: '50+', label: 'Cities' },
      { value: '< 5km', label: 'Radius' },
    ],
    features: [
      { icon: 'Navigation', text: 'Filter by distance' },
      { icon: 'Store', text: 'Walk-in pickup supported' },
      { icon: 'Phone', text: 'Click-to-call vendors' },
    ],
  },
  {
    id: 'icon-vendor',
    badge: '🚀 Free to Start',
    subtitle: 'For Sellers',
    title: 'List. Discount. Sell Fast.',
    description:
      'Join 284+ vendors already selling on TickToss. Set a price, add a deadline, and watch buyers compete.',
    cta:  { label: 'Become a Vendor', href: '/apply-vendor' },
    cta2: { label: 'See Plans', href: '/pricing' },
    icon: 'Store',
    iconSize: 72,
    accent: '#7B2FF7',
    accentLight: 'rgba(123,47,247,0.18)',
    bgFrom: '#3d0095',
    bgTo: '#0d0018',
    textColor: '#fff',
    stats: [
      { value: '284', label: 'Vendors' },
      { value: '812', label: 'Sales Today' },
    ],
    features: [
      { icon: 'PlusCircle', text: 'Free product listings' },
      { icon: 'BarChart3', text: 'Live sales dashboard' },
      { icon: 'MessageCircle', text: 'Buyer messaging built-in' },
    ],
  },
];

/* ────────────────────────────────────────────────────────────
   SAMPLE DATA — Mixed (auto-variant detection)
   ──────────────────────────────────────────────────────────── */
const MIXED_BANNERS = [IMAGE_BANNERS[0], ICON_BANNERS[0], IMAGE_BANNERS[2], ICON_BANNERS[2]];

/* ────────────────────────────────────────────────────────────
   Component
   ──────────────────────────────────────────────────────────── */
export default function PromoBannersNew() {
  return (
    <div className="tt-container tt-container-padding" style={{ paddingTop: '1.5rem', paddingBottom: '1.5rem' }}>

      {/* ── Section 1: Image banners (primary hero) ── */}
      <BannerSlider
        items={IMAGE_BANNERS}
        variant="image"
        slideHeight="clamp(240px, 40vw, 380px)"
        interval={5000}
        autoPlay
        showArrows
        showDots
      />

      {/* ── Spacer ── */}
      <div style={{ height: '1.5rem' }} />

      {/* ── Section 2: Icon banners (feature highlights) ── */}
      <BannerSlider
        items={ICON_BANNERS}
        variant="icon"
        slideHeight="clamp(220px, 38vw, 340px)"
        interval={6000}
        autoPlay
        showArrows
        showDots
      />

    </div>
  );
}
