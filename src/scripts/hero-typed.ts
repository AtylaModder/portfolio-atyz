/**
 * Hero Typed.js — typewriter effect cycling role titles.
 * On prefers-reduced-motion: shows static comma-separated list.
 */
import Typed from 'typed.js';

let instance: Typed | null = null;

export function initHeroTyped() {
  const target = document.getElementById('typed-target');
  if (!target) return;

  /* Reduced motion → static text, no animation */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    target.textContent = 'Modder, Texture Maker, PBR Artist, Bedrock Developer';
    return;
  }

  /* Destroy previous instance on navigation */
  if (instance) {
    instance.destroy();
    instance = null;
  }

  instance = new Typed(target, {
    strings: ['Modder', 'Texture Maker', 'PBR Artist', 'Bedrock Developer'],
    typeSpeed: 60,
    backSpeed: 35,
    backDelay: 2000,
    loop: true,
    smartBackspace: true,
    cursorChar: '|',
  });
}
