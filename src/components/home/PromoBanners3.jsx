'use client';

import Link from 'next/link';

const DEFAULT_GRID_BANNERS = [
  {
    id: 'b1',
    label: '🔥 Grab The Moment',
    title: 'Flash Discounts Drops',
    cta: { label: 'Shop Now', href: '/products?sort=discount' },
    image: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?q=80&w=800&auto=format&fit=crop',
    overlay: 'linear-gradient(135deg, rgba(255,77,0,0.8) 0%, rgba(0,0,0,0.4) 100%)',
    size: 'large', // to span full width or more space
  },
  {
    id: 'b2',
    label: '🏪 Trusted Sellers',
    title: 'Top Local Vendors',
    cta: { label: 'Explore', href: '/vendors' },
    image: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?q=80&w=800&auto=format&fit=crop',
    overlay: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
    size: 'small',
  },
  {
    id: 'b3',
    label: '⏱️ Ending Soon',
    title: 'Last Chance Deals',
    cta: { label: 'View Deals', href: '/products?filter=ending-soon' },
    image: 'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?q=80&w=800&auto=format&fit=crop',
    overlay: 'linear-gradient(to top, rgba(123,47,247,0.8) 0%, transparent 100%)',
    size: 'small',
  },
];

export default function PromoBanners3({ items = DEFAULT_GRID_BANNERS }) {
  // Assuming a layout with 1 large banner and 2 smaller ones
  const largeBanner = items.find(i => i.size === 'large') || items[0];
  const smallBanners = items.filter(i => i !== largeBanner).slice(0, 2);

  return (
    <section className="pb-8">
      <div className="tt-container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Large Banner */}
          <Link 
            href={largeBanner.cta.href}
            className="group relative overflow-hidden rounded-[var(--tt-radius-xl)] shadow-sm hover:shadow-xl transition-all duration-300 md:col-span-2 aspect-[4/3] md:aspect-auto min-h-[300px] flex items-end p-6 md:p-8"
          >
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
              style={{ backgroundImage: `url(${largeBanner.image})` }}
            />
            <div 
              className="absolute inset-0"
              style={{ background: largeBanner.overlay }}
            />
            <div className="relative z-10 w-full max-w-md">
              <span className="inline-block bg-[var(--tt-flame)] text-white text-[0.7rem] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
                {largeBanner.label}
              </span>
              <h2 className="font-['Syne',sans-serif] text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-4 leading-tight drop-shadow-lg">
                {largeBanner.title}
              </h2>
              <span className="inline-flex items-center gap-2 bg-white text-black font-bold px-5 py-2.5 rounded-full text-sm group-hover:bg-gray-100 transition-colors">
                {largeBanner.cta.label}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
              </span>
            </div>
          </Link>

          {/* Small Banners Column */}
          <div className="flex flex-col gap-4">
            {smallBanners.map((banner) => (
              <Link 
                key={banner.id}
                href={banner.cta.href}
                className="group relative overflow-hidden rounded-[var(--tt-radius-xl)] shadow-sm hover:shadow-lg transition-all duration-300 aspect-[16/9] md:aspect-auto md:flex-1 min-h-[160px] flex items-end p-5"
              >
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url(${banner.image})` }}
                />
                <div 
                  className="absolute inset-0"
                  style={{ background: banner.overlay }}
                />
                <div className="relative z-10">
                  <span className="text-white/90 text-xs font-semibold tracking-widest uppercase mb-1 block">
                    {banner.label}
                  </span>
                  <h3 className="font-['Syne',sans-serif] text-xl font-bold text-white mb-3">
                    {banner.title}
                  </h3>
                  <span className="text-white/90 text-sm font-medium border-b border-white/50 pb-0.5 group-hover:border-white transition-colors inline-block">
                    {banner.cta.label}
                  </span>
                </div>
              </Link>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
