'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Flame, MapPin, LayoutGrid, Bell, ShoppingCart,
  Heart, Package, Store, PlusCircle, HelpCircle,
} from 'lucide-react';

import useAppStore from '@/store/useAppStore';
import { useTopCategories } from '@/hooks/useHomeData';
import { useNotifications } from '@/hooks/useNotifications';

const PRIMARY_LINKS = [
  { href: '/',          label: 'Home',       icon: Home },
  { href: '/products',  label: 'Browse Deals', icon: Flame },
  { href: '/near-me',   label: 'Near Me',    icon: MapPin },
  { href: '/categories', label: 'Categories', icon: LayoutGrid },
];

function NavRow({ href, label, icon: Icon, active, badge }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-[0.55rem] rounded-[var(--tt-radius-md)] text-[0.88rem] font-medium transition-colors ${
        active
          ? 'bg-[rgba(255,77,0,0.1)] text-[var(--tt-flame-2)]'
          : 'text-[var(--tt-text)] hover:bg-[var(--tt-surface-2)]'
      }`}
    >
      <Icon size={18} strokeWidth={2} className="shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      {badge > 0 && (
        <span className="text-[0.65rem] font-bold bg-[var(--tt-flame)] text-white rounded-full px-[6px] py-[1px] shrink-0">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </Link>
  );
}

export default function FeedLeftNav() {
  const pathname = usePathname();
  const user = useAppStore((s) => s.user);
  const profile = useAppStore((s) => s.profile);
  const isVendor = useAppStore((s) => s.isVendor);
  const setAuthModalOpen = useAppStore((s) => s.setAuthModalOpen);
  const { unreadCount } = useNotifications(user?.id ?? null);
  const { data: categories } = useTopCategories();

  return (
    <div className="flex flex-col gap-4 bg-[var(--tt-glass-bg)] px-2">
      {/* Identity card */}
      {user ? (
        <Link href="/dashboard?view=profile" className="flex items-center gap-3 px-2 py-2 rounded-[var(--tt-radius-md)] hover:bg-[var(--tt-surface-2)] transition-colors">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-[0.85rem] font-bold text-white shrink-0"
            style={{ background: 'var(--tt-gradient-flame)' }}
          >
            {user?.email?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="min-w-0">
            <div className="text-[0.85rem] font-semibold truncate">{profile?.display_name || profile?.first_name || 'My Account'}</div>
            <div className="text-[0.7rem] text-[var(--tt-muted)] truncate">View profile</div>
          </div>
        </Link>
      ) : (
        <button
          onClick={() => setAuthModalOpen(true)}
          className="tt-btn tt-btn-primary tt-shimmer w-full text-[0.85rem]"
        >
          Sign In / Join TickToss
        </button>
      )}

      {/* Primary nav */}
      <nav className="flex flex-col gap-[2px]">
        {PRIMARY_LINKS.map((l) => (
          <NavRow key={l.href} {...l} active={pathname === l.href} />
        ))}
        <NavRow href="/notifications" label="Notifications" icon={Bell} active={pathname === '/notifications'} badge={unreadCount} />
        <NavRow href="/watchlist" label="Watchlist" icon={Heart} active={pathname === '/watchlist'} />
        <NavRow href="/dashboard?view=my_cart" label="My Cart" icon={ShoppingCart} active={false} />
        {user && (
          <NavRow href="/dashboard?view=my_orders" label="My Orders" icon={Package} active={false} />
        )}
        {user && isVendor() && (
          <NavRow href="/dashboard" label="Vendor Dashboard" icon={Store} active={false} />
        )}
        {user && !isVendor() && (
          <NavRow href="/apply-vendor" label="Become a Vendor" icon={PlusCircle} active={false} />
        )}
      </nav>

      {/* Shop by category */}
      {categories?.length > 0 && (
        <div className="border-t border-[var(--tt-border)] pt-3">
          <h4 className="px-3 mb-1 text-[0.7rem] font-bold uppercase tracking-wider text-[var(--tt-muted)]">
            Shop by Category
          </h4>
          <div className="flex flex-col gap-[2px] max-h-[280px] overflow-y-auto no-scrollbar">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/products?category_id=${cat.id}`}
                className="flex items-center gap-3 px-3 py-[0.45rem] rounded-[var(--tt-radius-md)] text-[0.82rem] text-[var(--tt-muted-2)] hover:bg-[var(--tt-surface-2)] hover:text-[var(--tt-text)] transition-colors"
              >
                <span className="text-[1rem] shrink-0">{cat.icon || '🏷️'}</span>
                <span className="flex-1 truncate">{cat.name}</span>
                <span className="text-[0.68rem] text-[var(--tt-muted)] shrink-0">{cat.count}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Footer-derived: about / help / legal */}
      <div className="border-t border-[var(--tt-border)] pt-3 flex flex-col gap-[2px]">
        <NavRow href="/apply-vendor" label="Vendor Signup" icon={Store} active={pathname === '/apply-vendor'} />
        <NavRow href="/offline" label="Help & Support" icon={HelpCircle} active={false} />
      </div>

      <div className="px-2 pt-1 pb-4">
        <p className="text-[0.72rem] text-[var(--tt-muted)] leading-[1.5]">
          Uganda&apos;s urgency marketplace. Every deal has a clock. Don&apos;t let it run out.
        </p>
        <p className="text-[0.68rem] text-[var(--tt-muted)] mt-2">
          © {new Date().getFullYear()} TickToss · 🇺🇬 Made for Uganda
        </p>
      </div>
    </div>
  );
}
