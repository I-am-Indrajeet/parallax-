'use client';

import { useRef, useEffect, useState } from 'react';
import { useMotionValue, useSpring, MotionValue } from 'framer-motion';
import { useMouseParallax } from './useMouseParallax';
import { useGyroParallax, GyroStatus } from './useGyroParallax';

// ============================================================================
// SPRING CONFIGURATION
// ============================================================================

/**
 * Spring config for the final output smoothing layer.
 *
 * This is the "luxury feel" layer — it sits on top of whatever input
 * source is active (mouse or EMA-smoothed gyro) and adds the premium
 * buttery tracking that defines high-end product motion.
 *
 * Tuning rationale:
 * - stiffness 50: low enough to prevent snappy tracking, high enough
 *   that the effect is clearly responsive to input
 * - damping 28: prevents overshoot while allowing smooth settling
 * - mass 1.2: slightly heavy feel for luxury inertia
 * - restDelta 0.001: prevents micro-jitter at rest position
 *
 * These values create roughly a 0.3s smooth response time.
 */
const SPRING_CONFIG = {
  stiffness: 50,
  damping: 28,
  mass: 1.2,
  restDelta: 0.001,
};

// ============================================================================
// TYPES
// ============================================================================

/**
 * Current motion input mode:
 * - 'mouse' → desktop cursor tracking active
 * - 'gyro'  → mobile gyroscope active
 * - 'idle'  → no interactive input, fallback to idle animations
 * - 'disabled' → user prefers reduced motion
 */
export type MotionMode = 'mouse' | 'gyro' | 'idle' | 'disabled';

export interface UnifiedParallaxResult {
  /** Spring-smoothed normalized X: -1 (left) to +1 (right) */
  smoothX: MotionValue<number>;
  /** Spring-smoothed normalized Y: -1 (top) to +1 (bottom) */
  smoothY: MotionValue<number>;
  /** Attach this ref to the hero container element */
  containerRef: React.RefObject<HTMLElement | null>;
  /** Current active input mode */
  motionMode: MotionMode;
  /** Gyroscope permission state (relevant on iOS mobile) */
  gyroStatus: GyroStatus;
  /** Call this to request iOS gyroscope permission */
  requestGyroPermission: () => Promise<void>;
  /** True if the device supports hover (desktop) */
  isDesktop: boolean;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * useUnifiedParallax
 * ──────────────────
 * Orchestrates all parallax input sources into a single clean interface.
 *
 * Architecture:
 *
 *   Mouse input (desktop)  ──┐
 *                            ├──→ rawX/rawY ──→ useSpring ──→ smoothX/smoothY
 *   Gyro input (mobile)   ──┘
 *
 * Only one input source is active at a time. The unified hook:
 * 1. Detects device type (hover-capable vs touch-only)
 * 2. Detects prefers-reduced-motion
 * 3. Enables the appropriate input source
 * 4. Applies spring smoothing to the output
 * 5. Exposes gyro permission state for the UI layer
 *
 * When no input source is active (denied, unavailable, or reduced motion),
 * values stay at 0 and the existing idle CSS/Framer animations provide
 * the fallback ambient motion.
 */
export function useUnifiedParallax(): UnifiedParallaxResult {
  const containerRef = useRef<HTMLElement | null>(null);
  const [isDesktop, setIsDesktop] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Raw input values — written to by whichever input source is active.
  // These are NOT spring-smoothed yet.
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  // Spring-smoothed output — this is what the UI consumes.
  // The spring adds the luxury feel on top of raw (or EMA-smoothed) input.
  const smoothX = useSpring(rawX, SPRING_CONFIG);
  const smoothY = useSpring(rawY, SPRING_CONFIG);

  // ── Detect device capabilities and user preferences ──
  useEffect(() => {
    // Hover capability distinguishes desktop from mobile
    const hoverQuery = window.matchMedia('(hover: hover)');
    setIsDesktop(hoverQuery.matches);

    const handleHoverChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    hoverQuery.addEventListener('change', handleHoverChange);

    // Reduced motion preference
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(motionQuery.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    motionQuery.addEventListener('change', handleMotionChange);

    return () => {
      hoverQuery.removeEventListener('change', handleHoverChange);
      motionQuery.removeEventListener('change', handleMotionChange);
    };
  }, []);

  // Compute enabled flags — only one source active at a time
  const motionAllowed = !reducedMotion;
  const mouseEnabled = motionAllowed && isDesktop;
  const gyroEnabled = motionAllowed && !isDesktop;

  // ── Input sources ──
  // Each hook is a no-op when its enabled flag is false
  useMouseParallax(containerRef, rawX, rawY, mouseEnabled);
  const { status: gyroStatus, requestPermission } = useGyroParallax(
    rawX,
    rawY,
    gyroEnabled
  );

  // ── Determine current motion mode for UI feedback ──
  let motionMode: MotionMode = 'idle';
  if (!motionAllowed) {
    motionMode = 'disabled';
  } else if (isDesktop) {
    motionMode = 'mouse';
  } else if (gyroStatus === 'granted') {
    motionMode = 'gyro';
  } else {
    // Mobile but gyro not yet granted/available — idle fallback.
    // The existing idle animations in each asset config provide
    // ambient motion so the experience still feels premium.
    motionMode = 'idle';
  }

  return {
    smoothX,
    smoothY,
    containerRef,
    motionMode,
    gyroStatus,
    requestGyroPermission: requestPermission,
    isDesktop,
  };
}
