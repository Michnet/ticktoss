'use client';

import useAppStore from '@/store/useAppStore';
import { WatchlistButton } from './ProductActions';
import { Plus } from 'lucide-react';

export default function AddToCart({ product, iconSize = 16, leftExtraClass = 'bg-[var(--tt-surface)]', exClass= '', actionButtonClass='bg-[var(--tt-flame-light)] text-[var(--tt-flame)]', height='35' }) {
  const addToCart = useAppStore(state => state.addToCart);
  const addToast  = useAppStore(state => state.addToast);

  const isFutureSale =
    product?.sale_start_date && new Date(product.sale_start_date) > new Date();


  return (<button
          onClick={(e) => {
            e.preventDefault();
            addToCart(product, 1);
            addToast({ title: 'Added to Cart', message: `${product.name} has been added to your cart.` });
          }}
          className={`shadow aspect-square h-[${height}px] shrink-0 tt-shimmer py-2 flex items-center justify-center ${actionButtonClass}`}
          title="Book Now"
        >
          {isFutureSale ?  <WatchlistButton product={product} iconSize={iconSize} />  : <Plus size={iconSize} strokeWidth={2} />}
        </button>
  );
}
