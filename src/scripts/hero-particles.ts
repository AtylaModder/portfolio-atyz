/**
 * Hero Particles — ambient dust / pixel sparks floating upward.
 * Lazy-init when hero is in viewport, destroy when leaving.
 * Mobile: reduced count (15) or disabled on very small screens.
 */
import { tsParticles } from '@tsparticles/engine';
import { loadSlim } from '@tsparticles/slim';

const CONTAINER_ID = 'hero-particles';
let loaded = false;
let initialized = false;

const isTouchOnly = () =>
  'ontouchstart' in window && navigator.maxTouchPoints > 0 && !window.matchMedia('(pointer: fine)').matches;

function getCount(): number {
  /* Skip entirely on low-end devices */
  const perfTier = (window as any).__perfTier;
  if (perfTier?.isLowEnd) return 0;
  if (isTouchOnly()) return 0;          // disable on touch-only
  if (window.innerWidth < 768) return 15;
  return 35;
}

async function init() {
  const count = getCount();
  if (count === 0) return;

  /* Load slim plugins once */
  if (!loaded) {
    await loadSlim(tsParticles);
    loaded = true;
  }

  if (initialized) return;

  await tsParticles.load({
    id: CONTAINER_ID,
    options: {
      fullScreen: false,
      fpsLimit: 60,
      detectRetina: true,
      particles: {
        number: { value: count, density: { enable: false } },
        color: {
          value: ['#e7c34f', '#FFB366', '#FF8A80', '#50C8DC', '#A078FF'],
        },
        shape: { type: 'circle' },
        opacity: {
          value: { min: 0.15, max: 0.4 },
          animation: { enable: true, speed: 0.3, startValue: 'random', sync: false },
        },
        size: {
          value: { min: 1.5, max: 2.5 },
          animation: { enable: true, speed: 0.8, startValue: 'random', sync: false },
        },
        move: {
          enable: true,
          speed: 0.4,
          direction: 'top' as const,
          outModes: { default: 'out' as const },
          random: true,
          straight: false,
          drift: 0.3,
        },
        links: { enable: false },
      },
      interactivity: {
        events: {
          onHover: { enable: false },
          onClick: { enable: false },
        },
      },
    },
  });

  initialized = true;
}

async function destroy() {
  if (!initialized) return;
  const container = tsParticles.domItem(0);
  if (container) {
    container.destroy();
  }
  initialized = false;
}

export function initHeroParticles() {
  const hero = document.getElementById('topo');
  const particlesEl = document.getElementById(CONTAINER_ID);
  if (!hero || !particlesEl) return;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          init();
        } else {
          destroy();
        }
      }
    },
    { threshold: 0.1 }
  );

  observer.observe(hero);
}
