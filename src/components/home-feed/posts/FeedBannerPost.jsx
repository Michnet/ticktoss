'use client';

import BannerSlider from '@/components/ui/BannerSlider';
import { IMAGE_BANNERS } from '@/components/home/BannerSlider';
import FeedPostCard from '../FeedPostCard';

export default function FeedBannerPost() {
  return (
    <FeedPostCard avatar="⚡" title="TickToss" meta="Promoted" tag="Sponsored" tagVariant="gold" noPadding>
      <div className="px-4 pb-4">
        <BannerSlider
          items={IMAGE_BANNERS}
          variant="image"
          slideHeight="clamp(200px, 32vw, 280px)"
          interval={5500}
          autoPlay
          showArrows
          showDots
        />
      </div>
    </FeedPostCard>
  );
}
