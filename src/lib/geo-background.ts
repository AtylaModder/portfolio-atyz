/**
 * geo-background.ts
 * Persistent full-screen geometric background with 3 parallax depth layers.
 *
 * Architecture:
 *  - 3 <canvas> elements inside #geo-bg, one per depth layer (far / mid / near)
 *  - JS updates --scroll-y on :root via passive scroll listener (no debounce)
 *  - CSS calc() applies translateY per layer → GPU-composited, zero layout cost
 *  - rAF loop only handles idle drift, rotation, and subtle mouse parallax
 *  - IntersectionObserver detects active section → sets --geo-accent-color &
 *    --geo-opacity on #geo-bg; CSS transition handles smooth 800ms ease.
 *    The rAF loop reads the *computed* transition-interpolated values each frame.
 *  - requestAnimationFrame driven, no GSAP dependency
 */

/* ── Types ──────────────────────────────────── */
type ShapeKind = 'diamond' | 'hexagon' | 'triangle' | 'ring' | 'dot' | 'line';
type LayerName = 'far' | 'mid' | 'near';

interface LayerConfig {
  name: LayerName;
  count: number;
  sizeRange: [number, number];
  baseOpacity: number;
  driftScale: number;
  mouseScale: number;
  rotationScale: number;
}

interface Shape {
  kind: ShapeKind;
  baseX: number;
  baseY: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  driftAmpX: number;
  driftAmpY: number;
  driftFreq: number;
  driftPhase: number;
  /** base color as [r,g,b] */
  baseRGB: [number, number, number];
  baseOpacity: number;
  strokeOnly: boolean;
  lineWidth: number;
  mouseScale: number;
}

/* ── Layer definitions ──────────────────────── */
const LAYERS: LayerConfig[] = [
  { name: 'far',  count: 4, sizeRange: [16, 48],  baseOpacity: 0.04, driftScale: 0.5,  mouseScale: 0.3, rotationScale: 0.4 },
  { name: 'mid',  count: 4, sizeRange: [44, 96],  baseOpacity: 0.07, driftScale: 0.8,  mouseScale: 0.6, rotationScale: 0.7 },
  { name: 'near', count: 3, sizeRange: [72, 140], baseOpacity: 0.10, driftScale: 1.0,  mouseScale: 1.0, rotationScale: 1.0 },
];

/* ── Base palette as RGB tuples ─────────────── */
const PALETTE_RGB: [number, number, number][] = [
  [231, 195, 79],   // primary gold
  [255, 179, 102],  // secondary amber
  [255, 138, 128],  // accent coral
  [80,  200, 220],  // cyan
  [160, 120, 255],  // violet
];

/* ── Section mood map ───────────────────────── */
interface SectionMood {
  selector: string;
  /** accent tint RGB */
  rgb: [number, number, number];
  /** opacity multiplier (1 = use layer defaults) */
  opacityMul: number;
}

const SECTION_MOODS: SectionMood[] = [
  { selector: '.hero',              rgb: [231, 195, 79],  opacityMul: 1.0  },  // gold — warm welcome
  { selector: '.story',             rgb: [255, 179, 102], opacityMul: 0.9  },  // amber — personal warmth
  { selector: '.stats',             rgb: [80,  200, 220], opacityMul: 0.85 },  // cyan — analytical cool
  { selector: '.projects-section',  rgb: [231, 195, 79],  opacityMul: 1.1  },  // gold — showcase energy
  { selector: '.teams-section',     rgb: [160, 120, 255], opacityMul: 0.9  },  // violet — collaborative
  { selector: '.models-section',    rgb: [80,  200, 220], opacityMul: 1.0  },  // cyan — technical
  { selector: '.visuals-section',   rgb: [255, 138, 128], opacityMul: 1.0  },  // coral — creative
  { selector: '.contact-hub',       rgb: [231, 195, 79],  opacityMul: 0.8  },  // gold — inviting
];

function rnd(min: number, max: number) { return Math.random() * (max - min) + min; }
function pick<T>(a: T[]): T { return a[Math.floor(Math.random() * a.length)]; }

