'use client';

import ProductCardAurora from '@/components/product/concepts/ProductCardAurora';
import ProductCardTicket from '@/components/product/concepts/ProductCardTicket';
import ProductCardStory from '@/components/product/concepts/ProductCardStory';
import ProductCardPolaroid from '@/components/product/concepts/ProductCardPolaroid';
import ProductCardFrostBloom from '@/components/product/concepts/ProductCardFrostBloom';
import ProductCardGlass from '@/components/product/concepts/ProductCardGlass';
//import ProductCardCarousel from '@/components/product/concepts/ProductCardCarousel';
import ProductCardCollage from '@/components/product/concepts/ProductCardCollage';
import { useProducts } from '@/lib/hooks/useProducts';

const SECTIONS = [
  /* {
    key: 'aurora',
    title: 'Aurora Glass',
    blurb: 'Magazine-cover poster card — an ambient glow sampled from the blurhash sits behind frosted glass, with a single countdown/discount medallion instead of scattered badges.',
    Card: ProductCardAurora,
  }, */
  {
    key: 'ticket',
    title: 'Ticket Stub',
    blurb: 'The deal as a physical, die-cut ticket — a perforated seam with punch-hole notches splits the "boarding pass" image from the price/countdown stub. On-brand for TickToss.',
    Card: ProductCardTicket,
  },
  {
    key: 'story',
    title: 'Story Reel',
    blurb: 'Instagram-Stories-shaped: segmented dashes cycle through the gallery on hover, and the "posted Xh ago" timestamp slot is repurposed to count down instead of up.',
    Card: ProductCardStory,
  },/* 
  {
    key: 'polaroid',
    title: 'Polaroid Drop',
    blurb: 'A snapped-and-shared polaroid — thick photo frame, a sale sticker slapped on the corner, handwritten-feel caption. Glam over clinical.',
    Card: ProductCardPolaroid,
  }, */
  {
    key: 'frost-bloom',
    title: 'Frost Bloom (glassmorphism)',
    blurb: 'The blurhash decoded large and blurred becomes the card\'s own ambient backdrop — a colorful glow unique to each product — with a spotlight thumbnail and a frosted-glass panel of glass-tile countdown digits floating on top. Maximalist glass.',
    Card: ProductCardFrostBloom,
  },
  {
    key: 'glass',
    title: 'Glass',
    blurb: 'Restrained and catalog-friendly: the photo stays sharp, and a single frosted price tag floats over its corner, tinted with the product\'s own blurhash color instead of generic gray glass.',
    Card: ProductCardGlass,
  },
  /* {
    key: 'carousel',
    title: 'Carousel Deck',
    blurb: 'The gallery as a tappable slide deck — chevrons and dot indicators let a shopper flip through every shot without leaving the grid, unlike Story\'s passive hover-cycle.',
    Card: ProductCardCarousel,
  }, */
  {
    key: 'collage',
    title: 'Photo Collage',
    blurb: 'The whole gallery on display at once: a large spotlight shot with up to three thumbnails beside it. Click a thumbnail to swap the spotlight — nothing hidden behind hover or swipe.',
    Card: ProductCardCollage,
  },
];

export default function CardConceptsPage() {
  const { data: products, isLoading, error } = useProducts({ limit: 6, orderBy: 'newest', clusters:['below-10k'] });

  return (
    <div className="tt-container tt-container-padding flex flex-col gap-16 py-10 mb-3">
      <div>
        <h1 className="tt-section-title text-2xl">Product Card <span>Concepts</span></h1>
        <p className="mt-1 text-sm text-[var(--tt-muted)]">
          Eight directions for the individual product card, using the same set of real published products (varying urgency, stock and images) throughout so they're easy to compare.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="tt-skeleton" style={{ height: '360px' }} />
          ))}
        </div>
      ) : error ? (
        <div className="tt-card tt-glass" style={{ padding: '2rem', textAlign: 'center', color: 'var(--tt-danger)' }}>
          Error loading products: {error.message}
        </div>
      ) : !products?.length ? (
        <div className="tt-card tt-glass" style={{ padding: '2rem', textAlign: 'center' }}>
          No published products to preview with yet.
        </div>
      ) : (
        SECTIONS.map(({ key, title, blurb, Card }) => (
          <section key={key} className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-bold text-[var(--tt-text)]">{title}</h2>
              <p className="max-w-2xl text-sm text-[var(--tt-muted)]">{blurb}</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
              {products.map((product, i) => (
                <Card key={product.id} product={product} index={i} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
