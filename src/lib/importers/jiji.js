// Migration adapter for importing a vendor's existing listings from Jiji.ug
// into the bulk-add draft sandbox. Jiji's storefront pages are gated behind
// a `/sellerpage-<id>` link (found on any of the seller's individual listing
// pages), which feeds their public gallery API — no scraping of rendered
// HTML is needed once that id is known.

const IMAGE_HOST_ALLOWLIST = ['jijistatic.com'];

export function isJijiUrl(url) {
  try {
    return new URL(url).hostname.endsWith('jiji.ug');
  } catch {
    return false;
  }
}

export function isAllowedImageHost(hostname) {
  return IMAGE_HOST_ALLOWLIST.some(h => hostname === h || hostname.endsWith(`.${h}`));
}

async function extractUserId(profileUrl) {
  const parsed = new URL(profileUrl);

  // Already a listing-API URL (e.g. a `next_url` handed back from a previous import call)
  const qpUserId = parsed.searchParams.get('user_id');
  if (qpUserId) return qpUserId;

  // A seller page URL — /sellerpage-<id>
  const sellerMatch = parsed.pathname.match(/\/sellerpage-([A-Za-z0-9_-]+)/);
  if (sellerMatch) return sellerMatch[1];

  // Otherwise assume it's an individual listing page and scrape the
  // "seller's other ads" link embedded in it.
  const res = await fetch(profileUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error('Could not open that Jiji page.');
  const html = await res.text();
  const scraped = html.match(/\/sellerpage-([A-Za-z0-9_-]+)/);
  if (!scraped) {
    throw new Error("Couldn't find a seller ID on that page. Try pasting your Jiji seller page link (jiji.ug/sellerpage-...) instead.");
  }
  return scraped[1];
}

function mapAdvert(advert, priceMode) {
  const price = advert.price_obj?.value ?? null;
  const imageUrl = advert.images?.[0]?.url;

  // Jiji listings only carry a single price. The vendor tells us up front
  // whether that number should land in `price` (regular, no discount yet)
  // or `sale_price` (already discounted, regular price still needed).
  const priceFields = priceMode === 'sale_price'
    ? { price: null, sale_price: price }
    : { price, sale_price: null };

  return {
    name: advert.title || '',
    short_description: advert.short_description || advert.details || '',
    ...priceFields,
    stock: 1,
    duration_hours: 24,
    featured_image: imageUrl ? { url: imageUrl, external: true } : null,
    pickup_lat: null,
    pickup_lng: null,
    pickup_address: advert.region_name || null,
  };
}

/**
 * Fetch and normalize a Jiji seller's listings into draft-product shape.
 * @param {string} profileUrl - a seller page URL, a listing page URL, or a listing-API URL (for pagination)
 * @param {{ maxPages?: number, priceMode?: 'price'|'sale_price' }} options
 */
export async function fetchJijiListings(profileUrl, { maxPages = 3, priceMode = 'price' } = {}) {
  const userId = await extractUserId(profileUrl);

  let pageUrl = profileUrl.includes('/api_web/v1/listing')
    ? profileUrl
    : `https://jiji.ug/api_web/v1/listing?user_id=${encodeURIComponent(userId)}&webp=false&page=1`;

  const adverts = [];
  let nextUrl = null;
  let pagesFetched = 0;

  while (pageUrl && pagesFetched < maxPages) {
    const res = await fetch(pageUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) break;
    const data = await res.json();
    adverts.push(...(data?.adverts_list?.adverts || []));
    pagesFetched++;
    nextUrl = data?.next_url || null;
    pageUrl = nextUrl;
  }

  return {
    products: adverts.map(advert => mapAdvert(advert, priceMode)),
    hasMore: !!nextUrl,
    nextUrl,
  };
}
