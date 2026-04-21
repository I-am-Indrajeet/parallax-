'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, useTransform, MotionValue } from 'framer-motion';
import { ProductConfig, Asset, DepthLayer } from '@/types/product';
import { useUnifiedParallax } from '@/hooks/useUnifiedParallax';
import AnimatedBackground from './AnimatedBackground';

// ============================================================================
// CONFIGURATION
// ============================================================================

/** Set true to show bounding boxes for layout debugging */
const SHOW_DEBUG = false;

/**
 * Depth multipliers — desktop values (pixels of max displacement)
 * ────────────────────────────────────────────────────────────────
 * These define how far each depth layer moves in response to input.
 * Values are deliberately restrained:
 *
 * - background: ±5px x, ±3px y — atmospheric drift, barely moves
 * - mid:        ±12px x, ±8px y — noticeable depth separation
 * - hero:       ±8px x, ±5px y + ±1.5° rotation — subtle 3D tilt
 * - foreground: ±18px x, ±14px y — strongest parallax, nearest layer
 *
 * Why these ranges? Premium motion is always measured. If you can
 * spot the parallax, it's working. If it's dramatic, it's too much.
 */
const DEPTH_DESKTOP: Record<DepthLayer, { x: number; y: number; rotate: number }> = {
  background: { x: 6.5, y: 3.9, rotate: 0 },
  mid:        { x: 15.6, y: 10.4, rotate: 0 },
  foreground: { x: 23.4, y: 18.2, rotate: 0 },
  hero:       { x: 10.4, y: 6.5, rotate: 1.95 },
};

/**
 * Mobile multipliers — scaled to ~60% of desktop.
 *
 * Why reduce on mobile?
 * 1. Same pixel offset is proportionally larger on a smaller screen
 * 2. Gyroscope input is inherently less precise than mouse
 * 3. Excessive motion on mobile can feel destabilizing
 * 4. Mid-range devices need headroom for smooth 60fps
 */
const DEPTH_MOBILE: Record<DepthLayer, { x: number; y: number; rotate: number }> = {
  background: { x: 3.9, y: 2.6, rotate: 0 },
  mid:        { x: 9.1, y: 6.5, rotate: 0 },
  foreground: { x: 14.3, y: 10.4, rotate: 0 },
  hero:       { x: 6.5, y: 3.9, rotate: 1.3 },
};

/**
 * Premium easing curves
 * ─────────────────────
 * - EASE_ENTRANCE: Smooth deceleration for elements entering the scene
 * - EASE_EXIT: Quick acceleration for elements leaving gracefully
 */
const EASE_ENTRANCE = [0.25, 0.46, 0.45, 0.94] as const;

// ============================================================================
// SUB-COMPONENT: Individual Asset Element with Parallax
// ============================================================================

interface AssetElementProps {
  item: Asset;
  smoothX: MotionValue<number>;
  smoothY: MotionValue<number>;
  /** Whether to use mobile-scaled depth multipliers */
  isMobile: boolean;
}

/**
 * AssetElement
 * ────────────
 * Renders a single asset with 4 nested motion layers:
 *
 * 1. Positioning wrapper    — absolute position, responsive width
 * 2. Parallax layer         — cursor/gyro reactive (GPU-only transforms)
 * 3. Entrance/exit layer    — AnimatePresence mount/unmount transitions
 * 4. Idle float layer       — continuous subtle ambient animation
 *
 * Z-index strategy:
 * - 0: ground shadow
 * - 1: background splash / ambient shapes
 * - 2-3: mid-ground elements (seeds, tucked slices)
 * - 4: foreground ingredients (lime, lemon, mint, bowl)
 * - 5: hero bottle (central focal point)
 * - 6: foreground glass/overlay elements
 */
