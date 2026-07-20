import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

/**
 * Client-side Lazy Load Component
 * Uses IntersectionObserver API for better performance
 */
function LazyLoadClient({ children, placeholder, className = '', classNamePrefix = 'lazyload', height, offset = 500, once = true, overflow = false, resize = false, scroll = true, throttle, debounce, scrollContainer, unmountIfInvisible = false, style, report = false }) {

  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const elementRef = useRef(null);

  // IntersectionObserver callback - fixed to avoid stale closures
  const handleIntersection = useCallback((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        // Element entered viewport
        setIsVisible(true);
        setHasBeenVisible(true);
      } else if (!once) {
        // Element left viewport and once is false, so hide it
        setIsVisible(false);
      }
      // If once is true and element left viewport, keep it visible
    });
  }, [once]);

  // Setup IntersectionObserver
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Determine root element
    let root = null;
    if (scrollContainer) {
      if (typeof scrollContainer === 'string') {
        root = document.querySelector(scrollContainer);
      } else if (scrollContainer instanceof HTMLElement) {
        root = scrollContainer;
      }
    }

    // Parse offset properly - handle both single value and array formats
    // Support: number, [vertical, horizontal], or [top, right, bottom, left]
    let rootMargin;
    if (Array.isArray(offset)) {
      if (offset.length === 2) {
        // [vertical, horizontal]
        const [vertical, horizontal] = offset;
        rootMargin = `${vertical}px ${horizontal}px ${vertical}px ${horizontal}px`;
      } else if (offset.length === 4) {
        // [top, right, bottom, left]
        const [top, right, bottom, left] = offset;
        rootMargin = `${top}px ${right}px ${bottom}px ${left}px`;
      } else {
        // Fallback to first value
        rootMargin = `${offset[0]}px`;
      }
    } else {
      // Single number value
      rootMargin = `${offset}px`;
    }

    // Create observer options
    const observerOptions = {
      root,
      rootMargin,
      threshold: 0,
    };

    // Create and start observing
    const observer = new IntersectionObserver(handleIntersection, observerOptions);
    observer.observe(element);

    // Cleanup
    return () => {
      observer.disconnect();
    };
  }, [scrollContainer, offset, handleIntersection]);

  // Determine visibility state (matches old component's this.visible logic) - optimized with useMemo
  const visible = useMemo(() => once ? hasBeenVisible : isVisible, [once, hasBeenVisible, isVisible]);

  // Position reporting functionality
  useEffect(() => {
    if (!report || !elementRef.current) return;

    const element = elementRef.current;
    const scrollTarget = scrollContainer ?
      (typeof scrollContainer === 'string' ? document.querySelector(scrollContainer) : scrollContainer) :
      window;

    const handleScroll = () => {
      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const viewportWidth = window.innerWidth || document.documentElement.clientWidth;

      // Calculate distances from viewport edges (for offset determination)
      const distanceFromTop = rect.top; // Negative = above viewport
      const distanceFromBottom = rect.bottom - viewportHeight; // Positive = below viewport
      const distanceFromLeft = rect.left; // Negative = left of viewport
      const distanceFromRight = rect.right - viewportWidth; // Positive = right of viewport

      // Determine position relative to viewport
      const position = distanceFromTop < 0 ? 'above' :
                      distanceFromBottom > 0 ? 'below' :
                      distanceFromLeft < 0 ? 'left' :
                      distanceFromRight > 0 ? 'right' : 'in-viewport';

      console.log('LazyLoad Offset Report:', {
        // Distances from viewport edges (use these for offset values)
        top: Math.round(distanceFromTop),
        bottom: Math.round(distanceFromBottom),
        left: Math.round(distanceFromLeft),
        right: Math.round(distanceFromRight),

        // Element info
        width: Math.round(rect.width),
        height: Math.round(rect.height),

        // Position summary
        position,

        // Scroll context
        scrollY: Math.round(window.scrollY || window.pageYOffset),
        scrollContainer: scrollContainer || 'window'
      });
    };

    // Add scroll listener
    scrollTarget.addEventListener('scroll', handleScroll, { passive: true });

    // Initial report
    handleScroll();

    // Cleanup
    return () => {
      scrollTarget.removeEventListener('scroll', handleScroll);
    };
  }, [report, scrollContainer]);

  // Render content with Suspense support for lazy components
  const renderContent = () => {
    if (!visible) {
      return placeholder ? (
        placeholder
      ) : (
        <div
          style={{ height: height }}
          className={`${classNamePrefix}-placeholder`}
        />
      );
    }

    // Handle Suspense for React.lazy components
    if (React.isValidElement(children) && children.type?.$$typeof === Symbol.for('react.lazy')) {
      return (
        <React.Suspense fallback={placeholder}>
          {children}
        </React.Suspense>
      );
    }

    return children;
  };

  return (
    <div
      ref={elementRef}
      className={`${classNamePrefix}-wrapper client ${className}`}
      style={style}
    >
      {renderContent()}
    </div>
  );
}

export default LazyLoadClient;