'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Flame, MapPin, LayoutGrid, Bell, ShoppingCart,
  Heart, Package, Store, PlusCircle, HelpCircle, User,
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

function NavRow({ href, label, icon: Icon, active, badge, collapsed }) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      aria-label={label}
      className={`flex items-center gap-3 px-3 py-[0.55rem] rounded-[var(--tt-radius-md)] text-[0.88rem] font-medium transition-colors ${
        collapsed ? 'justify-center px-0' : ''
      } ${
        active
          ? 'bg-[rgba(255,77,0,0.1)] text-[var(--tt-flame-2)]'
          : 'text-[var(--tt-text)] hover:bg-[var(--tt-surface-2)]'
      }`}
    >
      <span className="relative shrink-0">
        <Icon size={18} strokeWidth={2} className="shrink-0" />
        {collapsed && badge > 0 && (
          <span className="absolute -top-1.5 -right-2 text-[0.6rem] font-bold bg-[var(--tt-flame)] text-white rounded-full px-[4px] py-[0px] leading-[1.3]">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </span>
      {!collapsed && <span className="flex-1 truncate">{label}</span>}
      {!collapsed && badge > 0 && (
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
  const collapsed = useAppStore((s) => s.leftSidebarCollapsed);
  const { unreadCount } = useNotifications(user?.id ?? null);
  const { data: categories } = useTopCategories();

  return (
    <div className={`flex flex-col gap-4 bg-[var(--tt-glass-bg)] ${collapsed ? 'px-0 items-center' : 'px-3'}`}>
      {/* Identity card */}
      {user ? (
        <Link
          href="/dashboard?view=profile"
          title={collapsed ? (profile?.display_name || profile?.first_name || 'My Account') : undefined}
          className={`flex items-center gap-3 py-2 rounded-[var(--tt-radius-md)] hover:bg-[var(--tt-surface-2)] transition-colors ${collapsed ? 'justify-center px-0' : 'px-2'}`}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-[0.85rem] font-bold text-white shrink-0"
            style={{ background: 'var(--tt-gradient-flame)' }}
          >
            {user?.email?.[0]?.toUpperCase() ?? 'U'}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-[0.85rem] font-semibold truncate">{profile?.display_name || profile?.first_name || 'My Account'}</div>
              <div className="text-[0.7rem] text-[var(--tt-muted)] truncate">View profile</div>
            </div>
          )}
        </Link>
      ) : collapsed ? (
        <button
          onClick={() => setAuthModalOpen(true)}
          title="Sign In / Join TickToss"
          aria-label="Sign In / Join TickToss"
          className="tt-btn tt-btn-primary tt-shimmer w-9 h-9 !p-0 flex items-center justify-center"
        >
          <User size={16} />
        </button>
      ) : (
        <button
          onClick={() => setAuthModalOpen(true)}
          className="tt-btn tt-btn-primary tt-shimmer w-full text-[0.85rem]"
        >
          Sign In / Join TickToss
        </button>
      )}

      {/* Primary nav */}
      <nav className={`flex flex-col gap-[2px] ${collapsed ? 'items-center w-full' : ''}`}>
        {PRIMARY_LINKS.map((l) => (
          <NavRow key={l.href} {...l} active={pathname === l.href} collapsed={collapsed} />
        ))}
        <NavRow href="/dashboard?view=my_cart" label="My Cart" icon={ShoppingCart} active={false} collapsed={collapsed} />
      </nav>

      {/* My Profile — links only useful once signed in */}
      {user && (
        <div className={`border-t border-[var(--tt-border)] pt-3 w-full`}>
          {!collapsed && (
            <h4 className="px-3 mb-1 text-[0.7rem] font-bold uppercase tracking-wider text-[var(--tt-muted)]">
              My Profile
            </h4>
          )}
          <nav className={`flex flex-col gap-[2px] ${collapsed ? 'items-center w-full' : ''}`}>
            <NavRow href="/notifications" label="Notifications" icon={Bell} active={pathname === '/notifications'} badge={unreadCount} collapsed={collapsed} />
            <NavRow href="/watchlist" label="Watchlist" icon={Heart} active={pathname === '/watchlist'} collapsed={collapsed} />
            <NavRow href="/dashboard?view=my_orders" label="My Orders" icon={Package} active={false} collapsed={collapsed} />
            {isVendor() ? (
              <NavRow href="/dashboard" label="Vendor Dashboard" icon={Store} active={false} collapsed={collapsed} />
            ) : (
              <NavRow href="/apply-vendor" label="Become a Vendor" icon={PlusCircle} active={false} collapsed={collapsed} />
            )}
          </nav>
        </div>
      )}

      {/* Shop by category — hidden in icons-only mode, no compact icon set to fall back to */}
      {!collapsed && categories?.length > 0 && (
        <div className="border-t border-[var(--tt-border)] pt-3 w-full">
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
      <div className={`border-t border-[var(--tt-border)] pt-3 flex flex-col gap-[2px] ${collapsed ? 'items-center w-full' : ''}`}>
        {!user && (
          <NavRow href="/apply-vendor" label="Vendor Signup" icon={Store} active={pathname === '/apply-vendor'} collapsed={collapsed} />
        )}
        <NavRow href="/offline" label="Help & Support" icon={HelpCircle} active={false} collapsed={collapsed} />
      </div>

      {!collapsed && (
        <div className="px-2 pt-1 pb-4">
          <p className="text-[0.72rem] text-[var(--tt-muted)] leading-[1.5]">
            Uganda&apos;s urgency marketplace. Every deal has a clock. Don&apos;t let it run out.
          </p>
          <p className="text-[0.68rem] text-[var(--tt-muted)] mt-2">
            © {new Date().getFullYear()} TickToss · 🇺🇬 Made for Uganda
          </p>
        </div>
      )}
    </div>
  );
}
