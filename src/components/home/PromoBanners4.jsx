'use client';

import Link from 'next/link';

const DEFAULT_SPLIT_BANNERS = [
  {
    id: 'nationwide',
    label: 'Nationwide',
    title: 'Top Rated Sellers',
    cta: { label: 'Find Vendors', href: '/vendors' },
    image: 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?q=80&w=800&auto=format&fit=crop',
    theme: 'dark',
  },
  {
    id: 'local',
    label: 'Local Steals',
    title: 'Sales Near You',
    cta: { label: 'Shop Local', href: '/near-me' },
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop',
    theme: 'light',
  },
];

export default function PromoBanners4({ items = DEFAULT_SPLIT_BANNERS }) {
  return (
    <section className="pb-8">
      <div className="tt-container">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.slice(0, 2).map((banner) => (
            <div 
              key={banner.id}
              className="relative overflow-hidden rounded-[var(--tt-radius-xl)] aspect-[4/5] sm:aspect-square md:aspect-[4/3] group"
            >
              {/* Background Image */}
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-110"
                style={{ backgroundImage: `url(${banner.image})` }}
              />
              
              {/* Gradient Overlay */}
              <div 
                className={`absolute inset-0 ${
                  banner.theme === 'dark' 
                    ? 'bg-gradient-to-t from-black/80 via-black/20 to-transparent' 
                    : 'bg-gradient-to-t from-black/60 via-transparent to-transparent'
                }`}
              />

              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8 md:p-10 z-10">
                <span className="text-white/80 font-medium tracking-[0.2em] uppercase text-xs sm:text-sm mb-2 drop-shadow-md">
                  {banner.label}
                </span>
                <h2 className="font-['Syne',sans-serif] text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-6 leading-none drop-shadow-lg">
                  {banner.title}
                </h2>
                <div>
                  <Link 
                    href={banner.cta.href}
                    className="inline-flex items-center justify-center bg-white text-black font-bold px-6 py-3 rounded-full text-sm hover:bg-black hover:text-white transition-colors duration-300 shadow-lg"
                  >
                    {banner.cta.label}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Global Promos Bar */}
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          {['Free Shipping over $100', 'Student Discount 15% Off', 'Free Returns'].map((promo, i) => (
            <div key={i} className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs sm:text-sm font-medium px-4 py-2 rounded-full">
              {promo}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
