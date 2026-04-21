'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MotionPermissionOverlayProps {
  /** Whether to show the permission prompt */
  visible: boolean;
  /** Callback to trigger iOS DeviceOrientationEvent.requestPermission() */
  onRequest: () => Promise<void>;
}

/**
 * MotionPermissionOverlay
 * ───────────────────────
 * A minimal, elegant overlay button for requesting iOS gyroscope permission.
 *
 * Design decisions:
 * - Positioned at the bottom of the hero to avoid obstructing content
 * - Glassmorphic frosted pill style matches the product toggle
 * - Small and unobtrusive — doesn't feel like a modal or blocking prompt
 * - Fades in/out with AnimatePresence for polish
 * - Only appears on iOS devices that require explicit motion permission
 *
 * If the user denies permission, this overlay disappears and the
 * experience gracefully falls back to idle floating animation.
 */
export default function MotionPermissionOverlay({
  visible,
  onRequest,
}: MotionPermissionOverlayProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{
            duration: 0.5,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          className="absolute bottom-8 left-1/2 z-[90]"
          style={{ transform: 'translateX(-50%)' }}
        >
          <button
            onClick={onRequest}
            className="
              flex items-center gap-2 px-5 py-3 rounded-full
              text-sm font-medium text-white/90 tracking-wide
              border border-white/20
              shadow-xl
              cursor-pointer
              transition-all duration-300
              hover:bg-white/20 hover:scale-[1.02]
              active:scale-[0.98]
              focus-visible:outline-2 focus-visible:outline-white/50 focus-visible:outline-offset-2
            "
            style={{
              background: 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
            }}
            aria-label="Enable motion effects for interactive parallax"
          >
            {/* Subtle motion icon — a simple wavy line suggesting movement */}
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-70"
              aria-hidden="true"
            >
              <path d="M2 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0" />
              <path d="M2 6c2-3 4-3 6 0s4 3 6 0 4-3 6 0" />
              <path d="M2 18c2-3 4-3 6 0s4 3 6 0 4-3 6 0" />
            </svg>
            Enable Motion
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
