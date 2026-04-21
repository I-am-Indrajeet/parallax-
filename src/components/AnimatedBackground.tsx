'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ThemeColors } from '@/types/product';

interface AnimatedBackgroundProps {
  theme: ThemeColors;
  productId: string;
}

/**
 * AnimatedBackground
 * ──────────────────
 * Three-layer animated background that smoothly morphs between product themes:
 *
 * 1. Base gradient layer — the main radial color gradient
 * 2. Central glow — soft radial illumination behind the bottle
 * 3. Edge vignette — subtle darkening at edges for depth
 *
 * All transitions use CSS-level interpolation via Framer Motion's
 * `animate` prop for GPU-accelerated color morphing.
 * No harsh cuts — colors blend over 0.8s with easeInOut.
 */
export default function AnimatedBackground({ theme }: AnimatedBackgroundProps) {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Layer 1: Main radial gradient — defines the dominant color feel */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: `radial-gradient(circle at 50% 50%, ${theme.bgPrimary} 0%, ${theme.bgSecondary} 55%, ${theme.bgTertiary} 100%)`,
        }}
        transition={{
          duration: 0.8,
          ease: [0.4, 0, 0.2, 1], // Material Design standard easing
        }}
      />

      {/* Layer 2: Central glow — premium soft radiance behind bottle area */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: `radial-gradient(ellipse 50% 60% at 50% 55%, ${theme.glowColor} 0%, transparent 70%)`,
          opacity: theme.glowOpacity,
        }}
        transition={{
          duration: 1.0,
          ease: 'easeInOut',
        }}
      />

      {/* Layer 3: Edge vignette — adds cinematic depth framing */}
      <motion.div
        className="absolute inset-0"
        animate={{
          opacity: theme.vignetteOpacity,
        }}
        transition={{
          duration: 0.8,
          ease: 'easeInOut',
        }}
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 35%, rgba(0,0,0,1) 100%)',
        }}
      />
    </div>
  );
}
