'use client';

import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import useAppStore from '@/store/useAppStore';

export default function CartIcon() {
  const cartItems = useAppStore(state => state.cartItems) || [];
  const itemCount = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);

  return (
    <Link href="/dashboard?view=my_cart" className="relative flex items-center justify-center p-2 rounded-full hover:bg-[var(--tt-surface-2)] transition-colors text-[var(--tt-text)]">
      <ShoppingCart size={22} strokeWidth={2} />
      {itemCount > 0 && (
        <span className="absolute top-0 right-0 bg-[var(--tt-flame)] text-white text-[0.65rem] font-bold w-[18px] h-[18px] flex items-center justify-center rounded-full border-2 border-[var(--tt-surface)]">
          {itemCount}
        </span>
      )}
    </Link>
  );
}
