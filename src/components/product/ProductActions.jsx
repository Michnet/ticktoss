'use client';

import { MessageSquare, Share2, Heart, ShoppingCart } from 'lucide-react';
import useAppStore from '@/store/useAppStore';

export default function ProductActions({ product, storeData }) {
  const addToCart = useAppStore(state => state.addToCart);
  const addToast = useAppStore(state => state.addToast);

  const handleContact = (e) => {
    e.preventDefault();
    if (!storeData) return;
    
    if (storeData.whatsapp && storeData.whatsapp.length > 0) {
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
    <div className="flex justify-between">
      <div className='flex flex-row shrink-1 overflow-x-auto no-scrollbar bg-[var(--tt-surface)]'>
        <button
          onClick={handleContact}
          className="flex items-center justify-center border border-[var(--tt-surface)] text-[var(--tt-text)] px-[0.6rem] hover:bg-[var(--tt-surface)] transition-colors"
          title="Contact Vendor"
        >
          <MessageSquare size={16} strokeWidth={2} />
        </button>
        <button
          onClick={handleShare}
          className="flex items-center justify-center border border-[var(--tt-surface)] text-[var(--tt-text)] px-[0.6rem] hover:bg-[var(--tt-surface)] transition-colors hover:text-blue-500 hover:border-blue-500/30"
          title="Share"
        >
          <Share2 size={16} strokeWidth={2} />
        </button>
        <button
          onClick={(e) => e.preventDefault()}
          className="flex items-center justify-center border border-[var(--tt-surface)] text-[var(--tt-text)] px-[0.6rem] hover:bg-[var(--tt-surface)] hover:text-red-500 hover:border-red-500/30 transition-colors"
          title="Save to Favourites"
        >
          <Heart size={16} strokeWidth={2} />
        </button>
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
        <ShoppingCart size={20} strokeWidth={2} />
      </button>
    </div>
  );
}
