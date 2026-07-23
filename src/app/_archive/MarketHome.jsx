//import HeroSection from '@/components/home/HeroSection';
import LiveTicker from '@/components/home/LiveTicker';
//import PromoBanners from '@/components/home/PromoBanners';
import CategoryGrid from '@/components/home/CategoryGrid';
import FeaturedProducts from '@/components/home/FeaturedProducts';
//import LiveUrgencyList from '@/components/home/LiveUrgencyList';
//import NewArrivals from '@/components/home/NewArrivals';
import FeaturedVendors from '@/components/home/FeaturedVendors';
import MidPageCTA from '@/components/home/MidPageCTA';
import TagCloud from '@/components/home/TagCloud';
import HowItWorks from '@/components/home/HowItWorks';
//import PromoBanners2 from '@/components/home/PromoBanners2';
import { IMAGE_BANNERS } from '@/components/home/BannerSlider';
import ProductsView from '@/components/home/ProductsView';
import BannerSlider from '@/components/ui/BannerSlider';
import ClustersView from '@/components/home/ClustersView';
import FeedEndingSoonPost from '@/components/home-feed/posts/FeedEndingSoonPost';
import FeedProductGridPost from '@/components/home-feed/posts/FeedProductGridPost';
import FeedComposerBar from '@/components/home-feed/posts/FeedComposerBar';
import FeedVendorSpotlightPost from '@/components/home-feed/posts/FeedVendorSpotlightPost';
//import PromoBanners3 from '@/components/home/PromoBanners3';
//import PromoBanners4 from '@/components/home/PromoBanners4';

// Statically generate the home page; revalidate via ISR every hour.
//export const revalidate = 3600;

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

export default function OldHomePage() {
  return (
    <main className='page-content space-y-2 md:space-y-6'>
      {/* ── 1. Promo banners + quick-access tiles ────── */}
      
      {/* <section className="md:py-4">
      <div className="tt-container md:px-5 grid grid-cols-1 md:grid-cols-[auto_300px] lg:grid-cols-[auto_400px] gap-3 md:gap-6">
        <BannerSlider
                items={IMAGE_BANNERS}
                variant="image"
                slideHeight="clamp(240px, 40vw, 380px)"
                interval={5000}
                autoPlay
                showArrows
                showDots
              />

        <div className="hidden md:grid grid-cols-2 md:grid-cols-2 gap-2 sm:gap-4">
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
    </section> */}
      <section className="tt-container tt-container-padding">
        <BannerSlider
                items={IMAGE_BANNERS}
                variant="image"
                slideHeight="clamp(240px, 40vw, 380px)"
                interval={5000}
                autoPlay
                showArrows
                showDots
              />
    </section>
     {/*  <PromoBanners2 /> */}

      {/* ── . Hero ─────────────────────────────────── */}
      {/* <HeroSection /> */}
      <div className='tt-container-padding'>
        
      <FeedComposerBar />

      </div>

      {/* ── 2. Live news ticker ──────────────────────── */}
      <div className="tt-container">
        <LiveTicker />
      </div>

      {/* ── 4. Category grid ─────────────────────────── */}
      <CategoryGrid carousel rows={2}/>

      {/* ── 5. Featured deals ────────────────────────── */}
      <FeaturedProducts />

      {/* ── 6. Mid-page split CTA ────────────────────── */}
      <MidPageCTA />

      <section className='flex flex-col lg:flex-row gap-3 tt-container-padding'>
              <FeedEndingSoonPost />
            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
              
            <FeedProductGridPost
              source="new"
              avatar="🆕"
              title="New Arrivals"
              meta="Just listed by vendors"
              tag="New"
              tagVariant="flame"
              limit={2}
              ctaHref="/products?sort=new"
            />
            <FeedProductGridPost
              source="custom"
              filters={['below-10k']}
              avatar="💸"
              title="Budget Finds"
              meta="Great deals under UGX 10,000"
              tag="Under 10k"
              tagVariant="success"
              limit={2}
              ctaHref="/products?clusters=below-10k"
            />
            </div>
            </section>

      {/* ── 7. Live urgency leaderboard list ─────────── */}
      <style>{`
        @media (max-width: 900px) {
          .urgency-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      {/* <div className="urgency-grid grid lg:grid-cols-[minmax(0,1fr)_360px] mb-4 lg:mb-6 gap-6 max-w-[1280px] mx-auto px-3">
          <LiveUrgencyList />
        </div> */}
      <section className="tt-container tt-container-padding mb-6">
        <ProductsView cardWidth='150px' itemExClass='flex flex-col' />
      </section>
      {/* <section  className="tt-container tt-container-padding mb-6">
        <ProductsView cardWidth='320px' cardType={1} title="Ending" subTitle='Soon' description= 'Make the last minute save now'
          source="custom"
          filters={['ending-soon']} itemExClass='flex flex-col' />
      </section> */}
      {/* ── 8. New arrivals ───────────────────────────── */}
      {/* <NewArrivals /> */}

      <ClustersView groups={['ending', 'below-10k']} />

      {/* ── 9. Tag cloud ─────────────────────────────── */}
      <TagCloud />

      {/* ── 10. Featured vendors ──────────────────────── */}
      <FeaturedVendors />
      <FeedVendorSpotlightPost />

      <div className="text-center py-6">
        <a href="/products" className="tt-btn tt-btn-ghost text-[0.85rem]">
          Let's go shopping →
        </a>
      </div>

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
    </main>
  );
}
