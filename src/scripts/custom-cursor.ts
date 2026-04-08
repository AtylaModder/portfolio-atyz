/**
 * Custom Cursor — dot (instant) + ring (lerp lag)
 * Adapts color from geo-background section accent vars.
 * Hidden on touch devices.
 */
import gsap from 'gsap';

const isTouchDevice = () =>
  'ontouchstart' in window && navigator.maxTouchPoints > 0 && !window.matchMedia('(pointer: fine)').matches;

let dot: HTMLElement | null = null;
let ring: HTMLElement | null = null;
let active = false;

/* Interactive selectors that trigger the ring expand */
const INTERACTIVE = 'a, button, [role="button"], .btn, .project-row, .model-card, .contact-card, .stats__item, input, textarea';
/* 3D viewer — crosshair mode */
const VIEWER_3D = '.model-lightbox-3d__canvas';

export function initCustomCursor() {
  if (isTouchDevice()) return;

  /* ── Create DOM (once) — ring first, then dot for CSS ~ selector ── */
  if (!ring) {
    ring = document.createElement('div');
    ring.className = 'cursor-ring';
    document.body.appendChild(ring);
  }
  if (!dot) {
    dot = document.createElement('div');
    dot.className = 'cursor-dot';
    document.body.appendChild(dot);
  }

  /* Show cursor elements */
  document.documentElement.classList.add('has-custom-cursor');
  active = true;

  /* ── GSAP quickTo for silky ring lag ── */
  const ringX = gsap.quickTo(ring, 'left', { duration: 0.45, ease: 'power3.out' });
  const ringY = gsap.quickTo(ring, 'top', { duration: 0.45, ease: 'power3.out' });

  /* ── Accent color sync (throttled — every 500ms) ── */
  let lastColorSync = 0;
  function syncAccentColor() {
    const now = performance.now();
    if (now - lastColorSync < 500) return;
    lastColorSync = now;

    const geo = document.getElementById('geo-bg');
    if (geo) {
      const s = getComputedStyle(geo);
      const r = Math.round(Number(s.getPropertyValue('--geo-accent-r')) || 231);
      const g = Math.round(Number(s.getPropertyValue('--geo-accent-g')) || 195);
      const b = Math.round(Number(s.getPropertyValue('--geo-accent-b')) || 79);
      document.documentElement.style.setProperty('--cursor-r', String(r));
      document.documentElement.style.setProperty('--cursor-g', String(g));
      document.documentElement.style.setProperty('--cursor-b', String(b));
    }
  }

  /* ── Track mouse ── */
  const onMove = (e: MouseEvent) => {
    if (!active) return;

    /* Dot — instant */
    dot!.style.left = e.clientX + 'px';
    dot!.style.top = e.clientY + 'px';

    /* Ring — lerp via quickTo */
    ringX(e.clientX);
    ringY(e.clientY);

    syncAccentColor();
  };

  /* ── Hover state management ── */
  const onOver = (e: MouseEvent) => {
    const target = e.target as HTMLElement;

    if (target.closest(VIEWER_3D)) {
      ring!.classList.add('is-crosshair');
      ring!.classList.remove('is-hover');
      dot!.style.opacity = '0.3';
      dot!.style.transform = 'scale(0.6)';
      return;
    }

    if (target.closest(INTERACTIVE)) {
      ring!.classList.add('is-hover');
      ring!.classList.remove('is-crosshair');
      dot!.style.opacity = '0.3';
      dot!.style.transform = 'scale(0.6)';
      return;
    }

    ring!.classList.remove('is-hover', 'is-crosshair');
    dot!.style.opacity = '1';
    dot!.style.transform = 'scale(1)';
  };

  const onOut = () => {
    ring!.classList.remove('is-hover', 'is-crosshair');
    dot!.style.opacity = '1';
    dot!.style.transform = 'scale(1)';
  };

  /* ── Hide when cursor leaves window ── */
  const onLeave = () => {
    dot!.style.opacity = '0';
    ring!.style.opacity = '0';
  };

  const onEnter = () => {
    dot!.style.opacity = '1';
    ring!.style.opacity = '1';
  };

  /* ── Bind ── */
  window.addEventListener('mousemove', onMove);
  document.addEventListener('mouseover', onOver);
  document.addEventListener('mouseout', onOut);
  document.addEventListener('mouseleave', onLeave);
  document.addEventListener('mouseenter', onEnter);
}