/* ── Shape factory (per layer) ──────────────── */
function createLayerShapes(cfg: LayerConfig): Shape[] {
  const kinds: ShapeKind[] = ['diamond', 'hexagon', 'triangle', 'ring', 'dot', 'line'];
  const shapes: Shape[] = [];

  for (let i = 0; i < cfg.count; i++) {
    const kind = kinds[i % kinds.length];
    const isStroke = kind === 'ring' || kind === 'diamond' || kind === 'hexagon' || kind === 'triangle';
    const [sMin, sMax] = cfg.sizeRange;
    shapes.push({
      kind,
      baseX: rnd(0.04, 0.96),
      baseY: rnd(0.04, 0.96),
      size: kind === 'dot' ? rnd(sMin * 0.3, sMin * 0.6)
           : kind === 'line' ? rnd(sMin * 1.2, sMax * 1.1)
           : rnd(sMin, sMax),
      rotation: rnd(0, Math.PI * 2),
      rotationSpeed: rnd(-0.08, 0.08) * cfg.rotationScale,
      driftAmpX: rnd(8, 30) * cfg.driftScale,
      driftAmpY: rnd(8, 30) * cfg.driftScale,
      driftFreq: rnd(0.015, 0.04),
      driftPhase: rnd(0, Math.PI * 2),
      baseRGB: pick(PALETTE_RGB),
      baseOpacity: cfg.baseOpacity * rnd(0.8, 1.2),
      strokeOnly: isStroke && Math.random() > 0.3,
      lineWidth: rnd(1.2, 2.5),
      mouseScale: cfg.mouseScale,
    });
  }
  return shapes;
}

/* ── Drawing helpers ────────────────────────── */
function drawDiamond(ctx: CanvasRenderingContext2D, s: number) {
  const h = s / 2;
  ctx.beginPath();
  ctx.moveTo(0, -h); ctx.lineTo(h, 0); ctx.lineTo(0, h); ctx.lineTo(-h, 0);
  ctx.closePath();
}

