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
export interface ModelViewerCameraConfig {
  angle: number;
  height: number;
  zoom: number;
  lookX: number;
  lookY: number;
  lookZ?: number;
  ortho: boolean;
  positionX?: number;
  positionY?: number;
  positionZ?: number;
  targetX?: number;
  targetY?: number;
  targetZ?: number;
}

export interface ModelViewerExactCameraConfig extends ModelViewerCameraConfig {
  lookZ: number;
  positionX: number;
  positionY: number;
  positionZ: number;
  targetX: number;
  targetY: number;
  targetZ: number;
}

export interface ModelViewerCameraDebugInfo {
  mode: 'orthographic' | 'perspective';
  angle: number;
  height: number;
  zoom: number;
  cameraZoom: number;
  distance: number;
  position: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
  compactConfig: ModelViewerCameraConfig;
  exactConfig: ModelViewerExactCameraConfig;
}

export interface ModelViewerRenderConfig {
  emissive?: boolean;
  emissiveIntensity?: number;
  oneSided?: boolean;
}

export interface ModelViewerOptions {
  canvas: HTMLCanvasElement;
  modelUrl: string;
  animationIndex?: number;
  interactive?: boolean;
  /** Per-model camera config */
  camera?: ModelViewerCameraConfig;
  /** Per-model render/material config */
  render?: ModelViewerRenderConfig;
  onReady?: () => void;
}

export interface ModelViewer {
  dispose: () => void;
  resize: () => void;
  setInteractive: (v: boolean) => void;
  getCameraDebugInfo: () => ModelViewerCameraDebugInfo;
}

