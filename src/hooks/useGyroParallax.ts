'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { MotionValue } from 'framer-motion';

// ============================================================================
// GYROSCOPE TUNING CONSTANTS
// ============================================================================

/**
 * Clamp ranges for device orientation input.
 *
 * Why these specific values?
 * - GAMMA (left-right tilt): ±25° covers natural phone-in-hand range.
 *   Beyond 25° the user is rotating their phone unnaturally.
 * - BETA (front-back tilt): ±15° is even more conservative because
 *   forward/backward tilting is less intentional than left-right.
 *
 * These limits prevent wild jumps when the phone crosses gimbal lock
 * angles or when the user rotates their phone dramatically.
 */
const GAMMA_CLAMP = 19.2; // left-right tilt, degrees (Snappier: 25 / 1.3)
const BETA_CLAMP = 11.5;  // front-back tilt, degrees (Snappier: 15 / 1.3)

/**
 * Exponential moving average (EMA) smoothing factor.
 *
 * Lower values = smoother but laggier response.
 * Higher values = more responsive but may show sensor jitter.
 *
 * 0.15 provides a more direct, "harder" response while still
 * filtering high-frequency sensor noise.
 */
const SMOOTH_ALPHA = 0.15;

// ============================================================================
// TYPES
// ============================================================================

/**
 * Gyroscope permission/availability states:
 * - 'checking'    → initial state, detecting capabilities
 * - 'unavailable' → device has no gyroscope or API not supported
 * - 'prompt'      → iOS: user hasn't granted permission yet
 * - 'granted'     → gyroscope is active and streaming data
 * - 'denied'      → user explicitly denied motion permission
 */
export type GyroStatus = 'checking' | 'unavailable' | 'prompt' | 'granted' | 'denied';

export interface GyroParallaxResult {
  status: GyroStatus;
  requestPermission: () => Promise<void>;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * useGyroParallax
 * ───────────────
 * Mobile device orientation tracking with:
 *
 * 1. iOS 13+ permission request handling
 * 2. Strict clamping of beta/gamma values
 * 3. Aggressive EMA smoothing via requestAnimationFrame loop
 * 4. Normalized -1..+1 output to MotionValues
 * 5. Full cleanup of listeners and rAF on unmount
 *
 * The smoothing runs in its own rAF loop (separate from Framer Motion's
 * animation frame) because sensor events fire at variable rates (60-120Hz)
 * and we need to decouple sensor sampling from rendering.
 */
export function useGyroParallax(
  outputX: MotionValue<number>,
  outputY: MotionValue<number>,
  enabled: boolean = true
): GyroParallaxResult {
  const [status, setStatus] = useState<GyroStatus>('checking');

  // Refs for the smoothing loop (no re-renders)
  const smoothedRef = useRef({ x: 0, y: 0 });
  const rawRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  // ── Step 1: Detect gyroscope availability and permission state ──
  useEffect(() => {
    if (!enabled) {
      setStatus('checking');
      return;
    }

    // Check if DeviceOrientation API exists
    if (!('DeviceOrientationEvent' in window)) {
      setStatus('unavailable');
      return;
    }

    // iOS 13+ requires explicit permission via requestPermission()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const DOE = DeviceOrientationEvent as any;
    if (typeof DOE.requestPermission === 'function') {
      setStatus('prompt');
    } else {
      // Android and older iOS: no permission needed, auto-grant
      setStatus('granted');
    }
  }, [enabled]);

  // ── Step 2: Handle raw orientation events ──
  const handleOrientation = useCallback((e: DeviceOrientationEvent) => {
    const gamma = e.gamma ?? 0; // left-right tilt (-90 to 90)
    const beta = e.beta ?? 0;   // front-back tilt (-180 to 180)

    // Strict clamping prevents extreme values from reaching the UI.
    // Without this, crossing gimbal lock angles causes violent jumps.
    const clampedGamma = Math.max(-GAMMA_CLAMP, Math.min(GAMMA_CLAMP, gamma));
    const clampedBeta = Math.max(-BETA_CLAMP, Math.min(BETA_CLAMP, beta));

    // Normalize to -1..+1 range (same contract as mouse parallax)
    rawRef.current.x = clampedGamma / GAMMA_CLAMP;
    rawRef.current.y = clampedBeta / BETA_CLAMP;
  }, []);

  // ── Step 3: EMA smoothing loop ──
  useEffect(() => {
    if (status !== 'granted' || !enabled) return;

    // Start listening for orientation events
    window.addEventListener('deviceorientation', handleOrientation, { passive: true });

    // Smoothing loop: runs every frame, applies EMA to raw sensor data.
    // This eliminates high-frequency jitter before values reach the
    // spring layer in useUnifiedParallax.
    const smoothLoop = () => {
      smoothedRef.current.x += SMOOTH_ALPHA * (rawRef.current.x - smoothedRef.current.x);
      smoothedRef.current.y += SMOOTH_ALPHA * (rawRef.current.y - smoothedRef.current.y);

      outputX.set(smoothedRef.current.x);
      outputY.set(smoothedRef.current.y);

      rafRef.current = requestAnimationFrame(smoothLoop);
    };

    rafRef.current = requestAnimationFrame(smoothLoop);

    // Full cleanup: remove listener and cancel rAF to prevent memory leaks
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [status, enabled, outputX, outputY, handleOrientation]);

  // ── Step 4: iOS permission request handler ──
  const requestPermission = useCallback(async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const DOE = DeviceOrientationEvent as any;
      const result = await DOE.requestPermission();

      if (result === 'granted') {
        setStatus('granted');
      } else {
        setStatus('denied');
      }
    } catch {
      // Permission request failed (user dismissed, or API error)
      setStatus('denied');
    }
  }, []);

  return { status, requestPermission };
}
