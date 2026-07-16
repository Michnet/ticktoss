'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ArrowLeft, Share2, Heart, X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { useProduct, useProducts, useProductLike } from '@/lib/hooks/useProducts';
import { useCountdown } from '@/lib/hooks/useCountdown';
import { useWatchlist } from '@/hooks/useWatchlist';
import { formatUGX } from '@/lib/currency';
import useAppStore from '@/store/useAppStore';

import CountdownClock from '@/components/product/CountdownClock';
import DiscountBadge from '@/components/product/DiscountBadge';
import UrgencyBar from '@/components/product/UrgencyBar';
import BookingModal from '@/components/booking/BookingModal';
import { resizedImage } from '@/helpers/universal';

import { ProductProvider, useProductContext } from '@/components/product/ProductProvider';
import ProductCard from '@/components/product/ProductCard';
import ProductActions from '@/components/product/ProductActions';
import { ProductLabelRow } from '@/components/ui/ProductLabel';
import ProductsView from '@/components/home/ProductsView';

// Shared card-section styling: sharp corners, hairline border — deliberately
// flat/dense to match dense mobile-commerce list UIs rather than the app's
// more rounded marketing surfaces.
const SECTION_CLASS = 'bg-[var(--tt-theme)] border border-[var(--tt-border)]/40';

function shareProduct(product, addToast) {
  if (navigator.share) {
    navigator.share({
      title: product.name,
      url: `${window.location.origin}/products/${product.slug}`,
    }).catch(() => {});
  } else {
    navigator.clipboard.writeText(`${window.location.origin}/products/${product.slug}`);
    addToast({ title: 'Link copied', message: 'Product link copied to clipboard.' });
  }
}

export default function ProductClientPage({ product: ssgProduct }) {
  const { data: product } = useProduct(ssgProduct.slug, ssgProduct);
  

  if (!product) {
    return (
      <div className="tt-container tt-container-padding" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--tt-danger)' }}>Product not found</h2>
        <p style={{ color: 'var(--tt-muted)', marginTop: '1rem' }}>
          The listing may have been removed or expired.
        </p>
      </div>
    );
  }

  return (
    <ProductProvider product={product}>
      <SingleProductView />
    </ProductProvider>
  );
}

