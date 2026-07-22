'use client';

import FeedComposerBar from './posts/FeedComposerBar';
import FeedBannerPost from './posts/FeedBannerPost';
import FeedCategoryStripPost from './posts/FeedCategoryStripPost';
import FeedDealSpotlightPost from './posts/FeedDealSpotlightPost';
import FeedEndingSoonPost from './posts/FeedEndingSoonPost';
import FeedProductGridPost from './posts/FeedProductGridPost';
import FeedVendorSpotlightPost from './posts/FeedVendorSpotlightPost';
import FeedVendorCTAPost from './posts/FeedVendorCTAPost';
import BannerSlider from '../ui/BannerSlider';
import { IMAGE_BANNERS } from '../home/BannerSlider';

/**
 * Interleaves product data into a Facebook-style feed rhythm — deliberately
 * varies card shape (single spotlight, grid, list, strip) every 1-2 posts so
 * scrolling never repeats the same layout twice in a row.
 */
export default function HomeFeedStream() {
  return (
    <>
      {/* <FeedBannerPost /> */}
      <BannerSlider items={IMAGE_BANNERS} variant="image" slideHeight="clamp(200px, 32vw, 280px)" interval={5500} autoPlay showArrows showDots />
      <FeedComposerBar />
      <FeedCategoryStripPost />
      
      <section className='flex flex-col lg:flex-row gap-3'>
        <FeedEndingSoonPost />
      <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
        
      <FeedProductGridPost
        source="new"
        avatar="🆕"
        title="New Arrivals"
        meta="Just listed by vendors"
        tag="New"
        tagVariant="flame"
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
        ctaHref="/products?clusters=below-10k"
      />
      </div>
      </section>
      <FeedVendorSpotlightPost />
      <FeedProductGridPost
        source="upcoming"
        avatar="🔜"
        title="Coming Soon"
        meta="Set a reminder before these go live"
        tag="Upcoming"
        tagVariant="gold"
        ctaHref="/products?sort=upcoming"
        counterLabel="Starts: "
        startDate
      />
      <FeedVendorCTAPost />

      <div className="text-center py-6">
        <p className="text-[0.8rem] text-[var(--tt-muted)] mb-3">You&apos;re all caught up 🎉</p>
        <a href="/products" className="tt-btn tt-btn-ghost text-[0.85rem]">
          Browse the full catalog →
        </a>
      </div>
    </>
  );
}
