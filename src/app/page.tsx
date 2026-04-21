'use client';

import { useState, useCallback } from 'react';
import HeroSection from '@/components/HeroSection';
import ProductToggle from '@/components/ProductToggle';
import { nimbuPaniConfig } from '@/data/products/nimbupani';
import { jeeruConfig } from '@/data/products/jeeru';
import { ProductConfig } from '@/types/product';

/**
 * Product registry — add new products here.
 * The toggle and hero automatically adapt to any number of entries.
 */
const PRODUCTS: ProductConfig[] = [nimbuPaniConfig, jeeruConfig];

export default function Home() {
  const [activeId, setActiveId] = useState(PRODUCTS[0].id);

  const activeProduct = PRODUCTS.find((p) => p.id === activeId) ?? PRODUCTS[0];

  // Stable callback prevents re-renders in toggle on every frame
  const handleSwitch = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Product toggle — positioned absolutely over the hero */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[100]">
        <ProductToggle
          products={PRODUCTS}
          activeId={activeId}
          onSwitch={handleSwitch}
        />
      </div>

      {/* Hero section — handles all animation, background, and parallax */}
      <HeroSection product={activeProduct} />
    </main>
  );
}
