'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';

const Carousel = ({ 
  children, 
  showArrows = true, 
  showDots = true, 
  autoPlay = false, 
  interval = 4000, 
  className = '',
  itemClassName = '',
  autoWidth = false,
  trackClassName = '',
  padding = 0,
  itemWidth = null}) => {
  const scrollRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const items = React.Children.toArray(children);
  let itemStyles = {};
  if(itemWidth){
    itemStyles.width = itemWidth;
  }

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, children } = scrollRef.current;
    if (children.length === 0) return;
    
    let minDiff = Infinity;
    let newIndex = activeIndex;
    
    const firstChildOffset = children[0].offsetLeft;

    Array.from(children).forEach((child, idx) => {
      // Find distance ignoring initial container padding
      const childRelativeLeft = child.offsetLeft - firstChildOffset;
      const diff = Math.abs(childRelativeLeft - scrollLeft);
      if (diff < minDiff) {
        minDiff = diff;
        newIndex = idx;
      }
    });

    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
    }
  }, [activeIndex]);

  const scrollTo = (index) => {
    if (!scrollRef.current) return;
    const { children } = scrollRef.current;
    if (children[index] && children[0]) {
      const firstChildOffset = children[0].offsetLeft;
      const leftPos = children[index].offsetLeft - firstChildOffset;
      scrollRef.current.scrollTo({
        left: leftPos,
        behavior: 'smooth'
      });
    }
  };

  const next = useCallback(() => {
    if (activeIndex >= items.length - 1) {
      scrollTo(0);
    } else {
      scrollTo(activeIndex + 1);
    }
  }, [activeIndex, items.length]);

  const prev = () => {
    if (activeIndex <= 0) {
      scrollTo(items.length - 1);
    } else {
      scrollTo(activeIndex - 1);
    }
  };

  useEffect(() => {
    if (!autoPlay) return;
    const timer = setInterval(() => {
      next();
    }, interval);
    return () => clearInterval(timer);
  }, [autoPlay, interval, next]);

  if (!items.length) return null;

  return (
    <div className={`relative group overflow-hidden ${className}`}>
      {/* Carousel Track */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className={`flex overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-smooth w-full h-full mb-3 ${trackClassName}`}
        style={padding ? { paddingLeft: `${padding}px`, paddingRight: `${padding}px` } : undefined}
      >
        {items.map((item, idx) => (
          <div
            style={itemStyles} 
            key={idx} 
            className={`flex-none  snap-start relative scroll-ml-16 ${autoWidth ? 'w-auto' : 'w-full'} ${itemClassName}`}
          >
            {item}
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {showArrows && items.length > 1 && (
        <>
          <button 
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/30 dark:bg-black/40 text-black dark:text-white backdrop-blur-md border border-white/40 dark:border-white/10 opacity-0 group-hover:opacity-100 transition-all hover:bg-white/50 dark:hover:bg-black/60 z-10 shadow-lg hover:scale-105 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-[var(--tt-flame)]"
            aria-label="Previous slide"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <button 
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/30 dark:bg-black/40 text-black dark:text-white backdrop-blur-md border border-white/40 dark:border-white/10 opacity-0 group-hover:opacity-100 transition-all hover:bg-white/50 dark:hover:bg-black/60 z-10 shadow-lg hover:scale-105 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-[var(--tt-flame)]"
            aria-label="Next slide"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </>
      )}

      {/* Dots */}
      {showDots && items.length > 1 && (
        <div className='flex justify-center'>
        <div className="flex items-center gap-2 z-10 backdrop-blur-md px-3 py-2 rounded-full">
          {items.map((_, idx) => (
            <button
              key={idx}
              onClick={() => scrollTo(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 focus:outline-none ${
                activeIndex === idx 
                  ? 'bg-black/60 dark:bg-white/30 w-6 shadow-[0_0_2px_rgba(255,255,255,0.8)]' 
                  : 'bg-black/50 dark:bg-white/50 w-1.5 hover:bg-white/80'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
        </div>
      )}
    </div>
  );
};

export default Carousel;
