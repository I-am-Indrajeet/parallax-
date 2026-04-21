'use client';

import { useEffect, useCallback } from 'react';
import { MotionValue } from 'framer-motion';

/**
 * useMouseParallax
 * ────────────────
 * Pure desktop cursor tracking. Writes normalized -1..+1 values to
 * the provided MotionValues. Does nothing on touch-only devices.
 *
 * Why separate from gyro/unified?
 * Each input source has different concerns (listeners, cleanup, platform
 * checks). Keeping them isolated makes each hook testable and debuggable.
 *
 * Performance: Uses passive event listeners. Writes directly to MotionValues
 * (no React state updates, no re-renders). Framer Motion schedules the
 * MotionValue updates on the next animation frame automatically.
 */
export function useMouseParallax(
  containerRef: React.RefObject<HTMLElement | null>,
  outputX: MotionValue<number>,
  outputY: MotionValue<number>,
  enabled: boolean = true
) {
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();

      // Normalize to -1 (left/top edge) to +1 (right/bottom edge)
      // Center of container = 0,0
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;

      outputX.set(x);
      outputY.set(y);
    },
    [containerRef, outputX, outputY]
  );

  const handleMouseLeave = useCallback(() => {
    // Smoothly return to center — the spring in useUnifiedParallax
    // will animate this transition, so it feels natural
    outputX.set(0);
    outputY.set(0);
  }, [outputX, outputY]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !enabled) return;

    // Safety: skip on touch-only devices even if enabled flag is wrong
    if (window.matchMedia('(hover: none)').matches) return;

    el.addEventListener('mousemove', handleMouseMove, { passive: true });
    el.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [containerRef, enabled, handleMouseMove, handleMouseLeave]);
}
