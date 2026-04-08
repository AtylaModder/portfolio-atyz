/**
 * animations.ts
 * Global scroll-reveal animation system.
 *
 * Reveal classes:
 *   .reveal-up      → fade + translateY(40px → 0)
 *   .reveal-left    → fade + translateX(-40px → 0)
 *   .reveal-right   → fade + translateX(40px → 0)
 *   .reveal-scale   → fade + scale(0.92 → 1)
 *
 * Stagger groups:
 *   .reveal-stagger → each direct child animates with 0.08s stagger
 *
 * Custom delay:
 *   data-delay="0.2" → manual offset in seconds
 *
 * Respects prefers-reduced-motion: skip all animations.
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const DURATION = 0.7;
const EASE = 'power3.out';
const STAGGER = 0.08;
const START = 'top 88%';

interface RevealConfig {
  from: gsap.TweenVars;
}

const REVEAL_MAP: Record<string, RevealConfig> = {
  'reveal-up':    { from: { y: 40, opacity: 0 } },
  'reveal-left':  { from: { x: -40, opacity: 0 } },
  'reveal-right': { from: { x: 40, opacity: 0 } },
  'reveal-scale': { from: { scale: 0.92, opacity: 0 } },
};

const REVEAL_SELECTOR = '.reveal-up, .reveal-left, .reveal-right, .reveal-scale';
const STAGGER_SELECTOR = '.reveal-stagger';

export function initRevealAnimations() {
  /* ── Respect prefers-reduced-motion ───────── */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Make everything visible immediately
    document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR).forEach((el) => {
      el.style.opacity = '1';
    });
    document.querySelectorAll<HTMLElement>(STAGGER_SELECTOR).forEach((el) => {
      Array.from(el.children).forEach((child) => {
        (child as HTMLElement).style.opacity = '1';
      });
    });
    return;
  }

  /* ── Individual reveal elements ──────────── */
  document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR).forEach((el) => {
    // Determine which reveal class applies
    let config: RevealConfig | null = null;
    for (const [cls, cfg] of Object.entries(REVEAL_MAP)) {
      if (el.classList.contains(cls)) { config = cfg; break; }
    }
    if (!config) return;

    const delay = parseFloat(el.dataset.delay || '0');

    gsap.from(el, {
      ...config.from,
      duration: DURATION,
      delay,
      ease: EASE,
      scrollTrigger: {
        trigger: el,
        start: START,
        toggleActions: 'play none none none',
      },
    });
  });

  /* ── Stagger groups ─────────────────────── */
  document.querySelectorAll<HTMLElement>(STAGGER_SELECTOR).forEach((group) => {
    const children = Array.from(group.children) as HTMLElement[];
    if (!children.length) return;

    // Detect reveal direction from the group element itself
    let fromVars: gsap.TweenVars = { y: 40, opacity: 0 };
    for (const [cls, cfg] of Object.entries(REVEAL_MAP)) {
      if (group.classList.contains(cls)) { fromVars = cfg.from; break; }
    }

    const delay = parseFloat(group.dataset.delay || '0');

    gsap.from(children, {
      ...fromVars,
      duration: DURATION,
      delay,
      stagger: STAGGER,
      ease: EASE,
      scrollTrigger: {
        trigger: group,
        start: START,
        toggleActions: 'play none none none',
      },
    });
  });
}
