/**
 * CountUp Stats — animate numerical statistics on viewport entry.
 * Uses CountUp.js with easeOutExpo, triggers at 80% visibility, counts once.
 */
import { CountUp } from 'countup.js';

/** easeOutExpo curve matching the user spec */
function easeOutExpo(t: number, b: number, c: number, d: number): number {
  return t === d ? b + c : c * (-Math.pow(2, (-10 * t) / d) + 1) + b;
}

export function initCountUpStats() {
  const els = document.querySelectorAll<HTMLElement>('[data-counter]');
  if (!els.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;

        const el = entry.target as HTMLElement;
        observer.unobserve(el);

        const target = parseFloat(el.dataset.counter || '0');

        const countUp = new CountUp(el, target, {
          startVal: 0,
          duration: 2.5,
          easingFn: easeOutExpo,
          useGrouping: true,
          decimalPlaces: 0,
          separator: '.',
        });

        if (!countUp.error) {
          countUp.start();
        }
      }
    },
    { threshold: 0.8 }
  );

  els.forEach((el) => observer.observe(el));
}
