import Navbar from '@/components/layout/Navbar';
import HomeFeedShell from '@/components/home-feed/HomeFeedShell';
import FeedLeftNav from '@/components/home-feed/FeedLeftNav';
import FeedRightRail from '@/components/home-feed/FeedRightRail';

/**
 * The Facebook-style shell (left nav rail, feed, right widget rail, mobile
 * tab bar) — now the root chrome for every consumer-facing browsing route:
 * home feed, product listing/detail, near me, notifications, watchlist.
 *
 * Management surfaces (dashboard, vendor, admin, auth, apply-vendor) keep
 * the plain Navbar + Footer chrome from (solid-routes)/layout.js instead —
 * they already ship their own internal layouts and don't fit a narrow
 * feed column.
 */
export default function FeedRoutesLayout({ children }) {
  return (
    <>
      <Navbar variant="solid" />
      <HomeFeedShell leftNav={<FeedLeftNav />} rightRail={<FeedRightRail />}>
        {children}
      </HomeFeedShell>
    </>
  );
}
