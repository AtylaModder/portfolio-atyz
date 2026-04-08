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
  let W = 0;
  let H = 0;
  let dpr = 1;

  /* ── Mood state (read from CSS computed values each frame) ── */
  const containerStyle = getComputedStyle(container);
  let accentR = 231, accentG = 195, accentB = 79;  // initial gold
  let opacityMul = 1;

  /* Build the 3 layer canvases */
  const runtimes: LayerRuntime[] = LAYERS.map((cfg) => {
    const canvas = container.querySelector<HTMLCanvasElement>(`.geo-layer--${cfg.name}`);
    if (!canvas) throw new Error(`Missing .geo-layer--${cfg.name}`);
    const ctx = canvas.getContext('2d')!;
    return { canvas, ctx, shapes: createLayerShapes(cfg) };
  });

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    for (const rt of runtimes) {
      rt.canvas.width = W * dpr;
      rt.canvas.height = H * dpr;
      rt.canvas.style.width = W + 'px';
      rt.canvas.style.height = H + 'px';
      rt.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  resize();
  window.addEventListener('resize', resize);

  /* ── Scroll → CSS custom property (real-time, passive, no debounce) ── */
  function onScroll() {
    root.style.setProperty('--scroll-y', String(window.scrollY));
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── Section mood IntersectionObserver ────── */
  function setMood(mood: SectionMood) {
    const [r, g, b] = mood.rgb;
    container!.style.setProperty('--geo-accent-r', String(r));
    container!.style.setProperty('--geo-accent-g', String(g));
    container!.style.setProperty('--geo-accent-b', String(b));
    container!.style.setProperty('--geo-opacity', String(mood.opacityMul));
  }

  /* Set initial mood */
  setMood(SECTION_MOODS[0]);

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target;
        const mood = SECTION_MOODS.find(
          (m) => el.matches(m.selector)
        );
        if (mood) setMood(mood);
      }
    },
    { threshold: 0.35 }
  );

  for (const mood of SECTION_MOODS) {
    const el = document.querySelector(mood.selector);
    if (el) observer.observe(el);
  }

  /* ── Helper: read CSS-transitioned mood values ── */
  function readMood() {
    const rVal = containerStyle.getPropertyValue('--geo-accent-r');
    const gVal = containerStyle.getPropertyValue('--geo-accent-g');
    const bVal = containerStyle.getPropertyValue('--geo-accent-b');
    const oVal = containerStyle.getPropertyValue('--geo-opacity');
    if (rVal) accentR = parseFloat(rVal);
    if (gVal) accentG = parseFloat(gVal);
    if (bVal) accentB = parseFloat(bVal);
    if (oVal) opacityMul = parseFloat(oVal);
  }

  /* ── Mouse tracking (desktop only, with lerp) ── */
  let mouseX = 0.5;
  let mouseY = 0.5;
  let targetMX = 0.5;
  let targetMY = 0.5;
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (!isTouchDevice) {
    window.addEventListener('mousemove', (e) => {
      targetMX = e.clientX / W;
      targetMY = e.clientY / H;
    }, { passive: true });
  }

  /* ── Render loop (drift + rotation + mouse only, NO scroll math) ── */
  let lastT = 0;
  let moodFrame = 0;    // read CSS vars every ~6 frames to avoid getComputedStyle spam

  function renderLayer(rt: LayerRuntime, now: number, dt: number) {
    rt.ctx.clearRect(0, 0, W, H);

    for (const sh of rt.shapes) {
      /* Idle drift */
      const drift = now * 0.001 * sh.driftFreq + sh.driftPhase;
      const dx = Math.sin(drift) * sh.driftAmpX;
      const dy = Math.cos(drift * 0.7) * sh.driftAmpY;

      /* Mouse parallax */
      const mxOff = (mouseX - 0.5) * 24 * sh.mouseScale;
      const myOff = (mouseY - 0.5) * 24 * sh.mouseScale;

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

  function frame(now: number) {
    const dt = Math.min((now - lastT) / 1000, 0.1);
    lastT = now;

    /* Read CSS-transitioned mood values periodically */
    if (++moodFrame % 6 === 0) readMood();

    /* Lerp mouse */
    mouseX += (targetMX - mouseX) * 0.04;
    mouseY += (targetMY - mouseY) * 0.04;

    for (const rt of runtimes) {
      renderLayer(rt, now, dt);
    }

    requestAnimationFrame(frame);
  }

  requestAnimationFrame((now) => { lastT = now; frame(now); });
}
