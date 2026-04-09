/**
 * GLTF Model viewer using Three.js.
 * Loads .gltf/.glb with full textures, hierarchy, and animations.
 * Neutral studio lighting that preserves original texture colors.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/* ─── Public interface ─────────────────────────────────── */
export interface ModelViewerOptions {
  canvas: HTMLCanvasElement;
  modelUrl: string;
  animationIndex?: number;
  interactive?: boolean;
  /** Per-model camera config */
  camera?: { angle: number; height: number; zoom: number; lookX: number; lookY: number; ortho: boolean };
  onReady?: () => void;
}

export interface ModelViewer {
  dispose: () => void;
  resize: () => void;
  setInteractive: (v: boolean) => void;
}

export async function createModelViewer(opts: ModelViewerOptions): Promise<ModelViewer> {
  const {
    canvas,
    modelUrl,
    animationIndex,
    interactive = true,
    camera: camCfg,
    onReady,
  } = opts;
  const perfTier = (window as any).__perfTier;
  const maxPixelRatio = perfTier?.isLowEnd ? 1 : perfTier?.isMobile ? 1.25 : 1.5;
  const enablePostProcessing = !(perfTier?.isLowEnd || perfTier?.isMobile);
  const enableShadows = !perfTier?.isLowEnd;

  /* ── Renderer — max quality ────────────────────── */
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // No tone mapping — preserve original texture colors exactly
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.shadowMap.enabled = enableShadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  function updateSize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== w || canvas.height !== h) {
      renderer.setSize(w, h, false);
    }
  }
  updateSize();

  /* ── Scene ─────────────────────────────────────── */
  const scene = new THREE.Scene();

  /* ── Camera ────────────────────────────────────── */
  const aspect = canvas.clientWidth / canvas.clientHeight;
  const useOrtho = camCfg?.ortho ?? false;
  // We'll create the right camera after loading the model (need size for ortho frustum)
  // Use a placeholder perspective first, swap later if ortho
  let camera: THREE.PerspectiveCamera | THREE.OrthographicCamera = new THREE.PerspectiveCamera(40, aspect, 0.01, 500);

  /* ── Lights — neutral white, studio-style ──────── */
  // Strong ambient to fill shadows and keep textures visible
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.6);
  scene.add(ambientLight);

  // Hemisphere: warm sky, cool ground — very subtle color variation
  const hemiLight = new THREE.HemisphereLight(0xf0f0ff, 0xd0d0e0, 0.8);
  hemiLight.position.set(0, 10, 0);
  scene.add(hemiLight);

  // Key light — neutral white, slightly warm, from upper-right-front
  const keyLight = new THREE.DirectionalLight(0xfff8f0, 1.8);
  keyLight.position.set(5, 8, 6);
  keyLight.castShadow = enableShadows;
  keyLight.shadow.mapSize.width = 1024;
  keyLight.shadow.mapSize.height = 1024;
  scene.add(keyLight);

  // Fill light — neutral slightly cool, from left
  const fillLight = new THREE.DirectionalLight(0xf0f4ff, 0.9);
  fillLight.position.set(-6, 4, 2);
  scene.add(fillLight);

  // Rim/back light — subtle highlight on edges
  const rimLight = new THREE.DirectionalLight(0xffffff, 0.6);
  rimLight.position.set(0, 3, -8);
  scene.add(rimLight);

  // Bottom fill — prevents harsh under-shadows
  const bottomLight = new THREE.DirectionalLight(0xe8e8f0, 0.4);
  bottomLight.position.set(0, -4, 2);
  scene.add(bottomLight);

  /* ── Load GLTF ─────────────────────────────────── */
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(modelUrl);
  const model = gltf.scene;

  // Make sure textures use nearest-neighbor filtering for pixel art style
  model.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach((mat) => {
        if (mat.map) {
          mat.map.magFilter = THREE.NearestFilter;
          mat.map.minFilter = THREE.NearestFilter;
          mat.map.generateMipmaps = false;
          mat.map.needsUpdate = true;
        }
      });
    }
  });

  // Compute bounding box to auto-center and auto-scale
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);

  // Center model at origin
  model.position.sub(center);
  scene.add(model);

  // Camera target — use per-model offsets or defaults
  const lookXOffset = camCfg ? camCfg.lookX : 0;
  const lookYOffset = camCfg ? camCfg.lookY : 0;
  const lookTarget = new THREE.Vector3(size.x * lookXOffset, size.y * lookYOffset, 0);

  // Camera distance — fit model comfortably with margin
  const zoomMul = camCfg ? camCfg.zoom : 1.2;

  // Camera angle: use per-model values or defaults
  const angleDeg = camCfg ? camCfg.angle : 150;
  const heightDeg = camCfg ? camCfg.height : 72;
  const theta = THREE.MathUtils.degToRad(angleDeg);
  const phi = THREE.MathUtils.degToRad(heightDeg);

  if (useOrtho) {
    // Orthographic camera — no perspective distortion, like Blockbench
    const orthoHalfH = (maxDim / 2) * zoomMul;
    const orthoHalfW = orthoHalfH * aspect;
    camera = new THREE.OrthographicCamera(-orthoHalfW, orthoHalfW, orthoHalfH, -orthoHalfH, 0.01, maxDim * 10);
    const orthoDist = maxDim * 3;
    camera.position.set(
      orthoDist * Math.sin(phi) * Math.sin(theta),
      orthoDist * Math.cos(phi),
      orthoDist * Math.sin(phi) * Math.cos(theta)
    );
  } else {
    // Perspective camera
    const fovRad = THREE.MathUtils.degToRad((camera as THREE.PerspectiveCamera).fov / 2);
    const fitDistance = (maxDim / 2) / Math.tan(fovRad);
    const camDist = fitDistance * zoomMul;
    camera.position.set(
      camDist * Math.sin(phi) * Math.sin(theta),
      camDist * Math.cos(phi),
      camDist * Math.sin(phi) * Math.cos(theta)
    );
  }
  camera.lookAt(lookTarget);

  // Compute camDist for controls limits
  const camDist = camera.position.length();

  /* ── SSAO — screen-space ambient occlusion ───── */
  let composer: EffectComposer | null = null;
  let ssaoPass: SSAOPass | null = null;

  if (enablePostProcessing) {
    composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    ssaoPass = new SSAOPass(scene, camera, canvas.clientWidth, canvas.clientHeight);
    ssaoPass.kernelRadius = maxDim * 0.08;
    ssaoPass.minDistance = 0.0005;
    ssaoPass.maxDistance = 0.08;
    composer.addPass(ssaoPass);

    const outputPass = new OutputPass();
    composer.addPass(outputPass);
  }

  // Update shadow camera to fit model
  const shadowPad = maxDim * 0.8;
  keyLight.shadow.camera.left = -shadowPad;
  keyLight.shadow.camera.right = shadowPad;
  keyLight.shadow.camera.top = shadowPad;
  keyLight.shadow.camera.bottom = -shadowPad;
  keyLight.shadow.camera.near = 0.1;
  keyLight.shadow.camera.far = camDist * 3;
  keyLight.shadow.camera.updateProjectionMatrix();

  /* ── Animation ─────────────────────────────────── */
  let mixer: THREE.AnimationMixer | null = null;
  const clock = new THREE.Clock();

  if (gltf.animations.length > 0) {
    mixer = new THREE.AnimationMixer(model);
    let clipIdx = 0;
    if (animationIndex !== undefined && animationIndex < gltf.animations.length) {
      clipIdx = animationIndex;
    } else {
      // Pick the animation with the most tracks
      let maxTracks = 0;
      gltf.animations.forEach((clip, i) => {
        if (clip.tracks.length > maxTracks) {
          maxTracks = clip.tracks.length;
          clipIdx = i;
        }
      });
    }
    const action = mixer.clipAction(gltf.animations[clipIdx]);
    action.play();
  }

  /* ── Orbit Controls ────────────────────────────── */
  let controls: OrbitControls | null = null;
  if (interactive) {
    controls = new OrbitControls(camera, canvas);
    controls.target.copy(lookTarget);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enablePan = true;
    controls.panSpeed = 0.8;
    controls.rotateSpeed = 0.8;
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN,
    };
    controls.minDistance = camDist * 0.25;
    controls.maxDistance = camDist * 5;
    if (useOrtho) {
      controls.enableZoom = true;
      controls.minZoom = 0.3;
      controls.maxZoom = 4;
    }
    // No auto-rotation
    controls.autoRotate = false;
    controls.update();
  }

  /* ── Render loop ───────────────────────────────── */
  let disposed = false;
  let raf = 0;

  function animate() {
    if (disposed) return;
    raf = requestAnimationFrame(animate);
    const delta = clock.getDelta();
    mixer?.update(delta);
    controls?.update();
    if (composer) {
      composer.render();
    } else {
      renderer.render(scene, camera);
    }
  }
  animate();

  onReady?.();

  /* ── Return handle ─────────────────────────────── */
  return {
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      controls?.dispose();
      mixer?.stopAllAction();
      renderer.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach(m => {
            if (m.map) m.map.dispose();
            if (m.normalMap) m.normalMap.dispose();
            if (m.emissiveMap) m.emissiveMap.dispose();
            m.dispose();
          });
        }
      });
    },
    resize() {
      updateSize();
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.aspect = w / h;
      } else {
        const ortho = camera as THREE.OrthographicCamera;
        const halfH = (ortho.top - ortho.bottom) / 2;
        const newAspect = w / h;
        ortho.left = -halfH * newAspect;
        ortho.right = halfH * newAspect;
      }
      camera.updateProjectionMatrix();
      composer?.setSize(w, h);
      ssaoPass?.setSize(w, h);
    },
    setInteractive(v: boolean) {
      if (controls) controls.enabled = v;
    },
  };
}
