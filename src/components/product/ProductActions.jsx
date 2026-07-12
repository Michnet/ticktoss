'use client';

import { MessageSquare, Share2, Heart, ShoppingCart, Bell, BellOff } from 'lucide-react';
import useAppStore from '@/store/useAppStore';
import { useWatchlist } from '@/hooks/useWatchlist';

/**
 * WatchlistButton — shown only when the product's sale_start_date is in the future.
 */
function WatchlistButton({ product, iconSize = 16 }) {
  const saleDate = product?.sale_start_date
    ? new Date(product.sale_start_date).toISOString().split('T')[0]
    : null;

  const { isWatching, watchers, toggleWatch, loading } = useWatchlist(product?.id, saleDate, product?.watchers ?? 0);

  if (!saleDate) return null;

  return (
    <button
      onClick={(e) => { e.preventDefault(); toggleWatch(); }}
      disabled={loading}
      className={`flex items-center gap-1.5 px-[0.6rem] transition-colors ${
        isWatching
          ? 'border-[var(--tt-flame)]/40 text-[var(--tt-flame)] bg-[var(--tt-flame)]/8'
          : 'text-[var(--tt-muted-2)] hover:text-[var(--tt-flame)]'
      }`}
      title={isWatching ? 'Stop watching' : 'Watch for sale start'}
    >
      {isWatching
        ? <BellOff  size={iconSize} strokeWidth={2} />
        : <Bell     size={iconSize} strokeWidth={2} />}
      {watchers > 0 && (
        <span className="text-[0.68rem] font-semibold leading-none">{watchers}</span>
      )}
    </button>
  );
}

export default function ProductActions({ product, iconSize = 16, leftExtraClass = 'bg-[var(--tt-surface)]', exClass= '' }) {
  const addToCart = useAppStore(state => state.addToCart);
  const addToast  = useAppStore(state => state.addToast);
  const {tt_location, vendor} = product ?? {}
  const storeData = tt_location || vendor 

  const isFutureSale =
    product?.sale_start_date && new Date(product.sale_start_date) > new Date();

  const handleContact = (e) => {
    e.preventDefault();
    if (!storeData) return;
    
    if (storeData?.whatsapp && storeData?.whatsapp.length > 0) {
      // Clean phone number for wa.me link
      const phone = storeData.whatsapp[0].replace(/[^0-9]/g, '');
      window.open(`https://wa.me/${phone}`, '_blank');
    } else if (storeData.calls && storeData.calls.length > 0) {
      window.location.href = `tel:${storeData.calls[0]}`;
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          url: `${window.location.origin}/products/${product.slug}`
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/products/${product.slug}`);
      addToast({ title: 'Link copied', message: 'Product link copied to clipboard.' });
    }
  };

  return (
    <div className={`flex justify-between ${exClass}`}>
      <div className={`flex flex-row justify-end shrink-1 overflow-x-auto no-scrollbar ${leftExtraClass}`}>
        <button
          onClick={handleContact}
          className="flex items-center justify-center text-[var(--tt-text)] px-[0.6rem] hover:bg-[var(--tt-surface)] transition-colors"
          title="Contact Vendor"
        >
          <MessageSquare size={iconSize} strokeWidth={2} />
        </button>
        <button
          onClick={handleShare}
          className="flex items-center justify-center text-[var(--tt-text)] px-[0.6rem] hover:bg-[var(--tt-surface)] transition-colors hover:text-blue-500 hover:border-blue-500/30"
          title="Share"
        >
          <Share2 size={iconSize} strokeWidth={2} />
        </button>
        <button
          onClick={(e) => e.preventDefault()}
          className="flex items-center justify-center text-[var(--tt-text)] px-[0.6rem] hover:bg-[var(--tt-surface)] hover:text-red-500 hover:border-red-500/30 transition-colors"
          title="Save to Favourites"
        >
          <Heart size={iconSize} strokeWidth={2} />
        </button>
        {/* Watchlist button — only for products with a future sale start date */}
        {isFutureSale && <WatchlistButton product={product} iconSize={iconSize} />}
      </div>

      <button
        onClick={(e) => {
          e.preventDefault();
          addToCart(product, 1);
          addToast({ title: 'Added to Cart', message: `${product.name} has been added to your cart.` });
        }}
        className="shadow aspect-square w-[35px] bg-[var(--tt-flame-light)] shrink-0 text-[var(--tt-flame)] tt-shimmer py-2 flex items-center justify-center"
        title="Book Now"
      >
        <ShoppingCart size={iconSize} strokeWidth={2} />
      </button>
    </div>
  );
}
