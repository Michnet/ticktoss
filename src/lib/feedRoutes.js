/**
 * Route patterns inside the (feed) shell that render their own fixed
 * mobile bottom bar (e.g. the product detail page's sticky Book Now CTA).
 * The shell's own MobileTabBar defers to them instead of stacking on top.
 */
const OWN_MOBILE_BAR_PATTERNS = [
  /^\/products\/[^/]+\/?$/, // /products/[slug] — not the /products listing itself
];

export function pageHasOwnMobileBar(pathname) {
  if (!pathname) return false;
  return OWN_MOBILE_BAR_PATTERNS.some((re) => re.test(pathname));
}
