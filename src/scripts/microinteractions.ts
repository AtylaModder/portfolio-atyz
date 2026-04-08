/**
 * Hover Microinteractions
 * 1) Magnetic CTA buttons — translate toward cursor within 80px radius
 * 2) 3D tilt on project cards — perspective rotateX/Y + specular highlight
 * 3) Icons get scale + glow via CSS only (no JS needed)
 */
import gsap from 'gsap';

/* ── Helpers ── */
const isTouchDevice = () =>
  'ontouchstart' in window && navigator.maxTouchPoints > 0 && !window.matchMedia('(pointer: fine)').matches;

/* ══════════════════════════════════════════════
   1) MAGNETIC BUTTONS
   ══════════════════════════════════════════════ */
function initMagneticButtons() {
  const buttons = document.querySelectorAll<HTMLElement>('.btn');
  if (!buttons.length) return;

  const RADIUS = 80;   // px — activation zone around button
  const STRENGTH = 0.3; // 30% of distance toward cursor

  buttons.forEach((btn) => {
    const xTo = gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'power3.out' });
    const yTo = gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'power3.out' });

    const handleMove = (e: MouseEvent) => {
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < RADIUS) {
        xTo(dx * STRENGTH);
        yTo(dy * STRENGTH);
      } else {
        xTo(0);
        yTo(0);
      }
    };

    const handleLeave = () => {
      xTo(0);
      yTo(0);
    };

    /* Use parent area for mousemove to detect approach */
    const zone = btn.parentElement || btn;
    zone.addEventListener('mousemove', handleMove);
    btn.addEventListener('mouseleave', handleLeave);
  });
}

/* ══════════════════════════════════════════════
   2) 3D TILT ON PROJECT CARDS
   ══════════════════════════════════════════════ */
function initCardTilt() {
  const cards = document.querySelectorAll<HTMLElement>('.project-row');
  if (!cards.length) return;

  const MAX_DEG = 8;

  cards.forEach((card) => {
    /* Ensure the card has perspective set */
    card.style.transformStyle = 'preserve-3d';

    const rotXTo = gsap.quickTo(card, 'rotateX', { duration: 0.5, ease: 'power2.out' });
    const rotYTo = gsap.quickTo(card, 'rotateY', { duration: 0.5, ease: 'power2.out' });

    /* Specular highlight — inject pseudo-element via an overlay div */
    const specular = document.createElement('div');
    specular.className = 'card-specular';
    card.appendChild(specular);

    const specXTo = gsap.quickTo(specular, '--spec-x', { duration: 0.4, ease: 'power2.out' });
    const specYTo = gsap.quickTo(specular, '--spec-y', { duration: 0.4, ease: 'power2.out' });

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;    // 0 → 1
      const y = (e.clientY - rect.top) / rect.height;     // 0 → 1

      /* Tilt — center is neutral, edges are ±MAX_DEG */
      const tiltX = (0.5 - y) * MAX_DEG * 2;  // top = positive
      const tiltY = (x - 0.5) * MAX_DEG * 2;  // right = positive

      rotXTo(tiltX);
      rotYTo(tiltY);

      /* Specular highlight position */
      specXTo(x * 100);
      specYTo(y * 100);
      specular.style.opacity = '1';
    });

    card.addEventListener('mouseleave', () => {
      rotXTo(0);
      rotYTo(0);
      specular.style.opacity = '0';
    });
  });
}

/* ══════════════════════════════════════════════
   PUBLIC INIT
   ══════════════════════════════════════════════ */
export function initMicrointeractions() {
  /* Skip all JS-driven hover effects on touch — they feel weird */
  if (isTouchDevice()) return;

  initMagneticButtons();
  initCardTilt();
}
