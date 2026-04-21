/**
 * Product Configuration Type System
 * ----------------------------------
 * Every animation parameter is data-driven so new products can be added
 * by simply creating a new config object — no animation code changes needed.
 */

export type ResponsiveWidth = string | { base: string; md: string; lg: string };

/**
 * Depth layer controls how strongly an element reacts to cursor movement.
 * - 'background' → slowest, softest movement (splashes, glows)
 * - 'mid'        → moderate movement (bowls, secondary fruit)
 * - 'foreground' → strongest movement (nearby ingredients)
 * - 'hero'       → special: very subtle tilt + shift (the bottle)
 *
 * Multipliers are defined in the parallax hook for consistency.
 */
export type DepthLayer = 'background' | 'mid' | 'foreground' | 'hero';

export interface Asset {
  id: string;
  src?: string;
  alt?: string;
  isShadow?: boolean;
  zIndex: number;
  left: string;
  top: string;
  width: ResponsiveWidth;
  height?: string;
  opacity?: number;
  baseRotate?: number;
  dropShadow?: string;
  style?: React.CSSProperties;
  priority?: boolean;

  /** Which parallax depth layer this element belongs to */
  depth: DepthLayer;

  /** Entrance animation — plays when this product mounts */
  entrance: {
    opacity?: [number, number];
    x?: [number, number];
    y?: [number, number];
    scale?: [number, number];
    duration: number;
    delay: number;
  };

  /** Exit animation — plays when this product unmounts.
   *  If omitted, a sensible default is generated from entrance (reversed). */
  exit?: {
    opacity?: number;
    x?: number;
    y?: number;
    scale?: number;
    duration: number;
  };

  /** Continuous idle floating animation */
  idle?: {
    y?: number[];
    rotate?: number[];
    duration: number;
  };
}

/** Theme color tokens for smooth background transitions */
export interface ThemeColors {
  /** Main background gradient stops */
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;

  /** Radial glow behind the bottle */
  glowColor: string;
  glowOpacity: number;

  /** Vignette darkness at edges */
  vignetteOpacity: number;

  /** Toggle button active text color */
  accentText: string;
}

export interface ProductConfig {
  id: string;
  name: string;
  /** Direct background style (kept for compatibility) */
  backgroundStyle: React.CSSProperties;
  /** Theme color tokens for animated background layers */
  theme: ThemeColors;
  assets: Asset[];
}
