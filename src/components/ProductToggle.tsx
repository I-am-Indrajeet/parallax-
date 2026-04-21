'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ProductConfig } from '@/types/product';

interface ProductToggleProps {
  products: ProductConfig[];
  activeId: string;
  onSwitch: (id: string) => void;
}

/**
 * ProductToggle
 * ─────────────
 * Premium pill-shaped toggle component for switching between products.
 *
 * Features:
 * - Glassmorphic container with backdrop blur
 * - Animated sliding pill indicator (layoutId transition)
 * - Theme-adaptive active text color from product config
 * - Smooth hover and press feedback
 * - Accessible: visible focus states, clear active indication
 * - Scalable: works with any number of products
 */
export default function ProductToggle({ products, activeId, onSwitch }: ProductToggleProps) {
  const activeProduct = products.find(p => p.id === activeId);
  const accentColor = activeProduct?.theme.accentText || '#333';

  return (
    <div
      className="relative z-[100] flex items-center gap-0.5 p-1 rounded-full border border-white/20 shadow-2xl"
      style={{
        background: 'rgba(255,255,255,0.12)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
      role="tablist"
      aria-label="Product selector"
    >
      {products.map((product) => {
        const isActive = product.id === activeId;
        return (
          <button
            key={product.id}
            onClick={() => onSwitch(product.id)}
            role="tab"
            aria-selected={isActive}
            className="relative z-10 px-5 py-2.5 rounded-full text-sm font-semibold tracking-wide transition-colors duration-300 cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-white/50 focus-visible:outline-offset-2"
            style={{
              color: isActive ? accentColor : 'rgba(255,255,255,0.85)',
            }}
          >
            {/* Sliding pill indicator — uses layoutId for shared layout animation */}
            {isActive && (
              <motion.div
                layoutId="toggle-pill"
                className="absolute inset-0 rounded-full bg-white shadow-lg"
                transition={{
                  type: 'spring',
                  stiffness: 350,
                  damping: 30,
                  mass: 0.8,
                }}
                style={{ zIndex: -1 }}
              />
            )}
            {product.name}
          </button>
        );
      })}
    </div>
  );
}
