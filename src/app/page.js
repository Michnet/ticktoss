//import HeroSection from '@/components/home/HeroSection';
import LiveTicker from '@/components/home/LiveTicker';
//import PromoBanners from '@/components/home/PromoBanners';
import CategoryGrid from '@/components/home/CategoryGrid';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import LiveUrgencyList from '@/components/home/LiveUrgencyList';
import NewArrivals from '@/components/home/NewArrivals';
import FeaturedVendors from '@/components/home/FeaturedVendors';
import MidPageCTA from '@/components/home/MidPageCTA';
import TagCloud from '@/components/home/TagCloud';
import HowItWorks from '@/components/home/HowItWorks';
//import PromoBanners2 from '@/components/home/PromoBanners2';
import { IMAGE_BANNERS } from '@/components/home/BannerSlider';
import ProductsView from '@/components/home/ProductsView';
import BannerSlider from '@/components/ui/BannerSlider';
import ClustersView from '@/components/home/ClustersView';
//import PromoBanners3 from '@/components/home/PromoBanners3';
//import PromoBanners4 from '@/components/home/PromoBanners4';

export const metadata = {
  title: 'TickToss — Uganda\'s Urgency Marketplace | Deals on a Clock',
  description:
    'Discover urgency-discounted products across Uganda. Every deal has a countdown — book before time runs out. Electronics, fashion, food, home & more.',
  keywords: [
    'Uganda deals', 'discounted products Uganda', 'marketplace Uganda',
    'flash sale Kampala', 'urgency deals', 'TickToss',
  ],
  openGraph: {
    title: 'TickToss — Deals on a Clock',
    description: 'Uganda\'s urgency marketplace. Every listing is time-limited — the best deals rise to the top.',
    type: 'website',
  },
};

