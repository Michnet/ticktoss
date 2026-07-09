'use client';

import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from './ProductCard';

/**
 * ProductGrid
 * Renders an animated grid of ProductCard components.
 * Sort transitions are handled smoothly by Framer Motion.
 * 
 * @param {{ products: Array }} props
 */
export default function ProductGrid({ products = [] }) {
  if (!products || products.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--tt-muted)' }}>
        <p>No products found matching your criteria.</p>
      </div>
    );
  }

  return (
    <motion.div 
      className="grid sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] grid-cols-2 gap-[0.875rem]"
      layout
    >
      <AnimatePresence>
        {products.map((product, index) => (
          <ProductCard 
            key={product.id} 
            product={product} 
            rank={index} 
            priority={index < 4} // prioritize loading first 4 images
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
