/**
 * Performance Tier System
 * Detects device capabilities and provides scaling factors.
 *
 * An inline <script> in <head> sets CSS classes on <html> BEFORE first paint:
 *   .perf-touch          — coarse pointer (touch device)
 *   .perf-reduced-motion — prefers-reduced-motion: reduce
 *   .perf-low-end        — hardwareConcurrency < 4
 *   .perf-no-backdrop    — no backdrop-filter support OR low-end + touch
 *
 * This module provides typed JS access for other scripts.
 */

export interface PerfTier {
  isTouch: boolean;
  isReducedMotion: boolean;
  isLowEnd: boolean;
  noBackdrop: boolean;
  isMobile: boolean;
}

declare global {
  interface Window {
    __perfTier?: PerfTier;
  }
}

export function getPerfTier(): PerfTier {
  if (window.__perfTier) return window.__perfTier;

  /* Fallback — should not be needed if inline head script ran */
  const isTouch = window.matchMedia('(pointer: coarse)').matches;
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isLowEnd = (navigator.hardwareConcurrency || 4) < 4;
  const supportsBackdrop =
    typeof CSS !== 'undefined' && CSS.supports?.('backdrop-filter', 'blur(1px)');
  const noBackdrop = !supportsBackdrop || (isLowEnd && isTouch);

  const tier: PerfTier = {
    isTouch,
    isReducedMotion,
    isLowEnd,
    noBackdrop,
    isMobile: isTouch || window.innerWidth < 768,
  };

  window.__perfTier = tier;
  return tier;
}

/** Parallax intensity multiplier: 0 for reduced-motion, 0.4 for mobile, 1 for desktop */
export function getParallaxScale(): number {
  const t = getPerfTier();
  if (t.isReducedMotion) return 0;
  if (t.isMobile) return 0.4;
  return 1;
}

/**
 * Runtime FPS monitor — if average FPS stays below threshold over the
 * sample window, adds .perf-no-backdrop to <html>.
 * Call once after first paint / loader completes.
 */
export function monitorFrameRate(durationMs = 2000, fpsThreshold = 28): void {
  const tier = getPerfTier();
  if (tier.noBackdrop) return; // already disabled

  let frames = 0;
  let start = 0;

  function tick(now: number) {
    if (!start) start = now;
    frames++;
    const elapsed = now - start;

    if (elapsed >= durationMs) {
      const avgFps = (frames / elapsed) * 1000;
      if (avgFps < fpsThreshold) {
        document.documentElement.classList.add('perf-no-backdrop');
        tier.noBackdrop = true;
        window.__perfTier = tier;
      }
      return;
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}
