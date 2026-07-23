//import LiveTicker from '@/components/home/LiveTicker';
//import HomeFeedStream from '@/components/home-feed/HomeFeedStream';
import OldHomePage from '../_archive/MarketHome';

// Statically generate the home feed; revalidate via ISR every hour.
export const revalidate = 3600;

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
    <>  
      <OldHomePage/>
      {/* <HomeFeedStream /> */}
    </>
  );
}