function SingleProductView() {
  const { product, variationAttributes, metaAttributes, selectedOptions, selectedVariation, updateOption, } = useProductContext();
  const {tag_ids, loc_ids,cat_ids,tt_location,id} = product  ?? {};

  const { user, profile, addToast } = useAppStore();
  const { mutate: toggleLike, isPending: isLiking } = useProductLike(product.id);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const isFutureSale = !!(product.sale_start_date && new Date(product.sale_start_date) > new Date());
  const saleDateStr = product.sale_start_date
    ? new Date(product.sale_start_date).toISOString().split('T')[0]
    : null;
  const { isWatching, watchers, toggleWatch, loading: watchLoading } = useWatchlist(
    product.id,
    saleDateStr,
    product.watchers ?? 0
  );
  const isLiked = profile?.product_likes?.includes(product.id) ?? false;

  // Price resolves through the selected variation first, falling back to the base product.
  const variationEffectivePrice = selectedVariation?.sale_price || selectedVariation?.price || null;
  const newPrice = variationEffectivePrice || product.sale_price || product.price;
  const oldPrice = selectedVariation
    ? (selectedVariation.price && variationEffectivePrice && selectedVariation.price > variationEffectivePrice
        ? selectedVariation.price
        : null)
    : (product.sale_price && product.price > product.sale_price ? product.price : null);

  const currentStock = selectedVariation ? selectedVariation.stock_quantity : product.stock;
  const currentSku = selectedVariation ? selectedVariation.sku : product.sku;

  const { expired } = useCountdown(product?.sale_end_date);
  const isOutOfStock = currentStock == null || currentStock <= 0;
  const needsVariationSelection = variationAttributes.length > 0 && !selectedVariation;
  const canBook = !expired && !isOutOfStock;
  const isPrimaryDisabled = isFutureSale ? watchLoading : (!canBook || needsVariationSelection);

  const primaryActionLabel = isFutureSale
    ? (isWatching ? '🔔 Watching — Notify Me' : '🔔 Notify Me When Live')
    : isOutOfStock
      ? 'Sold Out'
      : expired
        ? 'Deal Expired'
        : needsVariationSelection
          ? 'Select Options'
          : 'Book Now (Pay on Delivery)';

  const handlePrimaryAction = () => {
    if (isFutureSale) {
      toggleWatch();
      return;
    }
    if (!user) {
      window.location.href = `/login?redirectTo=/products/${product.slug}`;
      return;
    }
    if (needsVariationSelection) {
      addToast({ title: 'Select options', message: 'Please select all options before booking.' });
      return;
    }
    setIsBookingModalOpen(true);
  };

  const handleLike = () => {
    if (!user?.id) {
      window.location.href = `/login?redirectTo=/products/${product.slug}`;
      return;
    }
    toggleLike({ userId: user.id });
  };

  const imageUrl = product.featured_image?.url ?? product.featured_image?.src ?? null;
  const gallery = product.gallery?.length ? product.gallery : (imageUrl ? [{ url: imageUrl }] : []);

  return (
    <div className="py-2 md:pb-4">
      {/* Breadcrumbs — desktop only; mobile uses the floating back button over the gallery */}
      <div className="tt-container tt-container-padding grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 md:pt-2 relative">

        {/* Gallery */}
        <div className='md:sticky h-fit md:top-[70px] flex flex-col gap-2.5'>
        <ProductGallery gallery={gallery} product={product} selectedVariation={selectedVariation} />
        {/* Overview */}
          {product.short_description && (
            <CollapsibleSection title="Overview" defaultOpen>
              <div dangerouslySetInnerHTML={{ __html: product.short_description }} />
            </CollapsibleSection>
          )}
        </div>

        {/* Details column */}
        <div className="flex flex-col gap-2.5">

          {/* Vendor panel */}
          {product.profiles && (
            <div className={`${SECTION_CLASS} p-3 flex items-center gap-3`}>
              <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 flex items-center justify-center" style={{ background: 'var(--tt-surface-2)' }}>
                {product.profiles.avatar_url ? (
                  <img src={product.profiles.avatar_url} alt="Vendor" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[0.85rem]" style={{ fontWeight: 700, color: 'var(--tt-muted)' }}>V</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-bold truncate m-0 text-[0.88rem]" style={{ color: 'var(--tt-text)' }}>{product.profiles.display_name || 'Verified Vendor'}</p>
                <p className="m-0 text-[0.7rem]" style={{ color: 'var(--tt-success)' }}>✓ Verified Vendor</p>
              </div>
            </div>
          )}

          {/* Title & Price */}
          <div className={`${SECTION_CLASS} p-4 sm:p-6`}>
            {isFutureSale && (
              <span className="tt-badge inline-flex mb-2 text-[0.7rem]" style={{ background: 'var(--tt-gold)', color: '#1a1a1a' }}>
                🚀 Coming Soon
              </span>
            )}
            <ProductLabelRow product={product} max={3} size="sm" className="mb-2" />
            <h1 className="font-['Syne',sans-serif] font-extrabold leading-tight m-0 mb-1" style={{ fontSize: 'clamp(1.4rem, 4vw, 2.1rem)', color: 'var(--tt-text)' }}>
              {product.name}
            </h1>
            <p className="text-[0.72rem] mb-3" style={{ color: 'var(--tt-muted-2)' }}>SKU: {currentSku || 'N/A'}</p>

            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-['Syne',sans-serif] font-extrabold" style={{ fontSize: '1.55rem', color: 'var(--tt-flame)' }}>
                {formatUGX(newPrice)}
              </span>
              {oldPrice && (
                <span className="line-through text-[0.92rem]" style={{ color: 'var(--tt-muted)' }}>
                  {formatUGX(oldPrice)}
                </span>
              )}
              {!isFutureSale && product.discount_pct > 0 && (
                <DiscountBadge discountPct={product.discount_pct} saleEndDate={product.sale_end_date} size="md" />
              )}
            </div>
          </div>

          {/* Variation Selectors */}
          {variationAttributes.length > 0 && (
            <div className={`${SECTION_CLASS} p-4 sm:p-6`}>
              <h3 className="text-[0.72rem] uppercase mb-3 font-semibold" style={{ letterSpacing: '0.06em', color: 'var(--tt-muted)' }}>
                Select Options
              </h3>
              {variationAttributes.map(attr => (
                <div key={attr.slug} className="mb-4 last:mb-0">
                  <p className="text-[0.78rem] font-semibold mb-2" style={{ color: 'var(--tt-text)' }}>
                    {attr.name}: <span style={{ color: 'var(--tt-flame)' }}>
                      {selectedOptions[attr.slug] ? attr.values.find(v => v.slug === selectedOptions[attr.slug])?.name : 'Select...'}
                    </span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {attr.values.map(val => {
                      const isSelected = selectedOptions[attr.slug] === val.slug;
                      return (
                        <button
                          key={val.slug}
                          onClick={() => updateOption(attr.slug, val.slug)}
                          className="px-3.5 py-1.5 text-[0.8rem] font-medium transition-all active:scale-95"
                          style={{
                            border: isSelected ? '1.5px solid var(--tt-flame)' : '1px solid var(--tt-border)',
                            background: isSelected ? 'rgba(255, 77, 0, 0.1)' : 'var(--tt-surface-2)',
                            color: isSelected ? 'var(--tt-flame)' : 'var(--tt-text)',
                            fontWeight: isSelected ? 700 : 500,
                          }}
                        >
                          {val.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {needsVariationSelection && (
                <div className="mt-4 p-3 text-center" style={{ background: 'var(--tt-surface-2)' }}>
                  <p className="m-0 text-[0.78rem]" style={{ color: 'var(--tt-muted)' }}>
                    {Object.keys(selectedOptions).length === variationAttributes.length
                      ? 'This combination is currently unavailable.'
                      : 'Please select all options to see availability.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Meta Attributes */}
          {metaAttributes.length > 0 && (
            <div className={`${SECTION_CLASS} p-4 sm:p-6`}>
              <h3 className="text-[0.72rem] uppercase mb-3 font-semibold" style={{ letterSpacing: '0.06em', color: 'var(--tt-muted)' }}>
                Item Features
              </h3>
              <div className="flex flex-col gap-2">
                {metaAttributes.map(attr => (
                  <div key={attr.slug} className="flex justify-between border-b last:border-b-0 pb-2" style={{ borderColor: 'var(--tt-border)', opacity: 0.92 }}>
                    <span className="text-[0.78rem]" style={{ color: 'var(--tt-muted-2)' }}>{attr.name}</span>
                    <span className="text-[0.78rem] font-semibold" style={{ color: 'var(--tt-text)' }}>
                      {attr.values?.map(v => v.name).join(', ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Urgency / CTA Panel */}
          <div
            className="p-4 sm:p-6 border border-[var(--tt-border)]"
            /* style={{
              background: isFutureSale ? 'var(--tt-surface-2)' : 'var(--tt-flame-light)',
              borderColor: isFutureSale ? 'rgba(0,0,0,0.06)' : 'rgba(255, 77, 0, 0.15)',
              boxShadow: isFutureSale ? 'none' : '0 4px 20px rgba(255, 77, 0, 0.1)',
            }} */
          >
            {isFutureSale ? (
              <div className="text-center mb-2">
                <div className="inline-flex items-center gap-2 mb-3">
                  <span style={{ fontSize: '1.15rem' }}>🚀</span>
                  <p className="m-0 text-[0.82rem] font-bold uppercase" style={{ color: 'var(--tt-text)', letterSpacing: '0.05em' }}>
                    Sale Launches In
                  </p>
                </div>
                <CountdownClock includeMilliSeconds startDate saleStartDate={product.sale_start_date} size="lg" />
                <p className="mt-4 text-[12px] leading-relaxed" style={{ color: 'var(--tt-muted-2)' }}>
                  This deal isn't live yet — share it, save it, or ask the vendor a question now. Cart and checkout unlock the moment it launches.
                </p>
                {watchers > 0 && (
                  <p className="mt-2 text-[0.72rem]" style={{ color: 'var(--tt-muted)' }}>
                    🔔 {watchers} {watchers === 1 ? 'person is' : 'people are'} watching
                  </p>
                )}
              </div>
            ) : (
              <>
                <div className="text-center mb-4">
                  <div className="inline-flex items-center gap-2 mb-3">
                    <span style={{ fontSize: '1.15rem' }}>⚡</span>
                    <p className="m-0 text-[0.82rem] font-bold uppercase" style={{ color: 'var(--tt-flame)', letterSpacing: '0.05em' }}>
                      Flash Deal Ends In
                    </p>
                  </div>
                  <CountdownClock includeMilliSeconds saleEndDate={product.sale_end_date} size="lg" />
                  <div >
                    <UrgencyBar saleEndDate={product.sale_end_date} showLabel />
                  </div>
                </div>

                <div className="flex justify-center mb-4 pb-4 border-b border-dashed" style={{ borderColor: 'rgba(255, 77, 0, 0.25)' }}>
                  <div className="text-center">
                    <p className="mb-0.5 text-[0.78rem] font-semibold" style={{ color: 'var(--tt-flame)', opacity: 0.9 }}>Availability</p>
                    <p className="m-0 font-extrabold text-[1.05rem]" style={{ color: isOutOfStock ? 'var(--tt-danger)' : 'var(--tt-flame)' }}>
                      {isOutOfStock ? 'Sold Out' : `${currentStock} items left`}
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Primary action — desktop only; mobile uses the sticky bar below */}
            <button
              onClick={handlePrimaryAction}
              disabled={isPrimaryDisabled}
              className={`hidden md:flex tt-btn tt-btn-primary w-full items-center justify-center transition-transform active:scale-[0.98] ${!isPrimaryDisabled ? 'tt-shimmer' : ''}`}
              style={{
                padding: '1.1rem',
                fontSize: '1.05rem',
                fontWeight: 800,
                opacity: isPrimaryDisabled ? 0.6 : 1,
                cursor: isPrimaryDisabled ? 'not-allowed' : 'pointer',
                background: (!isFutureSale && isOutOfStock) ? 'var(--tt-surface-2)' : 'var(--tt-gradient-flame)',
                color: (!isFutureSale && isOutOfStock) ? 'var(--tt-muted)' : '#fff',
              }}
            >
              {primaryActionLabel}
            </button>
          </div>

          {/* Quick actions: share / save / inquire / watchlist / cart */}
          <div className={`${SECTION_CLASS} p-3`}>
            <ProductActions leftExtraClass="bg-transparent" iconSize={22} product={product} selectedVariation={selectedVariation} />
          </div>

          {/*Breadcrumbs*/}
          <div className={`${SECTION_CLASS} p-4 flex items-center flex-wrap whitespace-nowrap text-sm`} style={{ color: 'var(--tt-muted)' }}>
        <Link href="/" className="no-underline" style={{ color: 'var(--tt-muted)' }}>Home</Link>
        <span className="mx-1.5"><ChevronRight size={16}/></span>
        <Link href="/products" className="no-underline" style={{ color: 'var(--tt-muted)' }}>Products</Link>
        {product.category?.name && (
          <>
            <span className="mx-1.5"><ChevronRight size={16}/></span>
            <Link href={`/products?category=${product?.product_categories?.id}`} className="no-underline" style={{ color: 'var(--tt-muted)' }}>
              {product.category.name}
            </Link>
          </>
        )}
        <span className="mx-1.5"><ChevronRight size={16}/></span>
        <span style={{ color: 'var(--tt-text)', fontWeight: 600 }}>{product.name}</span>
      </div>

          

          {/* Item Details */}
          {product.long_description && product.long_description?.length > 10 && (
            <CollapsibleSection title="Item Details">
              <div dangerouslySetInnerHTML={{ __html: product.long_description }} />
            </CollapsibleSection>
          )}

          {/* Found In */}
          {(product.all_categories?.length || product.category || product.tags?.length) && (
            <CollapsibleSection title="Found In">
              <div className="flex flex-wrap gap-2">
                {product.all_categories?.length
                  ? product.all_categories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/products?category_id=${cat.id}`}
                        className="tt-badge no-underline text-[0.75rem]"
                        style={{ background: 'var(--tt-surface-2)', color: 'var(--tt-text)' }}
                      >
                        📁 {cat.name}
                      </Link>
                    ))
                  : product.category && (
                      <Link
                        href={`/products?category_id=${product.category.id}`}
                        className="tt-badge no-underline text-[0.75rem]"
                        style={{ background: 'var(--tt-surface-2)', color: 'var(--tt-text)' }}
                      >
                        📁 {product.category.name}
                      </Link>
                    )}
                {product.tags?.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/products?tag=${tag.slug}`}
                    className="tt-badge no-underline text-[0.75rem]"
                    style={{ background: 'var(--tt-surface-2)', color: 'var(--tt-muted)' }}
                  >
                    #{tag.name}
                  </Link>
                ))}
              </div>
            </CollapsibleSection>
          )}
        </div>
      </div>

      {/* Related Products */}
      <div className="tt-container tt-container-padding mt-10 !pt-4 border-t" style={{ borderColor: 'var(--tt-border)', opacity: 1 }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="tt-section-title m-0">Related Products</h2>
        </div>
        <RelatedProducts category_id={product.category?.id} tag_ids={tag_ids} cat_ids={cat_ids} loc_ids={loc_ids} currentSlug={product.slug} excludeId={id} authorId={product.user_id} storeName={tt_location?.name} />
      </div>

      {/* Sticky mobile CTA bar — glass blur, elevated shadow, quick actions + primary CTA */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t"
        style={{
          background: 'var(--tt-glass-bg)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderColor: 'var(--tt-glass-border)',
          boxShadow: '0 -12px 32px rgba(0,0,0,0.22)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="flex items-center gap-2 p-2.5">
          <button
            onClick={() => shareProduct(product, addToast)}
            className="flex items-center justify-center shrink-0 w-10 h-10 transition-transform active:scale-90"
            style={{ color: 'var(--tt-text)', background: 'var(--tt-surface-2)' }}
            title="Share"
          >
            <Share2 size={18} strokeWidth={2} />
          </button>
          <button
            onClick={handleLike}
            disabled={isLiking}
            className="flex items-center justify-center shrink-0 w-10 h-10 transition-transform active:scale-90"
            style={{ color: isLiked ? '#ef4444' : 'var(--tt-text)', background: 'var(--tt-surface-2)' }}
            title={isLiked ? 'Remove from Favourites' : 'Save to Favourites'}
          >
            <Heart size={18} strokeWidth={2} fill={isLiked ? 'currentColor' : 'none'} />
          </button>

          <div className="flex-1 min-w-0 pl-1">
            <p className="uppercase leading-none mb-0.5 m-0" style={{ fontSize: '0.6rem', letterSpacing: '0.04em', color: 'var(--tt-muted)' }}>
              {isFutureSale ? 'Launch Price' : 'Price'}
            </p>
            <p className="font-['Syne',sans-serif] font-extrabold leading-none m-0 truncate" style={{ fontSize: '1.1rem', color: 'var(--tt-flame)' }}>
              {formatUGX(newPrice)}
            </p>
          </div>
          <button
            onClick={handlePrimaryAction}
            disabled={isPrimaryDisabled}
            className={`tt-btn tt-btn-primary flex-1 max-w-[52%] transition-transform active:scale-[0.97] ${!isPrimaryDisabled ? 'tt-shimmer' : ''}`}
            style={{
              padding: '0.85rem',
              fontSize: '0.85rem',
              fontWeight: 800,
              opacity: isPrimaryDisabled ? 0.6 : 1,
              background: (!isFutureSale && isOutOfStock) ? 'var(--tt-surface-2)' : 'var(--tt-gradient-flame)',
              color: (!isFutureSale && isOutOfStock) ? 'var(--tt-muted)' : '#fff',
            }}
          >
            {primaryActionLabel}
          </button>
        </div>
      </div>

      {isBookingModalOpen && (
        <BookingModal
          product={product}
          selectedVariation={selectedVariation}
          onClose={() => setIsBookingModalOpen(false)}
        />
      )}
    </div>
  );
}

/**
 * Swipeable (scroll-snap) image gallery. Mobile shows floating back/share
 * buttons + dot indicators; desktop shows a clickable thumbnail strip.
 */
function ProductGallery({ gallery, product, selectedVariation }) {
  const router = useRouter();
  const { addToast } = useAppStore();
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const scrollerRef = useRef(null);

  const images = useMemo(() => {
    const variationImg = selectedVariation?.featured_image?.url;
    const base = gallery.length ? gallery : [{ url: null }];
    if (variationImg) {
      return [{ url: variationImg }, ...base.filter((g) => g.url !== variationImg)];
    }
    return base;
  }, [gallery, selectedVariation]);

  // Jump back to the first frame (the variation image, when present) whenever the
  // selected variation changes.
  useEffect(() => {
    setActiveIndex(0);
    scrollerRef.current?.scrollTo({ left: 0, behavior: 'auto' });
  }, [selectedVariation?.id]);

  const scrollToIndex = (idx) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollTo({ left: idx * scroller.clientWidth, behavior: 'smooth' });
    setActiveIndex(idx);
  };

  const handleScroll = () => {
    const scroller = scrollerRef.current;
    if (!scroller || !scroller.clientWidth) return;
    setActiveIndex(Math.round(scroller.scrollLeft / scroller.clientWidth));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <div
          ref={scrollerRef}
          onScroll={handleScroll}
          className={`${SECTION_CLASS} flex overflow-x-auto snap-x snap-mandatory no-scrollbar`}
          style={{ aspectRatio: '1/1', background: '#fff' }}
        >
          {images.map((img, idx) => (
            <div
              key={idx}
              className="snap-center shrink-0 w-full h-full flex items-center justify-center"
              onClick={() => img.url && setLightboxOpen(true)}
              style={{ cursor: img.url ? 'zoom-in' : 'default' }}
            >
              {img.url ? (
                <img
                  src={resizedImage(img.url, 'large')}
                  alt={product.name}
                  className="w-full h-full object-contain"
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  draggable={false}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[4rem]" style={{ background: 'var(--tt-surface-2)' }}>
                  📦
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Zoom affordance — bottom right, all breakpoints */}
        {images.some((img) => img.url) && (
          <button
            onClick={() => setLightboxOpen(true)}
            className="absolute bottom-3 right-3 flex items-center justify-center w-9 h-9 rounded-full transition-transform active:scale-90"
            style={{ background: 'rgba(13,13,20,0.55)', backdropFilter: 'blur(6px)', color: '#fff' }}
            title="View full size"
          >
            <ZoomIn size={16} strokeWidth={2.25} />
          </button>
        )}

        {/* Floating nav — mobile only */}
        <button
          onClick={() => router.back()}
          className="md:hidden absolute top-3 left-3 flex items-center justify-center w-9 h-9 rounded-full transition-transform active:scale-90"
          style={{ background: 'rgba(13,13,20,0.55)', backdropFilter: 'blur(6px)', color: '#fff' }}
          title="Back"
        >
          <ArrowLeft size={17} strokeWidth={2.25} />
        </button>
        <button
          onClick={() => shareProduct(product, addToast)}
          className="md:hidden absolute top-3 right-3 flex items-center justify-center w-9 h-9 rounded-full transition-transform active:scale-90"
          style={{ background: 'rgba(13,13,20,0.55)', backdropFilter: 'blur(6px)', color: '#fff' }}
          title="Share"
        >
          <Share2 size={16} strokeWidth={2.25} />
        </button>

        {/* Badges overlay */}
        <div className="absolute top-14 left-3 md:top-3 flex gap-2 flex-wrap">
          {product.discount_pct > 0 && (
            <DiscountBadge discountPct={product.discount_pct} saleEndDate={product.sale_end_date} size="lg" />
          )}
          {product.category?.name && (
            <span className="tt-badge text-[0.7rem]" style={{ background: 'rgba(13,13,20,0.75)', color: '#fff', backdropFilter: 'blur(8px)' }}>
              {product.category.name}
            </span>
          )}
        </div>

        {/* Dot indicators — mobile only */}
        {images.length > 1 && (
          <div className="md:hidden absolute bottom-3 left-1/2 flex gap-1.5" style={{ transform: 'translateX(-50%)' }}>
            {images.map((_, idx) => (
              <span
                key={idx}
                className="rounded-full transition-all"
                style={{
                  height: '6px',
                  width: idx === activeIndex ? '16px' : '6px',
                  background: idx === activeIndex ? 'var(--tt-flame)' : 'rgba(255,255,255,0.7)',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails — desktop only */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => scrollToIndex(idx)}
              className="shrink-0 overflow-hidden border-2 transition-opacity"
              style={{
                width: '64px',
                height: '64px',
                borderColor: idx === activeIndex ? 'var(--tt-flame)' : 'var(--tt-border)',
                opacity: idx === activeIndex ? 1 : 0.6,
              }}
            >
              {img.url && <img src={resizedImage(img.url, 'thumbnail')} alt="" className="w-full h-full object-cover" />}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {lightboxOpen && (
          <Lightbox
            images={images}
            initialIndex={activeIndex}
            productName={product.name}
            onClose={() => setLightboxOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Fullscreen image viewer. Opens on top of the gallery, syncs to whichever
 * frame was active, and supports swipe, arrow keys, and click-to-close.
 */
function Lightbox({ images, initialIndex, productName, onClose }) {
  const [index, setIndex] = useState(initialIndex);
  const scrollerRef = useRef(null);

  const goTo = useCallback((idx) => {
    const clamped = (idx + images.length) % images.length;
    setIndex(clamped);
    scrollerRef.current?.scrollTo({ left: clamped * scrollerRef.current.clientWidth, behavior: 'smooth' });
  }, [images.length]);

  // Jump the scroller to the frame that was active in the main gallery, then
  // lock page scroll for the duration of the overlay.
  useEffect(() => {
    scrollerRef.current?.scrollTo({ left: initialIndex * scrollerRef.current.clientWidth, behavior: 'auto' });
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prevOverflow; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goTo(index - 1);
      if (e.key === 'ArrowRight') goTo(index + 1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [index, goTo, onClose]);

  const handleScroll = () => {
    const scroller = scrollerRef.current;
    if (!scroller || !scroller.clientWidth) return;
    setIndex(Math.round(scroller.scrollLeft / scroller.clientWidth));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex flex-col"
      style={{ background: 'rgba(8,8,12,0.95)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 flex items-center justify-center w-10 h-10 rounded-full transition-transform active:scale-90"
        style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}
        title="Close"
      >
        <X size={20} strokeWidth={2.25} />
      </button>

      {images.length > 1 && (
        <span
          className="absolute top-5 left-1/2 text-[0.8rem] font-semibold"
          style={{ transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.8)' }}
        >
          {index + 1} / {images.length}
        </span>
      )}

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); goTo(index - 1); }}
            className="hidden sm:flex absolute left-4 top-1/2 items-center justify-center w-11 h-11 rounded-full transition-transform active:scale-90"
            style={{ transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.1)', color: '#fff' }}
            title="Previous"
          >
            <ChevronLeft size={22} strokeWidth={2.25} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); goTo(index + 1); }}
            className="hidden sm:flex absolute right-4 top-1/2 items-center justify-center w-11 h-11 rounded-full transition-transform active:scale-90"
            style={{ transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.1)', color: '#fff' }}
            title="Next"
          >
            <ChevronRight size={22} strokeWidth={2.25} />
          </button>
        </>
      )}

      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar w-full flex-1 min-h-0"
      >
        {images.map((img, idx) => (
          <div key={idx} className="snap-center shrink-0 w-full h-full flex items-center justify-center p-4 sm:p-12">
            {img.url && (
              <img
                src={resizedImage(img.url, 'full')}
                alt={productName}
                className="max-w-full max-h-full object-contain"
                loading={idx === index ? 'eager' : 'lazy'}
              />
            )}
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <div
          className="shrink-0 flex gap-2 overflow-x-auto no-scrollbar justify-center p-3"
          style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
        >
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={(e) => { e.stopPropagation(); goTo(idx); }}
              className="shrink-0 overflow-hidden border-2 transition-opacity"
              style={{
                width: '52px',
                height: '52px',
                borderColor: idx === index ? 'var(--tt-flame)' : 'rgba(255,255,255,0.3)',
                opacity: idx === index ? 1 : 0.55,
              }}
            >
              {img.url && <img src={resizedImage(img.url, 'thumbnail')} alt="" className="w-full h-full object-cover" />}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

/**
 * Collapsible on mobile (tap to expand), always expanded on desktop.
 */
function CollapsibleSection({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={SECTION_CLASS}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-4 sm:p-6 text-left md:pointer-events-none"
      >
        <h3 className="font-['Syne',sans-serif] font-bold m-0 text-[0.92rem]" style={{ color: 'var(--tt-text)' }}>
          {title}
        </h3>
        <ChevronDown
          className="w-4 h-4 md:hidden transition-transform"
          style={{ color: 'var(--tt-muted)', transform: open ? 'rotate(180deg)' : 'none' }}
        />
      </button>
      <div className={`px-4 sm:px-6 pb-4 sm:pb-6 md:block ${open ? 'block' : 'hidden'}`}>
        <div className="leading-relaxed text-[0.8rem]" style={{ color: 'var(--tt-muted-2)' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function RelatedProducts({ category_id, currentSlug, authorId, tag_ids, cat_ids, loc_ids, storeName, excludeId }) {
  const { data: products, isLoading } = useProducts({ category_id, limit: 8 });

  if (isLoading) {
    return <div className="tt-skeleton" style={{ height: '300px' }} />;
  }

  const related = products?.filter(p => p.slug !== currentSlug).slice(0, 4) || [];
/* 
  if (related.length === 0) {
    return (
      <div className={`${SECTION_CLASS} p-12 text-center`} style={{ color: 'var(--tt-muted)' }}>
        <p className="m-0">No related products found.</p>
      </div>
    );
  } */

  /* return (
    <div className="tt-grid-products mb-5">
      {related.map(p => (
        <ProductCard key={p.id} product={p} />
      ))}
      <ProductsView source="custom" customFilters={{excludeId:excludeId}}/>
    </div>
  ); */
  return (
    <div className="mb-2">
      <ProductsView title='More In' cardType={1} subTitle='Category' cardWidth='320px' source="custom"  itemExClass='flex flex-col' customFilters={{category_id, excludeId:excludeId, limit:8}} headingSize={24}/>

      <ProductsView title='In This' subTitle='Neighborhood' cardWidth='150px' source="custom"  itemExClass='flex flex-col' customFilters={{loc_ids, excludeId:excludeId, limit:5}} headingSize={24}/>
    </div>
  );
}
