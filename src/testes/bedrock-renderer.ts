/**
 * GLTF Model viewer using Three.js.
 * Loads .gltf/.glb with richer studio lighting, AO and emissive bloom.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const missingOptionalTextureUrls = new Set<string>();

/* ─── Public interface ─────────────────────────────────── */
export type ModelViewerLightingMode = 'enhanced' | 'basic';

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
  heightMap?: boolean | string;
  heightMapStrength?: number;
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
  /** Runtime lighting quality */
  lightingMode?: ModelViewerLightingMode;
  onReady?: () => void;
}

export interface ModelViewer {
  dispose: () => void;
  resize: () => void;
  setInteractive: (v: boolean) => void;
  setLightingMode: (mode: ModelViewerLightingMode) => void;
  getLightingMode: () => ModelViewerLightingMode;
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
    lightingMode: preferredLightingMode,
    onReady,
  } = opts;
  const perfTier = (window as any).__perfTier;
  const maxPixelRatio = perfTier?.isLowEnd ? 1 : perfTier?.isMobile ? 1.15 : 1.5;
  const supportsPostProcessing = !perfTier?.isLowEnd;
  const enableShadows = !(perfTier?.isLowEnd || perfTier?.isMobile);
  let lightingMode: ModelViewerLightingMode = preferredLightingMode ?? (perfTier?.isLowEnd || perfTier?.isMobile ? 'basic' : 'enhanced');
  const optionalTextureLoader = new THREE.TextureLoader();

  function round(value: number, decimals = 3) {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
  }

  function sanitizeStem(value?: string | null) {
    if (!value) return '';
    const tail = value.split('?')[0]?.split('#')[0]?.split('/').pop() ?? value;
    return tail.replace(/\.[a-z0-9]+$/i, '').trim();
  }

  function addStemVariant(stems: Set<string>, value?: string | null) {
    const stem = sanitizeStem(value);
    if (!stem) return;

    stems.add(stem);

    const normalized = stem.replace(/(\.geo|\.animation|\.model)$/i, '');
    if (normalized && normalized !== stem) {
      stems.add(normalized);
    }
  }

  function applyTextureTransform(source: THREE.Texture, target: THREE.Texture) {
    target.wrapS = source.wrapS;
    target.wrapT = source.wrapT;
    target.offset.copy(source.offset);
    target.repeat.copy(source.repeat);
    target.center.copy(source.center);
    target.rotation = source.rotation;
    target.flipY = source.flipY;
    target.matrixAutoUpdate = source.matrixAutoUpdate;
    target.matrix.copy(source.matrix);
    target.needsUpdate = true;
  }

  function getTextureCanvasSource(texture?: THREE.Texture | null) {
    const image = (texture?.source?.data ?? texture?.image) as
      | (CanvasImageSource & { naturalWidth?: number; naturalHeight?: number; complete?: boolean })
      | null
      | undefined;

    if (!image) return null;

    const width = image.naturalWidth ?? (image as { width?: number }).width ?? 0;
    const height = image.naturalHeight ?? (image as { height?: number }).height ?? 0;

    if (!width || !height) return null;
    if ('complete' in image && image.complete === false) return null;

    return { image, width, height };
  }

  function createAlphaEmissiveTexture(texture: THREE.Texture, alphaCutoff = 0) {
    const source = getTextureCanvasSource(texture);
    if (!source) return null;

    const canvas = document.createElement('canvas');
    canvas.width = source.width;
    canvas.height = source.height;

    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return null;

    context.clearRect(0, 0, source.width, source.height);
    context.drawImage(source.image, 0, 0, source.width, source.height);

    const sourceData = context.getImageData(0, 0, source.width, source.height);
    const outputData = context.createImageData(source.width, source.height);
    const visibleAlphaFloor = Math.max(alphaCutoff, 0.02);
    let hasVisibleGlow = false;

    for (let index = 0; index < sourceData.data.length; index += 4) {
      const alpha = sourceData.data[index + 3] / 255;
      let glow = 0;

      if (alpha > visibleAlphaFloor && alpha < 0.995) {
        const normalizedAlphaGap = THREE.MathUtils.clamp((1 - alpha) / (1 - visibleAlphaFloor), 0, 1);
        glow = Math.pow(normalizedAlphaGap, 1.35);
        hasVisibleGlow = hasVisibleGlow || glow > 0.015;
      }

      outputData.data[index] = Math.round(sourceData.data[index] * glow);
      outputData.data[index + 1] = Math.round(sourceData.data[index + 1] * glow);
      outputData.data[index + 2] = Math.round(sourceData.data[index + 2] * glow);
      outputData.data[index + 3] = 255;
    }

    if (!hasVisibleGlow) {
      return null;
    }

    context.putImageData(outputData, 0, 0);

    const emissiveTexture = new THREE.CanvasTexture(canvas);
    emissiveTexture.colorSpace = THREE.SRGBColorSpace;
    applyTextureTransform(texture, emissiveTexture);
    configurePixelTexture(emissiveTexture);
    return emissiveTexture;
  }

  function createHeightCavityTexture(heightTexture: THREE.Texture) {
    const source = getTextureCanvasSource(heightTexture);
    if (!source) return null;

    const canvas = document.createElement('canvas');
    canvas.width = source.width;
    canvas.height = source.height;

    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return null;

    context.clearRect(0, 0, source.width, source.height);
    context.drawImage(source.image, 0, 0, source.width, source.height);

    const sourceData = context.getImageData(0, 0, source.width, source.height);
    const outputData = context.createImageData(source.width, source.height);
    const { width, height } = source;

    const sampleLuminance = (x: number, y: number) => {
      const safeX = THREE.MathUtils.clamp(x, 0, width - 1);
      const safeY = THREE.MathUtils.clamp(y, 0, height - 1);
      const index = (safeY * width + safeX) * 4;
      const alpha = sourceData.data[index + 3] / 255;
      if (alpha <= 0.001) return 0;

      const red = sourceData.data[index] / 255;
      const green = sourceData.data[index + 1] / 255;
      const blue = sourceData.data[index + 2] / 255;
      return (red * 0.2126) + (green * 0.7152) + (blue * 0.0722);
    };

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const center = sampleLuminance(x, y);
        const left = sampleLuminance(x - 1, y);
        const right = sampleLuminance(x + 1, y);
        const up = sampleLuminance(x, y - 1);
        const down = sampleLuminance(x, y + 1);
        const neighborAverage = (left + right + up + down) * 0.25;
        const edge = Math.abs(right - left) + Math.abs(down - up);
        const cavity = THREE.MathUtils.clamp((center - neighborAverage) * 2.35 + center * 0.16, 0, 1);
        const shadow = THREE.MathUtils.clamp((cavity * 0.78) + (edge * 0.52), 0, 0.9);
        const value = Math.round((1 - shadow) * 255);
        const index = (y * width + x) * 4;

        outputData.data[index] = value;
        outputData.data[index + 1] = value;
        outputData.data[index + 2] = value;
        outputData.data[index + 3] = 255;
      }
    }

    context.putImageData(outputData, 0, 0);

    const cavityTexture = new THREE.CanvasTexture(canvas);
    cavityTexture.colorSpace = THREE.NoColorSpace;
    cavityTexture.channel = 0;
    applyTextureTransform(heightTexture, cavityTexture);
    configurePixelTexture(cavityTexture);
    return cavityTexture;
  }

  function resolveHeightMapCandidateUrls(texture?: THREE.Texture | null) {
    const explicitHeightMap = renderCfg?.heightMap;
    const modelDirectory = modelUrl.includes('/') ? modelUrl.slice(0, modelUrl.lastIndexOf('/') + 1) : '/';

    if (typeof explicitHeightMap === 'string' && explicitHeightMap.trim()) {
      const path = explicitHeightMap.trim();
      return [/^(?:https?:)?\//i.test(path) ? path : `${modelDirectory}${path}`];
    }

    const stems = new Set<string>();
    addStemVariant(stems, modelUrl);
    addStemVariant(stems, texture?.name);

    const sourceData = texture?.source?.data as { currentSrc?: string; src?: string } | undefined;
    addStemVariant(stems, sourceData?.currentSrc ?? sourceData?.src);

    return Array.from(stems).flatMap((stem) => [
      `${modelDirectory}${stem}_height_map.png`,
      `${modelDirectory}${stem}.height_map.png`,
    ]);
  }

  async function loadOptionalTexture(url: string) {
    if (!url || missingOptionalTextureUrls.has(url)) return null;

    try {
      return await optionalTextureLoader.loadAsync(url);
    } catch {
      missingOptionalTextureUrls.add(url);
      return null;
    }
  }

  async function loadHeightMapTexture(texture?: THREE.Texture | null) {
    const shouldUseHeightMap = renderCfg?.heightMap === true
      || typeof renderCfg?.heightMap === 'string'
      || renderCfg?.heightMapStrength !== undefined;

    if (!shouldUseHeightMap) return null;

    const candidates = resolveHeightMapCandidateUrls(texture);
    for (const candidate of candidates) {
      const heightTexture = await loadOptionalTexture(candidate);
      if (!heightTexture) continue;

      heightTexture.colorSpace = THREE.NoColorSpace;
      if (texture) {
        applyTextureTransform(texture, heightTexture);
      }
      configurePixelTexture(heightTexture);
      return heightTexture;
    }

    return null;
  }

  function configurePixelTexture(texture?: THREE.Texture | null) {
    if (!texture) return;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
  }

  function createSoftShadowTexture() {
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const context = shadowCanvas.getContext('2d');

    if (context) {
      const gradient = context.createRadialGradient(128, 128, 24, 128, 128, 120);
      gradient.addColorStop(0, 'rgba(12, 16, 22, 0.72)');
      gradient.addColorStop(0.45, 'rgba(12, 16, 22, 0.28)');
      gradient.addColorStop(1, 'rgba(12, 16, 22, 0)');
      context.fillStyle = gradient;
      context.fillRect(0, 0, shadowCanvas.width, shadowCanvas.height);
    }

    const texture = new THREE.CanvasTexture(shadowCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }

  /* ── Renderer ──────────────────────────────────── */
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.shadowMap.enabled = enableShadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  function updateSize() {
    const w = Math.max(canvas.clientWidth, 1);
    const h = Math.max(canvas.clientHeight, 1);
    if (canvas.width !== w || canvas.height !== h) {
      renderer.setSize(w, h, false);
    }
  }
  updateSize();

  /* ── Scene ─────────────────────────────────────── */
  const scene = new THREE.Scene();
  let studioEnvironmentTarget: THREE.WebGLRenderTarget | null = null;
  let studioEnvironmentTexture: THREE.Texture | null = null;
  let pmremGenerator: THREE.PMREMGenerator | null = null;
  let roomEnvironment: RoomEnvironment | null = null;

  if (!perfTier?.isLowEnd) {
    pmremGenerator = new THREE.PMREMGenerator(renderer);
    roomEnvironment = new RoomEnvironment();
    studioEnvironmentTarget = pmremGenerator.fromScene(roomEnvironment, 0.03);
    studioEnvironmentTexture = studioEnvironmentTarget.texture;
  }

  /* ── Camera ────────────────────────────────────── */
  const aspect = Math.max(canvas.clientWidth, 1) / Math.max(canvas.clientHeight, 1);
  const useOrtho = camCfg?.ortho ?? false;
  let camera: THREE.PerspectiveCamera | THREE.OrthographicCamera = new THREE.PerspectiveCamera(40, aspect, 0.01, 500);

  /* ── Lights ────────────────────────────────────── */
  const lightTarget = new THREE.Object3D();
  scene.add(lightTarget);

  const ambientLight = new THREE.AmbientLight(0xfff7e4, 1.15);
  scene.add(ambientLight);

  const hemiLight = new THREE.HemisphereLight(0xffefdc, 0x17110c, 0.6);
  hemiLight.position.set(0, 10, 0);
  scene.add(hemiLight);

  const keyLight = new THREE.DirectionalLight(0xffd2a0, 2.1);
  keyLight.castShadow = enableShadows;
  keyLight.shadow.mapSize.width = 1024;
  keyLight.shadow.mapSize.height = 1024;
  keyLight.shadow.bias = -0.00025;
  keyLight.shadow.normalBias = 0.02;
  keyLight.target = lightTarget;
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xf4dcc1, 0.9);
  fillLight.target = lightTarget;
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xffcf93, 0.8);
  rimLight.target = lightTarget;
  scene.add(rimLight);

  const kickLight = new THREE.DirectionalLight(0x7bbef6, 0.35);
  kickLight.target = lightTarget;
  scene.add(kickLight);

  const bottomLight = new THREE.DirectionalLight(0xfff1db, 0.22);
  bottomLight.target = lightTarget;
  scene.add(bottomLight);

  /* ── Load GLTF ─────────────────────────────────── */
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(modelUrl);
  const model = gltf.scene;
  type ViewerMaterial = THREE.Material & {
    map?: THREE.Texture | null;
    bumpMap?: THREE.Texture | null;
    bumpScale?: number;
    normalMap?: THREE.Texture | null;
    normalScale?: THREE.Vector2;
    emissive?: THREE.Color;
    emissiveIntensity?: number;
    emissiveMap?: THREE.Texture | null;
    alphaMap?: THREE.Texture | null;
    roughnessMap?: THREE.Texture | null;
    metalnessMap?: THREE.Texture | null;
    aoMap?: THREE.Texture | null;
    aoMapIntensity?: number;
    envMapIntensity?: number;
    roughness?: number;
    transparent?: boolean;
    alphaTest?: number;
    opacity?: number;
    depthWrite?: boolean;
    toneMapped?: boolean;
    side: THREE.Side;
    shadowSide?: THREE.Side | null;
  };
  type ManagedMaterial = {
    material: ViewerMaterial;
    hasAlpha: boolean;
    emissiveBase: number;
    originalEnvMapIntensity: number;
    originalAoMap: THREE.Texture | null;
    originalAoIntensity: number | null;
    originalRoughness: number | null;
    originalToneMapped: boolean;
    originalEmissiveColor: THREE.Color | null;
    originalEmissiveIntensity: number;
    originalEmissiveMap: THREE.Texture | null;
    originalBumpMap: THREE.Texture | null;
    originalBumpScale: number | null;
    originalNormalMap: THREE.Texture | null;
    originalNormalScale: THREE.Vector2 | null;
    alphaDrivenEmissiveMap: THREE.Texture | null;
    heightDrivenBumpMap: THREE.Texture | null;
    heightDrivenAoMap: THREE.Texture | null;
  };
  const managedMaterials: ManagedMaterial[] = [];
  const enableEmissive = renderCfg?.emissive ?? false;
  const emissiveIntensity = renderCfg?.emissiveIntensity ?? 1.35;
  const heightMapStrength = Math.abs(renderCfg?.heightMapStrength ?? 0.16);
  const forceOneSided = renderCfg?.oneSided ?? false;

  model.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;

    child.castShadow = enableShadows;
    child.receiveShadow = enableShadows;

    const mats = Array.isArray(child.material) ? child.material : [child.material];
    mats.forEach((mat) => {
      const material = mat as ViewerMaterial;
      const hasAlpha = Boolean(material.transparent || material.alphaMap || (material.alphaTest ?? 0) > 0);

      managedMaterials.push({
        material,
        hasAlpha,
        emissiveBase: enableEmissive ? emissiveIntensity : (material.emissiveIntensity ?? 1),
        originalEnvMapIntensity: material.envMapIntensity ?? 1,
        originalAoMap: material.aoMap ?? null,
        originalAoIntensity: material.aoMapIntensity ?? null,
        originalRoughness: material.roughness ?? null,
        originalToneMapped: material.toneMapped ?? true,
        originalEmissiveColor: material.emissive?.clone() ?? null,
        originalEmissiveIntensity: material.emissiveIntensity ?? 1,
        originalEmissiveMap: material.emissiveMap ?? null,
        originalBumpMap: material.bumpMap ?? null,
        originalBumpScale: material.bumpScale ?? null,
        originalNormalMap: material.normalMap ?? null,
        originalNormalScale: material.normalScale?.clone() ?? null,
        alphaDrivenEmissiveMap: null,
        heightDrivenBumpMap: null,
        heightDrivenAoMap: null,
      });

      configurePixelTexture(material.map);
      configurePixelTexture(material.bumpMap);
      configurePixelTexture(material.normalMap);
      configurePixelTexture(material.emissiveMap);
      configurePixelTexture(material.alphaMap);
      configurePixelTexture(material.roughnessMap);
      configurePixelTexture(material.metalnessMap);
      configurePixelTexture(material.aoMap);

      if (forceOneSided) {
        material.side = THREE.FrontSide;
        material.shadowSide = THREE.FrontSide;
      }

      if (hasAlpha) {
        material.alphaTest = Math.max(material.alphaTest ?? 0, 0.01);
      }

      material.needsUpdate = true;
    });
  });

  await Promise.all(
    managedMaterials.map(async (entry) => {
      const { material } = entry;

      if (enableEmissive && material.map && !entry.originalEmissiveMap) {
        entry.alphaDrivenEmissiveMap = createAlphaEmissiveTexture(material.map, material.alphaTest ?? 0);
      }

      if (!material.normalMap && !entry.originalBumpMap) {
        const heightTexture = await loadHeightMapTexture(material.map);
        if (heightTexture) {
          entry.heightDrivenBumpMap = heightTexture;

          if (!entry.originalAoMap) {
            entry.heightDrivenAoMap = createHeightCavityTexture(heightTexture);
          }
        }
      }

      material.needsUpdate = true;
    })
  );

  /* ── Bounds / centering ────────────────────────── */
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const safeSizeX = Math.abs(size.x) > 0.0001 ? size.x : maxDim;
  const safeSizeY = Math.abs(size.y) > 0.0001 ? size.y : maxDim;
  const safeSizeZ = Math.abs(size.z) > 0.0001 ? size.z : maxDim;
  const centeredMinY = box.min.y - center.y;
  const hasExplicitPosition = camCfg?.positionX !== undefined || camCfg?.positionY !== undefined || camCfg?.positionZ !== undefined;
  const hasExplicitTarget = camCfg?.targetX !== undefined || camCfg?.targetY !== undefined || camCfg?.targetZ !== undefined;

  model.position.sub(center);
  scene.add(model);

  const lookXOffset = camCfg ? camCfg.lookX : 0;
  const lookYOffset = camCfg ? camCfg.lookY : 0;
  const lookZOffset = camCfg?.lookZ ?? 0;
  const lookTarget = hasExplicitTarget
    ? new THREE.Vector3(camCfg?.targetX ?? 0, camCfg?.targetY ?? 0, camCfg?.targetZ ?? 0)
    : new THREE.Vector3(safeSizeX * lookXOffset, safeSizeY * lookYOffset, safeSizeZ * lookZOffset);

  const contactShadowTexture = createSoftShadowTexture();
  const contactShadowMaterial = new THREE.MeshBasicMaterial({
    map: contactShadowTexture,
    transparent: true,
    depthWrite: false,
    opacity: 0.28,
    color: 0x10151c,
  });
  const contactShadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), contactShadowMaterial);
  const shadowDiameter = Math.max(Math.max(size.x, size.z), maxDim * 0.68);
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.scale.set(shadowDiameter * 1.4, shadowDiameter * 1.15, 1);
  contactShadow.position.set(0, centeredMinY - Math.min(maxDim * 0.02, 0.05), 0);
  contactShadow.renderOrder = -1;
  scene.add(contactShadow);

  /* ── Camera placement ──────────────────────────── */
  const zoomMul = camCfg ? camCfg.zoom : 1.2;
  const angleDeg = camCfg ? camCfg.angle : 150;
  const heightDeg = camCfg ? camCfg.height : 72;
  const theta = THREE.MathUtils.degToRad(angleDeg);
  const phi = THREE.MathUtils.degToRad(heightDeg);
  const perspectiveFov = (camera as THREE.PerspectiveCamera).fov;
  const perspectiveFovRad = THREE.MathUtils.degToRad(perspectiveFov / 2);
  const baseFitDistance = Math.max((maxDim / 2) / Math.tan(perspectiveFovRad), 0.1);

  if (useOrtho) {
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
  } else if (hasExplicitPosition) {
    camera.position.set(camCfg?.positionX ?? 0, camCfg?.positionY ?? 0, camCfg?.positionZ ?? baseFitDistance * zoomMul);
  } else {
    const camDist = baseFitDistance * zoomMul;
    camera.position.set(
      camDist * Math.sin(phi) * Math.sin(theta),
      camDist * Math.cos(phi),
      camDist * Math.sin(phi) * Math.cos(theta)
    );
  }
  camera.lookAt(lookTarget);

  const camDist = Math.max(camera.position.distanceTo(lookTarget), 0.0001);

  /* ── Post-processing / rig ─────────────────────── */
  let composer: EffectComposer | null = null;
  let ssaoPass: SSAOPass | null = null;
  let bloomPass: UnrealBloomPass | null = null;

  function disposeComposer() {
    if (!composer) return;
    composer.dispose();
    composer = null;
    ssaoPass = null;
    bloomPass = null;
  }

  function updateShadowCamera(distance: number) {
    const shadowPad = Math.max(maxDim * 0.95, 2);
    keyLight.shadow.camera.left = -shadowPad;
    keyLight.shadow.camera.right = shadowPad;
    keyLight.shadow.camera.top = shadowPad;
    keyLight.shadow.camera.bottom = -shadowPad;
    keyLight.shadow.camera.near = 0.1;
    keyLight.shadow.camera.far = distance * 4;
    keyLight.shadow.camera.updateProjectionMatrix();
  }

  function syncPostProcessing() {
    disposeComposer();

    if (lightingMode !== 'enhanced' || !supportsPostProcessing) {
      return;
    }

    const width = Math.max(canvas.clientWidth, 1);
    const height = Math.max(canvas.clientHeight, 1);
    composer = new EffectComposer(renderer);

    const renderPass = new RenderPass(scene, camera);
    renderPass.clearAlpha = 0;
    composer.addPass(renderPass);

    ssaoPass = new SSAOPass(scene, camera, width, height);
    ssaoPass.kernelRadius = perfTier?.isMobile ? 10 : 15;
    ssaoPass.minDistance = 0.0012;
    ssaoPass.maxDistance = perfTier?.isMobile ? 0.07 : 0.1;
    composer.addPass(ssaoPass);

    if (enableEmissive) {
      bloomPass = new UnrealBloomPass(
        new THREE.Vector2(width, height),
        perfTier?.isMobile ? 0.38 : 0.56,
        0.62,
        0.84,
      );
      composer.addPass(bloomPass);
    }

    composer.addPass(new OutputPass());
  }

  function applyMaterialLook(mode: ModelViewerLightingMode) {
    const enhanced = mode === 'enhanced';

    managedMaterials.forEach((entry) => {
      const {
        material,
        emissiveBase,
        originalEnvMapIntensity,
        originalAoMap,
        originalAoIntensity,
        originalRoughness,
        originalToneMapped,
        originalEmissiveColor,
        originalEmissiveIntensity,
        originalEmissiveMap,
        originalBumpMap,
        originalBumpScale,
        originalNormalMap,
        originalNormalScale,
        alphaDrivenEmissiveMap,
        heightDrivenBumpMap,
        heightDrivenAoMap,
      } = entry;

      if (material.envMapIntensity !== undefined) {
        material.envMapIntensity = enhanced
          ? THREE.MathUtils.clamp(originalEnvMapIntensity, 0.16, 0.28)
          : Math.min(originalEnvMapIntensity, 0.2);
      }

      if (material.aoMap !== undefined) {
        material.aoMap = heightDrivenAoMap ?? originalAoMap;

        if (material.aoMapIntensity !== undefined) {
          material.aoMapIntensity = heightDrivenAoMap
            ? (enhanced ? 0.46 : 0.22)
            : (originalAoIntensity ?? 1);
        }
      }

      if (material.roughness !== undefined && originalRoughness !== null) {
        material.roughness = enhanced
          ? THREE.MathUtils.clamp(originalRoughness, 0.78, 0.98)
          : Math.min(Math.max(originalRoughness, 0.82), 1);
      }

      if (material.normalMap !== undefined) {
        material.normalMap = heightDrivenBumpMap ? null : originalNormalMap;

        if (originalNormalScale && material.normalScale) {
          material.normalScale.copy(originalNormalScale);
        }
      }

      if (material.bumpMap !== undefined) {
        material.bumpMap = heightDrivenBumpMap ?? originalBumpMap;

        if (heightDrivenBumpMap) {
          material.bumpScale = (enhanced ? -1.18 : -0.72) * heightMapStrength;
        } else if (originalBumpScale !== null) {
          material.bumpScale = originalBumpScale;
        }
      }

      if (material.emissive) {
        const useAlphaDrivenEmissive = enableEmissive && Boolean(alphaDrivenEmissiveMap);
        const effectiveEmissiveMap = enableEmissive ? (alphaDrivenEmissiveMap ?? originalEmissiveMap) : originalEmissiveMap;
        material.emissiveMap = effectiveEmissiveMap;

        if (effectiveEmissiveMap) {
          if (useAlphaDrivenEmissive) {
            material.emissive.setRGB(1, 1, 1);
          } else if (originalEmissiveColor && originalEmissiveColor.getHex() !== 0x000000) {
            material.emissive.copy(originalEmissiveColor);
          } else {
            material.emissive.setRGB(1, 1, 1);
          }

          material.emissiveIntensity = emissiveBase * (enhanced ? 2.1 : 1.3);
        } else if (originalEmissiveColor) {
          material.emissive.copy(originalEmissiveColor);
          material.emissiveIntensity = originalEmissiveIntensity;
        }

        material.toneMapped = useAlphaDrivenEmissive ? false : originalToneMapped;
      }

      material.needsUpdate = true;
    });
  }

  const rigForward = new THREE.Vector3();
  const rigRight = new THREE.Vector3();
  const rigUp = new THREE.Vector3();
  const rigTarget = new THREE.Vector3();
  const worldUp = new THREE.Vector3(0, 1, 0);

  function updateLightRig(elapsed = 0) {
    rigTarget.copy(controls?.target ?? lookTarget);
    lightTarget.position.copy(rigTarget);
    lightTarget.updateMatrixWorld();

    rigForward.copy(camera.position).sub(rigTarget);
    if (rigForward.lengthSq() < 0.000001) {
      rigForward.set(0.35, 0.55, 1);
    }
    rigForward.normalize();

    rigRight.crossVectors(worldUp, rigForward);
    if (rigRight.lengthSq() < 0.000001) {
      rigRight.set(1, 0, 0);
    }
    rigRight.normalize();
    rigUp.crossVectors(rigForward, rigRight).normalize();

    const rigDistance = Math.max(maxDim * (lightingMode === 'enhanced' ? 1.9 : 1.45), 3);
    const driftA = lightingMode === 'enhanced' ? Math.sin(elapsed * 0.62) * 0.085 : 0;
    const driftB = lightingMode === 'enhanced' ? Math.cos(elapsed * 0.48) * 0.06 : 0;

    keyLight.position.copy(rigTarget)
      .addScaledVector(rigRight, rigDistance * (1.06 + driftA * 0.22))
      .addScaledVector(rigUp, rigDistance * (0.96 + driftB * 0.16))
      .addScaledVector(rigForward, rigDistance * 0.22);

    fillLight.position.copy(rigTarget)
      .addScaledVector(rigRight, rigDistance * (-1.12 + driftB * 0.1))
      .addScaledVector(rigUp, rigDistance * 0.14)
      .addScaledVector(rigForward, rigDistance * -0.18);

    rimLight.position.copy(rigTarget)
      .addScaledVector(rigRight, rigDistance * -0.46)
      .addScaledVector(rigUp, rigDistance * (0.94 + driftA * 0.1))
      .addScaledVector(rigForward, rigDistance * -1.26);

    kickLight.position.copy(rigTarget)
      .addScaledVector(rigRight, rigDistance * 0.08)
      .addScaledVector(rigUp, rigDistance * 1.22)
      .addScaledVector(rigForward, rigDistance * -0.84);

    bottomLight.position.copy(rigTarget)
      .addScaledVector(rigUp, rigDistance * -0.68)
      .addScaledVector(rigForward, rigDistance * -0.08);

    if (enableShadows && renderer.shadowMap.enabled) {
      updateShadowCamera(rigDistance);
    }
  }

  function setLightingMode(mode: ModelViewerLightingMode) {
    lightingMode = mode;
    const enhanced = mode === 'enhanced';

    renderer.toneMapping = THREE.NoToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.shadowMap.enabled = enableShadows && enhanced;
    renderer.shadowMap.needsUpdate = true;

    scene.environment = enhanced ? studioEnvironmentTexture : null;
    ambientLight.intensity = enhanced ? 0.08 : 1.04;
    hemiLight.intensity = enhanced ? 0.18 : 0.48;
    keyLight.intensity = enhanced ? 1.52 : 1.42;
    fillLight.intensity = enhanced ? 0.16 : 0.56;
    rimLight.intensity = enhanced ? 0.98 : 0.32;
    kickLight.intensity = enhanced ? 0.18 : 0.14;
    bottomLight.intensity = enhanced ? 0.03 : 0.08;
    contactShadowMaterial.opacity = enhanced ? 0.36 : 0.16;

    syncPostProcessing();
    applyMaterialLook(mode);
    updateLightRig(0);
  }

  /* ── Animation ─────────────────────────────────── */
  let mixer: THREE.AnimationMixer | null = null;
  let lastFrameTime = performance.now();
  let elapsedTime = 0;

  if (gltf.animations.length > 0) {
    mixer = new THREE.AnimationMixer(model);
    let clipIdx = 0;
    if (animationIndex !== undefined && animationIndex < gltf.animations.length) {
      clipIdx = animationIndex;
    } else {
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
    controls.autoRotate = false;
    controls.update();
  }

  setLightingMode(lightingMode);

  /* ── Render loop ───────────────────────────────── */
  let disposed = false;
  let raf = 0;

  function animate() {
    if (disposed) return;
    raf = requestAnimationFrame(animate);
    const now = performance.now();
    const delta = Math.min((now - lastFrameTime) / 1000, 0.1);
    lastFrameTime = now;
    elapsedTime += delta;
    mixer?.update(delta);
    controls?.update();
    updateLightRig(elapsedTime);
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
    const cameraZoom = camera.zoom;
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
      disposeComposer();

      contactShadow.geometry.dispose();
      contactShadowMaterial.dispose();
      contactShadowTexture.dispose();
      studioEnvironmentTarget?.dispose();
      roomEnvironment?.dispose();
      pmremGenerator?.dispose();
      renderer.dispose();

      const disposedTextures = new Set<THREE.Texture>();
      const disposedMaterials = new Set<THREE.Material>();
      const disposeTexture = (texture?: THREE.Texture | null) => {
        if (!texture || disposedTextures.has(texture)) return;
        disposedTextures.add(texture);
        texture.dispose();
      };

      scene.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh)) return;

        obj.geometry.dispose();
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((mat) => {
          if (disposedMaterials.has(mat)) return;
          disposedMaterials.add(mat);

          const material = mat as ViewerMaterial;
          disposeTexture(material.map);
          disposeTexture(material.bumpMap);
          disposeTexture(material.normalMap);
          disposeTexture(material.emissiveMap);
          disposeTexture(material.alphaMap);
          disposeTexture(material.roughnessMap);
          disposeTexture(material.metalnessMap);
          disposeTexture(material.aoMap);
          mat.dispose();
        });
      });
    },
    resize() {
      updateSize();
      const w = Math.max(canvas.clientWidth, 1);
      const h = Math.max(canvas.clientHeight, 1);
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
      bloomPass?.setSize(w, h);
    },
    setInteractive(v: boolean) {
      if (controls) controls.enabled = v;
    },
    setLightingMode(mode: ModelViewerLightingMode) {
      setLightingMode(mode);
    },
    getLightingMode() {
      return lightingMode;
    },
    getCameraDebugInfo,
  };
}