function drawHexagon(ctx: CanvasRenderingContext2D, s: number) {
  const r = s / 2;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    ctx[i === 0 ? 'moveTo' : 'lineTo'](Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
}

function drawTriangle(ctx: CanvasRenderingContext2D, s: number) {
  const r = s / 2;
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const a = (Math.PI * 2 / 3) * i - Math.PI / 2;
    ctx[i === 0 ? 'moveTo' : 'lineTo'](Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
}

function drawRing(ctx: CanvasRenderingContext2D, s: number) {
  ctx.beginPath(); ctx.arc(0, 0, s / 2, 0, Math.PI * 2);
}

function drawDot(ctx: CanvasRenderingContext2D, s: number) {
  ctx.beginPath(); ctx.arc(0, 0, s / 2, 0, Math.PI * 2);
}

function drawLine(ctx: CanvasRenderingContext2D, s: number) {
  ctx.beginPath(); ctx.moveTo(-s / 2, 0); ctx.lineTo(s / 2, 0);
}

const DRAW: Record<ShapeKind, (ctx: CanvasRenderingContext2D, s: number) => void> = {
  diamond: drawDiamond, hexagon: drawHexagon, triangle: drawTriangle,
  ring: drawRing, dot: drawDot, line: drawLine,
};

/* ── Per-layer renderer ─────────────────────── */
interface LayerRuntime {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  shapes: Shape[];
}

/* ── Main init ──────────────────────────────── */
export function initGeoBackground() {
  const container = document.getElementById('geo-bg');
  if (!container) return;

  const root = document.documentElement;
  const perfTier = (window as any).__perfTier;
  const reducedMotion = !!perfTier?.isReducedMotion;
  const maxDpr = perfTier?.isLowEnd ? 1 : perfTier?.isMobile ? 1.25 : 1.5;
  const targetFrameMs = perfTier?.isLowEnd ? 1000 / 20 : perfTier?.isMobile ? 1000 / 24 : 1000 / 30;
  let W = 0;
  let H = 0;
  let dpr = 1;

  /* ── Mood state ─────────────────────────────── */
  let accentR = 231, accentG = 195, accentB = 79;
  let opacityMul = 1;
  let targetAccentR = accentR;
  let targetAccentG = accentG;
  let targetAccentB = accentB;
  let targetOpacityMul = opacityMul;

  interface MeasuredSectionMood extends SectionMood {
    element: HTMLElement;
    start: number;
    end: number;
    center: number;
  }

  let measuredMoods: MeasuredSectionMood[] = [];
  let moodTicking = false;

  function clamp01(value: number) {
    return Math.min(1, Math.max(0, value));
  }

  function lerp(from: number, to: number, amount: number) {
    return from + (to - from) * amount;
  }

  function updateMoodTarget(rgb: [number, number, number], nextOpacity: number) {
    targetAccentR = rgb[0];
    targetAccentG = rgb[1];
    targetAccentB = rgb[2];
    targetOpacityMul = nextOpacity;
  }

  function measureSections() {
    measuredMoods = SECTION_MOODS.flatMap((mood) => {
      const element = document.querySelector<HTMLElement>(mood.selector);
      if (!element) return [];

      const rect = element.getBoundingClientRect();
      const start = window.scrollY + rect.top;
      const height = Math.max(rect.height, element.offsetHeight, 1);

      return [{
        ...mood,
        element,
        start,
        end: start + height,
        center: start + height / 2,
      }];
    });
  }

  function getInterpolatedMood(scrollTop = window.scrollY): { rgb: [number, number, number]; opacityMul: number } {
    if (!measuredMoods.length) {
      return { rgb: [231, 195, 79], opacityMul: 1 };
    }

    const viewportCenter = scrollTop + window.innerHeight * 0.52;
    const first = measuredMoods[0];
    const last = measuredMoods[measuredMoods.length - 1];

    if (viewportCenter <= first.center) {
      return { rgb: first.rgb, opacityMul: first.opacityMul };
    }

    if (viewportCenter >= last.center) {
      return { rgb: last.rgb, opacityMul: last.opacityMul };
    }

    for (let i = 0; i < measuredMoods.length - 1; i++) {
      const current = measuredMoods[i];
      const next = measuredMoods[i + 1];
      if (viewportCenter < current.center || viewportCenter > next.center) continue;

      const amount = clamp01((viewportCenter - current.center) / Math.max(next.center - current.center, 1));
      return {
        rgb: [
          lerp(current.rgb[0], next.rgb[0], amount),
          lerp(current.rgb[1], next.rgb[1], amount),
          lerp(current.rgb[2], next.rgb[2], amount),
        ] as [number, number, number],
        opacityMul: lerp(current.opacityMul, next.opacityMul, amount),
      };
    }

    return { rgb: last.rgb, opacityMul: last.opacityMul };
  }

  function scheduleMoodUpdate() {
    if (moodTicking) return;
    moodTicking = true;

    requestAnimationFrame(() => {
      moodTicking = false;
      const nextMood = getInterpolatedMood();
      updateMoodTarget(nextMood.rgb, nextMood.opacityMul);

      if (reducedMotion) {
        accentR = targetAccentR;
        accentG = targetAccentG;
        accentB = targetAccentB;
        opacityMul = targetOpacityMul;
        renderAll(performance.now(), 0);
      }
    });
  }

  /* Build the 3 layer canvases */
  const runtimes: LayerRuntime[] = LAYERS.map((cfg) => {
    const canvas = container.querySelector<HTMLCanvasElement>(`.geo-layer--${cfg.name}`);
    if (!canvas) throw new Error(`Missing .geo-layer--${cfg.name}`);
    const ctx = canvas.getContext('2d')!;
    return { canvas, ctx, shapes: createLayerShapes(cfg) };
  });

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    W = window.innerWidth;
    H = window.innerHeight;
    for (const rt of runtimes) {
      rt.canvas.width = W * dpr;
      rt.canvas.height = H * dpr;
      rt.canvas.style.width = W + 'px';
      rt.canvas.style.height = H + 'px';
      rt.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    measureSections();
    renderAll(performance.now(), 0);
  }

  resize();
  window.addEventListener('resize', resize);

  /* ── Scroll → CSS custom property (real-time, passive, no debounce) ── */
  function onScroll() {
    root.style.setProperty('--scroll-y', String(window.scrollY));
    scheduleMoodUpdate();
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── Mouse tracking (desktop only, with lerp) ── */
  let mouseX = 0.5;
  let mouseY = 0.5;
  let targetMX = 0.5;
  let targetMY = 0.5;
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  /* Scale mouse parallax based on perf tier (0.4× on mobile, 0× on reduced-motion) */
  const parallaxMul = perfTier
    ? (perfTier.isReducedMotion ? 0 : perfTier.isMobile ? 0.4 : 1)
    : 1;
  const mouseOffset = 24 * parallaxMul;

  if (!isTouchDevice) {
    window.addEventListener('mousemove', (e) => {
      targetMX = e.clientX / W;
      targetMY = e.clientY / H;
    }, { passive: true });
  }

  /* ── Render loop (drift + rotation + mouse only, NO scroll math) ── */
  let lastT = 0;
  let lastRender = 0;
  let raf = 0;
  let running = false;

  function renderLayer(rt: LayerRuntime, now: number, dt: number) {
    rt.ctx.clearRect(0, 0, W, H);

    for (const sh of rt.shapes) {
      /* Idle drift */
      const drift = now * 0.001 * sh.driftFreq + sh.driftPhase;
      const dx = Math.sin(drift) * sh.driftAmpX;
      const dy = Math.cos(drift * 0.7) * sh.driftAmpY;

      /* Mouse parallax */
      const mxOff = (mouseX - 0.5) * mouseOffset * sh.mouseScale;
      const myOff = (mouseY - 0.5) * mouseOffset * sh.mouseScale;

      const x = sh.baseX * W + dx + mxOff;
      const y = sh.baseY * H + dy + myOff;

      /* Rotation */
      sh.rotation += sh.rotationSpeed * dt;

      /* Blend shape base color toward current accent (50/50 mix) */
      const r = Math.round((sh.baseRGB[0] + accentR) * 0.5);
      const g = Math.round((sh.baseRGB[1] + accentG) * 0.5);
      const b = Math.round((sh.baseRGB[2] + accentB) * 0.5);
      const alpha = sh.baseOpacity * opacityMul;

      rt.ctx.save();
      rt.ctx.translate(x, y);
      rt.ctx.rotate(sh.rotation);
      rt.ctx.globalAlpha = alpha;

      const colorStr = `rgba(${r},${g},${b},${alpha.toFixed(2)})`;

      if (sh.kind === 'line' || sh.strokeOnly || sh.kind === 'ring') {
        rt.ctx.strokeStyle = colorStr;
        rt.ctx.lineWidth = sh.lineWidth;
        DRAW[sh.kind](rt.ctx, sh.size);
        rt.ctx.stroke();
      } else {
        rt.ctx.fillStyle = colorStr;
        DRAW[sh.kind](rt.ctx, sh.size);
        rt.ctx.fill();
      }

      rt.ctx.restore();
    }
  }

  function renderAll(now: number, dt: number) {
    const moodEase = reducedMotion ? 1 : 0.08;
    accentR = lerp(accentR, targetAccentR, moodEase);
    accentG = lerp(accentG, targetAccentG, moodEase);
    accentB = lerp(accentB, targetAccentB, moodEase);
    opacityMul = lerp(opacityMul, targetOpacityMul, reducedMotion ? 1 : 0.06);

    /* Lerp mouse */
    mouseX += (targetMX - mouseX) * 0.04;
    mouseY += (targetMY - mouseY) * 0.04;

    for (const rt of runtimes) {
      renderLayer(rt, now, dt);
    }
  }

  function frame(now: number) {
    if (!running) return;

    if (now - lastRender >= targetFrameMs) {
      const dt = Math.min((now - lastT) / 1000, 0.1);
      lastT = now;
      lastRender = now;
      renderAll(now, dt);
    }

    raf = requestAnimationFrame(frame);
  }

  function startLoop() {
    if (running || reducedMotion || document.hidden) return;
    running = true;
    lastT = performance.now();
    lastRender = 0;
    raf = requestAnimationFrame(frame);
  }

  function stopLoop() {
    running = false;
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }

  function handleVisibilityChange() {
    if (document.hidden) {
      stopLoop();
      return;
    }

    scheduleMoodUpdate();
    renderAll(performance.now(), 0);
    startLoop();
  }

  measureSections();
  const initialMood = getInterpolatedMood();
  updateMoodTarget(initialMood.rgb, initialMood.opacityMul);
  accentR = targetAccentR;
  accentG = targetAccentG;
  accentB = targetAccentB;
  opacityMul = targetOpacityMul;
  renderAll(performance.now(), 0);

  if (!reducedMotion) {
    startLoop();
  }

  document.addEventListener('visibilitychange', handleVisibilityChange);
}
