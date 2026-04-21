/**
 * @deprecated — This file is replaced by the unified parallax system.
 *
 * New architecture:
 * - useMouseParallax.ts  → desktop cursor tracking
 * - useGyroParallax.ts   → mobile gyroscope + iOS permission
 * - useUnifiedParallax.ts → orchestrator (import this one)
 *
 * This file re-exports from the unified hook for backward compatibility
 * in case any other component still imports from here.
 */

export { useUnifiedParallax as useCursorParallax } from './useUnifiedParallax';
export type { UnifiedParallaxResult as CursorParallaxValues } from './useUnifiedParallax';

import { DepthLayer } from '@/types/product';

/** @deprecated Use depth multipliers defined in HeroSection.tsx instead */
const DEPTH_MULTIPLIERS: Record<DepthLayer, { x: number; y: number; rotate: number }> = {
  background: { x: 5, y: 3, rotate: 0 },
  mid:        { x: 12, y: 8, rotate: 0 },
  foreground: { x: 18, y: 14, rotate: 0 },
  hero:       { x: 8, y: 5, rotate: 1.5 },
};

/** @deprecated Use depth multipliers defined in HeroSection.tsx instead */
export function getDepthMultipliers(depth: DepthLayer) {
  return DEPTH_MULTIPLIERS[depth];
}