export async function createModelViewer(opts: ModelViewerOptions): Promise<ModelViewer> {
  const {
    canvas,
    modelUrl,
    animationIndex,
    interactive = true,
    camera: camCfg,
    render: renderCfg,
    onReady,
  } = opts;
  const perfTier = (window as any).__perfTier;
  const maxPixelRatio = perfTier?.isLowEnd ? 1 : perfTier?.isMobile ? 1.25 : 1.5;
  const enablePostProcessing = !(perfTier?.isLowEnd || perfTier?.isMobile);
  const enableShadows = !perfTier?.isLowEnd;

  function round(value: number, decimals = 3) {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
  }

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
  type ViewerMaterial = THREE.Material & {
    map?: THREE.Texture | null;
    normalMap?: THREE.Texture | null;
    emissive?: THREE.Color;
    emissiveIntensity?: number;
    emissiveMap?: THREE.Texture | null;
    alphaMap?: THREE.Texture | null;
    roughnessMap?: THREE.Texture | null;
    metalnessMap?: THREE.Texture | null;
    aoMap?: THREE.Texture | null;
  };
  const enableEmissive = renderCfg?.emissive ?? false;
  const emissiveIntensity = renderCfg?.emissiveIntensity ?? 1.35;
  const forceOneSided = renderCfg?.oneSided ?? false;

  // Make sure textures use nearest-neighbor filtering for pixel art style
  model.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach((mat) => {
        const material = mat as ViewerMaterial;

        if (material.map) {
          material.map.magFilter = THREE.NearestFilter;
          material.map.minFilter = THREE.NearestFilter;
          material.map.generateMipmaps = false;
          material.map.needsUpdate = true;
        }

        if (forceOneSided) {
          material.side = THREE.FrontSide;
          material.shadowSide = THREE.FrontSide;
        }

        if (enableEmissive && material.emissive) {
          material.emissive.setRGB(1, 1, 1);
          material.emissiveIntensity = emissiveIntensity;
          if (material.map && !material.emissiveMap) {
            material.emissiveMap = material.map;
          }
        }

        material.needsUpdate = true;
      });
    }
  });

  // Compute bounding box to auto-center and auto-scale
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const safeSizeX = Math.abs(size.x) > 0.0001 ? size.x : maxDim || 1;
  const safeSizeY = Math.abs(size.y) > 0.0001 ? size.y : maxDim || 1;
  const safeSizeZ = Math.abs(size.z) > 0.0001 ? size.z : maxDim || 1;
  const hasExplicitPosition = camCfg?.positionX !== undefined || camCfg?.positionY !== undefined || camCfg?.positionZ !== undefined;
  const hasExplicitTarget = camCfg?.targetX !== undefined || camCfg?.targetY !== undefined || camCfg?.targetZ !== undefined;

  // Center model at origin
  model.position.sub(center);
  scene.add(model);

  // Camera target — use per-model offsets or defaults
  const lookXOffset = camCfg ? camCfg.lookX : 0;
  const lookYOffset = camCfg ? camCfg.lookY : 0;
  const lookZOffset = camCfg?.lookZ ?? 0;
  const lookTarget = hasExplicitTarget
    ? new THREE.Vector3(camCfg?.targetX ?? 0, camCfg?.targetY ?? 0, camCfg?.targetZ ?? 0)
    : new THREE.Vector3(safeSizeX * lookXOffset, safeSizeY * lookYOffset, safeSizeZ * lookZOffset);

  // Camera distance — fit model comfortably with margin
  const zoomMul = camCfg ? camCfg.zoom : 1.2;

  // Camera angle: use per-model values or defaults
  const angleDeg = camCfg ? camCfg.angle : 150;
  const heightDeg = camCfg ? camCfg.height : 72;
  const theta = THREE.MathUtils.degToRad(angleDeg);
  const phi = THREE.MathUtils.degToRad(heightDeg);
  const perspectiveFov = (camera as THREE.PerspectiveCamera).fov;
  const perspectiveFovRad = THREE.MathUtils.degToRad(perspectiveFov / 2);
  const baseFitDistance = (maxDim / 2) / Math.tan(perspectiveFovRad);

  if (useOrtho) {
    // Orthographic camera — no perspective distortion, like Blockbench
    const orthoHalfH = (maxDim / 2) * zoomMul;
    const orthoHalfW = orthoHalfH * aspect;
    camera = new THREE.OrthographicCamera(-orthoHalfW, orthoHalfW, orthoHalfH, -orthoHalfH, 0.01, maxDim * 10);
    if (hasExplicitPosition) {
      camera.position.set(camCfg?.positionX ?? 0, camCfg?.positionY ?? 0, camCfg?.positionZ ?? maxDim * 3);
    } else {
      const orthoDist = maxDim * 3;
      camera.position.set(
        orthoDist * Math.sin(phi) * Math.sin(theta),
        orthoDist * Math.cos(phi),
        orthoDist * Math.sin(phi) * Math.cos(theta)
      );
    }
  } else {
    // Perspective camera
    if (hasExplicitPosition) {
      camera.position.set(camCfg?.positionX ?? 0, camCfg?.positionY ?? 0, camCfg?.positionZ ?? baseFitDistance * zoomMul);
    } else {
      const camDist = baseFitDistance * zoomMul;
      camera.position.set(
        camDist * Math.sin(phi) * Math.sin(theta),
        camDist * Math.cos(phi),
        camDist * Math.sin(phi) * Math.cos(theta)
      );
    }
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

  function getCameraDebugInfo(): ModelViewerCameraDebugInfo {
    const target = controls?.target.clone() ?? lookTarget.clone();
    const position = camera.position.clone();
    const offset = position.clone().sub(target);
    const distance = Math.max(offset.length(), 0.0001);
    const angle = (THREE.MathUtils.radToDeg(Math.atan2(offset.x, offset.z)) + 360) % 360;
    const height = THREE.MathUtils.radToDeg(
      Math.acos(THREE.MathUtils.clamp(offset.y / distance, -1, 1))
    );
    const lookX = target.x / safeSizeX;
    const lookY = target.y / safeSizeY;
    const lookZ = target.z / safeSizeZ;
    const cameraZoom = camera instanceof THREE.OrthographicCamera ? camera.zoom : camera.zoom;
    const zoom = camera instanceof THREE.OrthographicCamera
      ? (((camera.top - camera.bottom) / 2) / Math.max(camera.zoom, 0.0001)) / Math.max(maxDim / 2, 0.0001)
      : distance / Math.max(baseFitDistance, 0.0001);

    const compactConfig: ModelViewerCameraConfig = {
      angle: round(angle, 1),
      height: round(height, 1),
      zoom: round(zoom),
      lookX: round(lookX),
      lookY: round(lookY),
      ortho: camera instanceof THREE.OrthographicCamera,
    };

    if (Math.abs(lookZ) > 0.0005) {
      compactConfig.lookZ = round(lookZ);
    }

    const exactConfig: ModelViewerExactCameraConfig = {
      angle: round(angle, 1),
      height: round(height, 1),
      zoom: round(zoom),
      lookX: round(lookX),
      lookY: round(lookY),
      lookZ: round(lookZ),
      ortho: camera instanceof THREE.OrthographicCamera,
      positionX: round(position.x),
      positionY: round(position.y),
      positionZ: round(position.z),
      targetX: round(target.x),
      targetY: round(target.y),
      targetZ: round(target.z),
    };

    return {
      mode: camera instanceof THREE.OrthographicCamera ? 'orthographic' : 'perspective',
      angle: round(angle, 1),
      height: round(height, 1),
      zoom: round(zoom),
      cameraZoom: round(cameraZoom),
      distance: round(distance),
      position: {
        x: round(position.x),
        y: round(position.y),
        z: round(position.z),
      },
      target: {
        x: round(target.x),
        y: round(target.y),
        z: round(target.z),
      },
      compactConfig,
      exactConfig,
    };
  }

  /* ── Return handle ─────────────────────────────── */
  return {
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      controls?.dispose();
      mixer?.stopAllAction();
      renderer.dispose();
      const disposedTextures = new Set<THREE.Texture>();
      const disposedMaterials = new Set<THREE.Material>();
      const disposeTexture = (texture?: THREE.Texture | null) => {
        if (!texture || disposedTextures.has(texture)) return;
        disposedTextures.add(texture);
        texture.dispose();
      };

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((mat) => {
            if (disposedMaterials.has(mat)) return;
            disposedMaterials.add(mat);

            const material = mat as ViewerMaterial;
            disposeTexture(material.map);
            disposeTexture(material.normalMap);
            disposeTexture(material.emissiveMap);
            disposeTexture(material.alphaMap);
            disposeTexture(material.roughnessMap);
            disposeTexture(material.metalnessMap);
            disposeTexture(material.aoMap);
            mat.dispose();
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
    getCameraDebugInfo,
  };
}