function AssetElement({ item, smoothX, smoothY, isMobile }: AssetElementProps) {
  const depthMap = isMobile ? DEPTH_MOBILE : DEPTH_DESKTOP;
  const multipliers = depthMap[item.depth];

  // Parallax transforms derived from spring-smoothed normalized values.
  // useTransform is computed on Framer Motion's animation frame —
  // zero React re-renders, pure GPU transform updates.
  const parallaxX = useTransform(smoothX, [-1, 1], [-multipliers.x, multipliers.x]);
  const parallaxY = useTransform(smoothY, [-1, 1], [-multipliers.y, multipliers.y]);
  const parallaxRotate = useTransform(
    smoothX,
    [-1, 1],
    [-multipliers.rotate, multipliers.rotate]
  );

  // Resolve responsive width from config
  const wBase = typeof item.width === 'string' ? item.width : item.width.base;
  const wMd = typeof item.width === 'string' ? item.width : item.width.md;
  const wLg = typeof item.width === 'string' ? item.width : item.width.lg;

  // Build exit animation — use explicit exit config or reverse the entrance
  const exitAnim = item.exit
    ? {
        opacity: item.exit.opacity,
        x: item.exit.x ?? 0,
        y: item.exit.y ?? 0,
        scale: item.exit.scale ?? 1,
      }
    : {
        opacity: 0,
        x: -(item.entrance.x?.[0] ?? 0) * 0.5,
        y: -(item.entrance.y?.[0] ?? 0) * 0.5,
        scale: 0.95,
      };

  return (
    <div
      className="absolute pointer-events-none w-[var(--w-base)] md:w-[var(--w-md)] lg:w-[var(--w-lg)]"
      style={{
        '--w-base': wBase,
        '--w-md': wMd,
        '--w-lg': wLg,
        left: item.left,
        top: item.top,
        zIndex: item.zIndex,
        transform: 'translate(-50%, -50%)',
        ...(item.height ? { height: item.height } : {}),
      } as React.CSSProperties}
    >
      {SHOW_DEBUG && (
        <div className="absolute inset-0 border border-red-500/40 z-[100] border-dashed bg-red-500/10" />
      )}

      {/* Layer 1: Parallax — GPU-only transforms via motion values */}
      <motion.div
        className="w-full h-full"
        style={{
          x: parallaxX,
          y: parallaxY,
          rotate: parallaxRotate,
          // will-change hint for the parallax layer specifically.
          // Only applied here (not on idle/entrance layers) to avoid
          // excessive GPU memory usage from too many promoted layers.
          willChange: 'transform',
        }}
      >
        {/* Layer 2: Entrance/exit transitions — controlled by AnimatePresence */}
        <motion.div
          className="w-full h-full"
          initial={{
            opacity: item.entrance.opacity?.[0] ?? 0,
            x: item.entrance.x?.[0] ?? 0,
            y: item.entrance.y?.[0] ?? 0,
            scale: item.entrance.scale?.[0] ?? 1,
            rotate: item.baseRotate ?? 0,
          }}
          animate={{
            opacity: item.entrance.opacity?.[1] ?? 1,
            x: item.entrance.x?.[1] ?? 0,
            y: item.entrance.y?.[1] ?? 0,
            scale: item.entrance.scale?.[1] ?? 1,
            rotate: item.baseRotate ?? 0,
          }}
          exit={{
            ...exitAnim,
            rotate: item.baseRotate ?? 0,
          }}
          transition={{
            duration: item.entrance.duration,
            delay: item.entrance.delay,
            ease: [...EASE_ENTRANCE],
          }}
        >
          {/* Layer 3: Idle floating — organic ambient life when not interacting */}
          <motion.div
            className="w-full h-full"
            animate={
              item.idle
                ? {
                    y: item.idle.y,
                    rotate: item.idle.rotate,
                  }
                : {}
            }
            transition={
              item.idle
                ? {
                    duration: item.idle.duration,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    // Idle starts after entrance completes for sequenced feel
                    delay: item.entrance.delay + item.entrance.duration,
                  }
                : {}
            }
          >
            {/* Visual render: shadow element or image */}
            {item.isShadow ? (
              <div className="w-full h-full rounded-full" style={{ ...item.style }} />
            ) : (
              <div
                className="w-full h-auto"
                style={{
                  opacity: item.opacity ?? 1,
                  filter: item.dropShadow,
                }}
              >
                <Image
                  src={item.src!}
                  alt={item.alt!}
                  width={800}
                  height={800}
                  className="w-full h-auto"
                  priority={item.priority}
                />
              </div>
            )}
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Debug label */}
      {SHOW_DEBUG && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-mono tracking-wider bg-black/90 text-white px-2 py-0.5 rounded whitespace-nowrap z-[100] shadow-xl">
          {item.id} ({item.depth})
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT: HeroSection
// ============================================================================

interface HeroSectionProps {
  product: ProductConfig;
}

/**
 * HeroSection
 * ───────────
 * Premium animated product hero with unified parallax system:
 *
 * Desktop: cursor-reactive parallax with spring smoothing
 * Mobile:  gyroscope parallax with EMA + spring smoothing
 * Fallback: idle floating animations (no interactive parallax)
 *
 * Key architecture decisions:
 * - AnimatePresence mode="sync" for overlapping cross-fade between products
 * - Unified parallax hook handles all device detection internally
 * - Depth multipliers are device-aware (reduced on mobile)
 * - Motion permission overlay only appears on iOS when needed
 * - All parallax uses useTransform → GPU transforms → zero re-renders
 *
 * Adding a new product: Create a ProductConfig object, add to the
 * PRODUCTS array in page.tsx. Zero code changes needed here.
 */
export default function HeroSection({ product }: HeroSectionProps) {
  const {
    smoothX,
    smoothY,
    containerRef,
    gyroStatus,
    requestGyroPermission,
    isDesktop,
  } = useUnifiedParallax();

  // Sort assets by z-index for correct paint order
  const sortedAssets = useMemo(
    () => [...product.assets].sort((a, b) => a.zIndex - b.zIndex),
    [product.assets]
  );

  return (
    <section
      ref={containerRef as React.RefObject<HTMLElement>}
      className="relative w-full min-h-screen overflow-hidden flex items-center justify-center p-4 sm:p-8"
    >
      {/* Animated layered background — morphs colors smoothly between products */}
      <AnimatedBackground theme={product.theme} productId={product.id} />

      {/*
        Hero Composition Canvas
        ────────────────────────
        Fixed aspect ratio container that serves as the coordinate
        space for all absolutely-positioned assets.
      */}
      <div className="relative flex-none aspect-[682/586] pointer-events-none w-[92vw] md:w-[75vw] lg:w-[clamp(560px,60vw,760px)] z-10">
        {/*
          AnimatePresence mode="sync" — outgoing and incoming products
          overlap during transition for a seamless cross-fade. mode="wait"
          would create a visible gap between exit and enter.
        */}
        <AnimatePresence mode="sync">
          <motion.div
            key={product.id}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            {sortedAssets.map((asset) => (
              <AssetElement
                key={asset.id}
                item={asset}
                smoothX={smoothX}
                smoothY={smoothY}
                isMobile={!isDesktop}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