export default function HomePage() {
  return (
    <div>
      {/* ── 1. Promo banners + quick-access tiles ────── */}
      
      <section className="pb-8 pt-4">
      <div className="tt-container tt-container-padding grid grid-cols-1 md:grid-cols-[auto_300px] lg:grid-cols-[auto_400px] gap-3 md:gap-6">
        <BannerSlider
                items={IMAGE_BANNERS}
                variant="image"
                slideHeight="clamp(240px, 40vw, 380px)"
                interval={5000}
                autoPlay
                showArrows
                showDots
              />

        {/* Mini highlight cards */}
        <div className="grid grid-cols-2 md:grid-cols-2 gap-3 md:gap-4">
          {[
            { icon: '🏷️', title: 'Discount Deals', sub: 'Time-limited offers' },
            { icon: '🛡️', title: 'Compare Prices', sub: 'Find the best deals' },
            { icon: '↩️', title: 'Location search', sub: 'Find deals near you' },
            { icon: '💬', title: 'Quality Products', sub: 'Buy from top vendors' },
          ].map((feature, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-[var(--tt-radius-md)] p-3 md:p-4 flex flex-col items-center text-center border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow justify-center">
              <span className="text-2xl mb-2">{feature.icon}</span>
              <h3 className="font-bold text-[0.85rem] md:text-[0.9rem] text-gray-900 dark:text-white leading-tight">{feature.title}</h3>
              <p className="text-[0.75rem] text-gray-500 dark:text-gray-400 mt-1">{feature.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
     {/*  <PromoBanners2 /> */}

      {/* ── . Hero ─────────────────────────────────── */}
      {/* <HeroSection /> */}

      {/* ── 2. Live news ticker ──────────────────────── */}
      <div className="tt-container">
        <LiveTicker />
      </div>

      {/* ── 4. Category grid ─────────────────────────── */}
      <CategoryGrid />

      {/* ── 5. Featured deals ────────────────────────── */}
      <FeaturedProducts cardWidth='200px' />

      {/* ── 6. Mid-page split CTA ────────────────────── */}
      <MidPageCTA />

      {/* ── 7. Live urgency leaderboard list ─────────── */}
      <style>{`
        @media (max-width: 900px) {
          .urgency-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <div className="urgency-grid grid lg:grid-cols-[minmax(0,1fr)_360px] mb-4 lg:mb-6 gap-6 max-w-[1280px] mx-auto px-3">
        {/* Live urgency list (left) */}
        <div className="min-w-0">
          <LiveUrgencyList />
        </div>

        {/* Right sidebar: Tag cloud + mini vendor CTAs */}
        <aside className="flex flex-col gap-6">
          {/* Quick stats panel */}
          <div className="bg-[var(--tt-surface)] border border-[var(--tt-border)] rounded-[var(--tt-radius-lg)] p-5">
            <h3 className="font-['Syne',sans-serif] font-extrabold text-[0.95rem] mb-4">
              📊 Market Snapshot
            </h3>
            <div className="flex flex-col gap-[0.6rem]">
              {[
                { label: 'Active Deals', value: '12,421', icon: '🏷️' },
                { label: 'Ending This Hour', value: '38', icon: '⏰' },
                { label: 'Vendors Online', value: '284', icon: '🟢' },
                { label: 'Bookings Today', value: '812', icon: '📦' },
                { label: 'Avg. Discount', value: '37%', icon: '💰' },
              ].map(({ label, value, icon }) => (
                <div
                  key={label}
                  className="flex justify-between items-center py-[0.4rem] border-b border-[var(--tt-border)]"
                >
                  <span className="text-[0.78rem] text-[var(--tt-muted)] flex items-center gap-[0.4rem]">
                    <span>{icon}</span> {label}
                  </span>
                  <span className="font-['Syne',sans-serif] font-bold text-[0.88rem] text-[var(--tt-text)]">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Urgency legend */}
          <div className="bg-[var(--tt-surface)] border border-[var(--tt-border)] rounded-[var(--tt-radius-lg)] p-5">
            <h3 className="font-['Syne',sans-serif] font-extrabold text-[0.95rem] mb-[0.875rem]">
              🎯 Urgency Score
            </h3>
            <p className="text-[0.75rem] text-[var(--tt-muted)] leading-[1.55] mb-3">
              Products are ranked by a live formula combining discount, time left, and stock scarcity.
            </p>
            {[
              { label: '80–100+', desc: 'Critical — ending very soon', color: 'var(--tt-danger)' },
              { label: '50–79', desc: 'High urgency — act fast', color: 'var(--tt-flame)' },
              { label: '20–49', desc: 'Medium — still a good deal', color: 'var(--tt-gold)' },
              { label: '< 20', desc: 'Low — plenty of time', color: 'var(--tt-success)' },
            ].map(({ label, desc, color }) => (
              <div
                key={label}
                className="flex gap-2 items-start mb-[0.45rem]"
              >
                <span
                  className="inline-block w-[3px] self-stretch rounded-full shrink-0 min-h-[30px]"
                  style={{ background: color }}
                />
                <div>
                  <div className="font-['Syne',sans-serif] font-bold text-[0.78rem]" style={{ color }}>
                    Score {label}
                  </div>
                  <div className="text-[0.7rem] text-[var(--tt-muted)]">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
      <section className="tt-container tt-container-padding mb-6">
        <ProductsView cardWidth='150px' itemExClass='flex flex-col' />
      </section>
      <section  className="tt-container tt-container-padding mb-6">
        <ProductsView cardWidth='320px' cardType={1} title="Ending" subTitle='Soon' description= 'Make the last minute save now'
          source="custom"
          filters={['ending-soon']} itemExClass='flex flex-col' />
      </section>
      {/* ── 8. New arrivals ───────────────────────────── */}
      <NewArrivals />

      <ClustersView groups={['ending', 'below-10k']} />

      {/* ── 9. Tag cloud ─────────────────────────────── */}
      <TagCloud />

      {/* ── 10. Featured vendors ──────────────────────── */}
      <FeaturedVendors />

      {/* ── 11. How it works ──────────────────────────── */}
      <HowItWorks />

      {/* ── 12. Bottom CTA ────────────────────────────── */}
      <section className="py-16 bg-[var(--tt-surface-2)] text-center">
        <div className="tt-container">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="tt-badge tt-badge-flame">⚡ Join the market</span>
          </div>
          <h2 className="font-['Syne',sans-serif] font-extrabold text-[clamp(1.5rem,3vw,2.4rem)] mb-3">
            Ready to{' '}
            <span className="bg-[image:var(--tt-gradient-flame)] bg-clip-text text-transparent [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]">
              Sell Fast?
            </span>
          </h2>
          <p className="text-[var(--tt-muted-2)] text-base max-w-[440px] mx-auto mb-8 leading-[1.6]">
            List your products with a discount and a deadline.
            Watch them sell faster than ever.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <a href="/apply-vendor" className="tt-btn tt-btn-primary tt-shimmer px-[2.5rem] py-[0.875rem] text-base">
              Become a Vendor — It&#39;s Free
            </a>
            <a href="/products" className="tt-btn tt-btn-ghost px-[2rem] py-[0.875rem] text-base">
              Browse Deals First
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
