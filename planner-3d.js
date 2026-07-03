import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TransformControls } from "three/addons/controls/TransformControls.js";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { DEFAULT_ARTIFACTS, DEFAULT_PLANNER, getAllArtifacts } from "./planner-artifacts.js";
import {
  buildLayoutObstacles,
  resolveMovement,
  WALK_BODY_RADIUS
} from "./planner-collision.js";
import { PlannerModelLibrary } from "./planner-model-loader.js";
import { buildProceduralFixture } from "./planner-shelf-models.js";
import { StoreTextureKit } from "./planner-textures.js";

const EYE_HEIGHT = 1.62;
const WALK_SPEED = 3.8;
const CAMERA_GRID_SPACING = 3;
const COVERAGE_CELL_SIZE = 1;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function disposeObject(object) {
  const disposedMaterials = new Set();
  object.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (!child.material) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => {
      if (disposedMaterials.has(material)) return;
      disposedMaterials.add(material);
      if (material.map) material.map = null;
      material.dispose();
    });
  });
}

function hexToNumber(hex, fallback = 0x94a3b8) {
  if (!hex || typeof hex !== "string") return fallback;
  const cleaned = hex.replace("#", "");
  const parsed = Number.parseInt(cleaned, 16);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Slim human silhouette (feet at y=0, ~1.7 m tall) merged into one geometry so it
 * can be reused for the human-scale reference and the instanced shopper crowd.
 * Matches the minimal dark-charcoal "scalie" look of the people reference art.
 */
function createHumanGeometry() {
  const parts = [];

  const head = new THREE.SphereGeometry(0.105, 16, 12);
  head.scale(0.92, 1.05, 0.92);
  head.translate(0, 1.58, 0);
  parts.push(head);

  const neck = new THREE.CylinderGeometry(0.04, 0.05, 0.08, 10);
  neck.translate(0, 1.47, 0);
  parts.push(neck);

  // Shoulders wide at top, tapering to the waist.
  const torso = new THREE.CylinderGeometry(0.16, 0.115, 0.5, 18);
  torso.scale(1, 1, 0.62);
  torso.translate(0, 1.19, 0);
  parts.push(torso);

  const hips = new THREE.CylinderGeometry(0.125, 0.12, 0.2, 16);
  hips.scale(1, 1, 0.66);
  hips.translate(0, 0.88, 0);
  parts.push(hips);

  for (const side of [-1, 1]) {
    const leg = new THREE.CylinderGeometry(0.062, 0.046, 0.86, 12);
    leg.translate(side * 0.07, 0.43, 0);
    parts.push(leg);

    const arm = new THREE.CylinderGeometry(0.045, 0.038, 0.6, 12);
    arm.rotateZ(side * 0.12);
    arm.translate(side * 0.2, 1.15, 0);
    parts.push(arm);
  }

  const merged = mergeGeometries(parts, false);
  parts.forEach((part) => part.dispose());
  merged.computeVertexNormals();
  return merged;
}

/** Small handheld shopping basket to read the reference figure as a shopper. */
function createBasketMesh(material) {
  const group = new THREE.Group();
  const basket = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.16, 0.18), material);
  basket.position.set(0.27, 0.92, 0.06);
  basket.castShadow = true;
  group.add(basket);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.012, 8, 16, Math.PI), material);
  handle.position.set(0.27, 1.0, 0.06);
  group.add(handle);
  return group;
}

function createStickFigure() {
  const group = new THREE.Group();
  group.name = "stick-figure";
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2b2f36, roughness: 0.92, metalness: 0.02 });
  const shadowMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, transparent: true, opacity: 0.32, roughness: 1 });

  const body = new THREE.Mesh(createHumanGeometry(), bodyMat);
  body.castShadow = true;
  group.add(body);

  group.add(createBasketMesh(bodyMat));

  const marker = new THREE.Mesh(new THREE.CircleGeometry(0.18, 28), shadowMat);
  marker.rotation.x = -Math.PI / 2;
  marker.position.y = 0.008;
  marker.receiveShadow = true;
  group.add(marker);

  return group;
}

export function createPlanner3D(containerEl, options = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf5f5f5);

  const storeGroup = new THREE.Group();
  storeGroup.name = "store-shell";
  scene.add(storeGroup);

  const fixturesGroup = new THREE.Group();
  fixturesGroup.name = "store-fixtures";
  scene.add(fixturesGroup);

  const humanGroup = new THREE.Group();
  humanGroup.name = "human-scale";
  humanGroup.visible = false;
  scene.add(humanGroup);

  const shoppersGroup = new THREE.Group();
  shoppersGroup.name = "sim-shoppers";
  scene.add(shoppersGroup);

  const SHOPPER_MAX = 120;
  const shopperGeo = createHumanGeometry();
  const shopperMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, metalness: 0.02 });
  const shopperMesh = new THREE.InstancedMesh(shopperGeo, shopperMat, SHOPPER_MAX);
  shopperMesh.count = 0;
  shopperMesh.castShadow = true;
  shopperMesh.visible = false;
  shoppersGroup.add(shopperMesh);
  const shopperDummy = new THREE.Object3D();
  // Dark "scalie" palette — a few charcoal/grey tones, like the people reference art.
  const SHOPPER_TONES = [0x2b2f36, 0x3b4250, 0x4b5563, 0x222529];
  const shopperColor = new THREE.Color();
  let shopperColorsInitialized = false;

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 600);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.domElement.style.display = "block";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  containerEl.appendChild(renderer.domElement);

  // Image-based lighting for realistic PBR reflections (glossy floor, product sheen).
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTexture;
  scene.background = new THREE.Color(0xeef0ee);

  const orbit = new OrbitControls(camera, renderer.domElement);
  orbit.enableDamping = true;
  orbit.dampingFactor = 0.07;
  orbit.maxPolarAngle = Math.PI / 2.02;
  orbit.minDistance = 2;
  orbit.maxDistance = 180;

  const transformControls = new TransformControls(camera, renderer.domElement);
  transformControls.setSpace("world");
  scene.add(transformControls);

  // Env map carries most of the ambient fill; keep direct lights for soft shadows + sheen.
  scene.add(new THREE.AmbientLight(0xffffff, 0.32));
  scene.add(new THREE.HemisphereLight(0xffffff, 0xeceef0, 0.55));
  const sun = new THREE.DirectionalLight(0xffffff, 1.05);
  sun.position.set(10, 24, 14);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 120;
  sun.shadow.camera.left = -40;
  sun.shadow.camera.right = 40;
  sun.shadow.camera.top = 40;
  sun.shadow.camera.bottom = -40;
  sun.shadow.bias = -0.00015;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xffffff, 0.35);
  fill.position.set(-8, 14, -6);
  scene.add(fill);

  const modelLibrary = new PlannerModelLibrary();
  const textureKit = new StoreTextureKit();
  let modelsLoaded = false;
  let layoutSyncToken = 0;
  let fixturesBuiltForToken = -1;
  let transformEmitTimer = null;

  const clock = new THREE.Clock();
  let animationId = null;
  let active = false;
  let lastLayout = null;
  let selectedGroup = null;
  let transformMode = "translate";
  let fixtureGroups = new Map();
  let layoutObstacles = [];
  let cameraViewMode = "isometric";
  let productFaceTextures = {};
  let storeSize = { w: 20, d: 20 };
  let floorMesh = null;
  let floorGridHelper = null;
  let lastShellSignature = null;
  let showMonitoringViz = true;
  let simulationMode = false;
  let heatmapMesh = null;
  let heatmapTexture = null;
  let heatmapCanvas = null;
  let heatmapCtx = null;
  let heatmapImageData = null;
  let heatmapCols = 0;
  let heatmapRows = 0;
  function mergeArtifactConfig(incoming) {
    const defaults = getAllArtifacts();
    if (!incoming) return structuredClone(defaults);
    return structuredClone({ ...defaults, ...incoming });
  }

  let artifactConfig = mergeArtifactConfig(options.artifacts);
  let plannerConfig = structuredClone(options.planner || DEFAULT_PLANNER);
  let interactionMode = "edit";
  let stickFigure = null;
  let humanPlaced = false;
  let pointerLockControls = null;
  const moveState = { forward: false, backward: false, left: false, right: false };

  function emitModeChange() {
    if (options.onInteractionModeChange) {
      options.onInteractionModeChange(interactionMode, { humanPlaced });
    }
  }

  function getArtifactSpec(kind) {
    const spec = artifactConfig[kind];
    if (spec) return spec;
    if (kind.startsWith("sign-")) {
      return {
        label: "Wall sign",
        type: "wall-sign",
        widthMeters: 5,
        depthMeters: 0.1,
        heightMeters: 2.4,
        signText: "SIGN",
        textColor: "#ffffff",
        panelColor: "#b8e0d2"
      };
    }
    return {
      label: "Fixture",
      widthMeters: 1,
      depthMeters: 1,
      heightMeters: 1.2,
      shelfLevels: 0,
      color3d: "#94a3b8"
    };
  }

  // Cameras are ceiling-mounted, so the room must be at least 2.8 m tall.
  const MIN_CEILING_HEIGHT = 2.8;

  function wallHeight() {
    const configured = plannerConfig.wallHeightMeters ?? DEFAULT_PLANNER.wallHeightMeters;
    return Math.max(MIN_CEILING_HEIGHT, configured);
  }

  function wallThickness() {
    return plannerConfig.wallThicknessMeters ?? DEFAULT_PLANNER.wallThicknessMeters;
  }

  const FLOOR_Y = 0;
  const CEILING_CAMERA_INSET = 0.08;

  function ceilingCameraMountY() {
    return wallHeight() - CEILING_CAMERA_INSET;
  }

  function cameraFovConeHeight(mountY, floorY = FLOOR_Y) {
    return Math.max(0.5, mountY - floorY);
  }

  function storeBounds(margin = 0.35) {
    return {
      minX: margin,
      maxX: storeSize.w - margin,
      minZ: margin,
      maxZ: storeSize.d - margin
    };
  }

  function clampToStore(x, z, margin = 0.35) {
    const bounds = storeBounds(margin);
    return {
      x: clamp(x, bounds.minX, bounds.maxX),
      z: clamp(z, bounds.minZ, bounds.maxZ)
    };
  }

  function refreshLayoutObstacles(layout) {
    layoutObstacles = buildLayoutObstacles(layout?.objects || [], {
      wallThickness: wallThickness()
    });
  }

  function fixtureTextureBridge() {
    if (!productFaceTextures.ambient) {
      productFaceTextures = {
        ambient: textureKit.createProductFaceTexture("ambient"),
        cold: textureKit.createProductFaceTexture("cold"),
        hot: textureKit.createProductFaceTexture("hot")
      };
    }
    return {
      getProductFace(variant) {
        return productFaceTextures[variant] || productFaceTextures.ambient;
      }
    };
  }

  function resolveBodyPosition(prevX, prevZ, nextX, nextZ, radius, excludeId = null) {
    const bounded = clampToStore(nextX, nextZ);
    return resolveMovement(prevX, prevZ, bounded.x, bounded.z, radius, layoutObstacles, { excludeId });
  }

  function makeMaterial(spec, kind = "") {
    const opacity = spec.opacity3d ?? 1;
    return new THREE.MeshStandardMaterial({
      color: hexToNumber(spec.color3d),
      transparent: opacity < 1,
      opacity,
      roughness: 0.72,
      metalness: kind.includes("cold") ? 0.15 : 0.05
    });
  }

  function addBox(parent, width, height, depth, spec, kind = "", yOffset = 0) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), makeMaterial(spec, kind));
    mesh.castShadow = height > 0.12;
    mesh.receiveShadow = true;
    mesh.position.y = yOffset + height / 2;
    parent.add(mesh);
    return mesh;
  }

  function createWallSignTexture(text, textColor, panelColor) {
    const canvas = document.createElement("canvas");
    const texW = 2048;
    const texH = 512;
    canvas.width = texW;
    canvas.height = texH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const panel = panelColor || "#b8e0d2";
    const fill = textColor || "#ffffff";
    const label = String(text || "SIGN").toUpperCase();

    ctx.fillStyle = panel;
    ctx.fillRect(0, 0, texW, texH);

    ctx.strokeStyle = "#5c9a82";
    ctx.lineWidth = 10;
    ctx.strokeRect(6, 6, texW - 12, texH - 12);

    let fontSize = 220;
    const fontFamily = "Arial, Helvetica, sans-serif";
    const fitFont = () => {
      ctx.font = `bold ${fontSize}px ${fontFamily}`;
    };
    fitFont();
    while (fontSize > 48 && ctx.measureText(label).width > texW * 0.86) {
      fontSize -= 6;
      fitFont();
    }

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    ctx.miterLimit = 2;

    const cx = texW / 2;
    const cy = texH / 2;
    ctx.strokeStyle = "#0b5345";
    ctx.lineWidth = Math.max(8, fontSize * 0.07);
    ctx.strokeText(label, cx, cy);
    ctx.fillStyle = fill;
    ctx.fillText(label, cx, cy);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    texture.needsUpdate = true;
    return texture;
  }

  function buildWallSign(parent, obj, spec, footprintW) {
    const storeW = storeSize.w || 20;
    const storeD = storeSize.d || 12;
    const x = obj.meters.x;
    const z = obj.meters.z;
    const panelW = footprintW;
    const panelH = Math.min(1.05, Math.max(0.72, (spec.heightMeters ?? 2.4) * 0.38));
    const mountY = Math.min(wallHeight() - panelH / 2 - 0.18, Math.max(2.15, spec.heightMeters ?? 2.4));
    const inset = 0.16;

    let localX = 0;
    let localZ = 0;
    let planeRotY = 0;

    const distBack = z;
    const distFront = storeD - z;
    const distLeft = x;
    const distRight = storeW - x;
    const minDist = Math.min(distBack, distFront, distLeft, distRight);

    if (minDist === distBack) {
      localZ = inset - z;
    } else if (minDist === distFront) {
      localZ = storeD - inset - z;
      planeRotY = Math.PI;
    } else if (minDist === distLeft) {
      localX = inset - x;
      planeRotY = -Math.PI / 2;
    } else {
      localX = storeW - inset - x;
      planeRotY = Math.PI / 2;
    }

    const texture = createWallSignTexture(spec.signText, spec.textColor, spec.panelColor);
    const mat = texture
      ? new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.FrontSide,
          polygonOffset: true,
          polygonOffsetFactor: -2,
          polygonOffsetUnits: -2
        })
      : makeMaterial(spec, "wall-sign");
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(panelW, panelH), mat);
    plane.position.set(localX, mountY, localZ);
    plane.rotation.y = planeRotY;
    plane.renderOrder = 3;
    parent.add(plane);
  }

  function findFixtureGroup(object) {
    let current = object;
    while (current) {
      if (current.userData?.objectId) return current;
      current = current.parent;
    }
    return null;
  }

  function clampGroupPosition(group) {
    const anchor = group.userData.dragAnchor || { x: group.position.x, z: group.position.z };
    const resolved = resolveBodyPosition(
      anchor.x,
      anchor.z,
      group.position.x,
      group.position.z,
      WALK_BODY_RADIUS,
      group.userData?.objectId || null
    );
    group.position.x = resolved.x;
    group.position.z = resolved.z;
    group.position.y = 0;
  }

  function emitTransform(group) {
    if (!group || !options.onObjectTransform) return;
    const angleDeg = -THREE.MathUtils.radToDeg(group.rotation.y);
    options.onObjectTransform({
      id: group.userData.objectId,
      kind: group.userData.kind,
      x: group.position.x,
      z: group.position.z,
      angle: ((angleDeg % 360) + 360) % 360
    });
  }

  function scheduleEmitTransform(group) {
    if (!group) return;
    if (transformEmitTimer) clearTimeout(transformEmitTimer);
    transformEmitTimer = setTimeout(() => {
      transformEmitTimer = null;
      emitTransform(group);
    }, 80);
  }

  function flushActiveTransform() {
    if (transformEmitTimer) {
      clearTimeout(transformEmitTimer);
      transformEmitTimer = null;
    }
    if (selectedGroup) emitTransform(selectedGroup);
  }

  function deleteSelectedFixture() {
    if (!selectedGroup || !options.onObjectDelete) return false;
    const objectId = selectedGroup.userData?.objectId;
    if (!objectId) return false;
    const removed = options.onObjectDelete(objectId);
    if (removed) selectFixture(null);
    return removed;
  }

  function selectFixture(group) {
    if (interactionMode !== "edit") return;
    selectedGroup = group || null;
    if (selectedGroup) {
      transformControls.attach(selectedGroup);
      transformControls.setMode(transformMode);
    } else {
      transformControls.detach();
    }
    if (options.onSelectionChange) options.onSelectionChange(selectedGroup?.userData?.objectId || null);
  }

  function ensureStickFigure() {
    if (!stickFigure) {
      stickFigure = createStickFigure();
      humanGroup.add(stickFigure);
    }
  }

  function placeHumanAt(x, z) {
    ensureStickFigure();
    const resolved = resolveBodyPosition(humanGroup.position.x, humanGroup.position.z, x, z, WALK_BODY_RADIUS);
    humanGroup.position.set(resolved.x, 0, resolved.z);
    humanGroup.rotation.y = 0;
    humanGroup.visible = true;
    humanPlaced = true;
    emitModeChange();
  }

  function syncHumanToCamera() {
    if (!humanPlaced) return;
    humanGroup.position.set(camera.position.x, 0, camera.position.z);
    humanGroup.rotation.y = camera.rotation.y;
  }

  function disposePointerLock() {
    if (!pointerLockControls) return;
    pointerLockControls.removeEventListener("unlock", onPointerUnlock);
    pointerLockControls.unlock();
    pointerLockControls.dispose();
    pointerLockControls = null;
  }

  function onPointerUnlock() {
    if (interactionMode === "walk") {
      applyInteractionMode("edit");
    }
  }

  function enterWalkMode() {
    if (!humanPlaced) {
      placeHumanAt(storeSize.w / 2, storeSize.d / 2);
    }

    interactionMode = "walk";
    selectFixture(null);
    transformControls.detach();
    transformControls.enabled = false;
    orbit.enabled = false;
    humanGroup.visible = false;

    camera.position.set(humanGroup.position.x, EYE_HEIGHT, humanGroup.position.z);
    camera.rotation.order = "YXZ";
    camera.rotation.x = 0;
    camera.rotation.y = humanGroup.rotation.y;
    camera.rotation.z = 0;

    pointerLockControls = new PointerLockControls(camera, renderer.domElement);
    pointerLockControls.addEventListener("unlock", onPointerUnlock);
    pointerLockControls.lock();

    emitModeChange();
  }

  function exitWalkMode() {
    disposePointerLock();
    humanGroup.visible = humanPlaced;
    if (humanPlaced) syncHumanToCamera();
    orbit.enabled = true;
    transformControls.enabled = true;
    fitCamera(false);
  }

  function applyInteractionMode(mode) {
    if (mode === interactionMode) return;

    if (interactionMode === "walk") exitWalkMode();

    interactionMode = mode;

    if (mode === "edit") {
      orbit.enabled = true;
      transformControls.enabled = !simulationMode;
      humanGroup.visible = humanPlaced;
      renderer.domElement.style.cursor = simulationMode ? "default" : "";
    } else if (mode === "placeHuman") {
      selectFixture(null);
      orbit.enabled = true;
      transformControls.enabled = false;
      humanGroup.visible = humanPlaced;
      renderer.domElement.style.cursor = "crosshair";
    } else if (mode === "walk") {
      enterWalkMode();
      return;
    }

    emitModeChange();
  }

  function updateWalk(delta) {
    if (interactionMode !== "walk" || !pointerLockControls?.isLocked) return;

    const prevX = camera.position.x;
    const prevZ = camera.position.z;
    const speed = WALK_SPEED * delta;
    if (moveState.forward) pointerLockControls.moveForward(speed);
    if (moveState.backward) pointerLockControls.moveForward(-speed);
    if (moveState.left) pointerLockControls.moveRight(-speed);
    if (moveState.right) pointerLockControls.moveRight(speed);

    const resolved = resolveBodyPosition(prevX, prevZ, camera.position.x, camera.position.z, WALK_BODY_RADIUS);
    camera.position.x = resolved.x;
    camera.position.z = resolved.z;
    camera.position.y = EYE_HEIGHT;
  }

  function onKeyDown(event) {
    if (interactionMode === "edit" && !simulationMode && (event.key === "Delete" || event.key === "Backspace")) {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA" || activeEl.tagName === "SELECT")) {
        return;
      }
      if (selectedGroup && deleteSelectedFixture()) {
        event.preventDefault();
      }
      return;
    }

    if (interactionMode !== "walk") return;
    switch (event.code) {
      case "ArrowUp":
      case "KeyW":
        moveState.forward = true;
        event.preventDefault();
        break;
      case "ArrowDown":
      case "KeyS":
        moveState.backward = true;
        event.preventDefault();
        break;
      case "ArrowLeft":
      case "KeyA":
        moveState.left = true;
        event.preventDefault();
        break;
      case "ArrowRight":
      case "KeyD":
        moveState.right = true;
        event.preventDefault();
        break;
      default:
        break;
    }
  }

  function onKeyUp(event) {
    switch (event.code) {
      case "ArrowUp":
      case "KeyW":
        moveState.forward = false;
        break;
      case "ArrowDown":
      case "KeyS":
        moveState.backward = false;
        break;
      case "ArrowLeft":
      case "KeyA":
        moveState.left = false;
        break;
      case "ArrowRight":
      case "KeyD":
        moveState.right = false;
        break;
      default:
        break;
    }
  }

  function layoutHasMonitoring(layout) {
    return (layout?.objects || []).some((obj) => obj.kind?.startsWith("monitor-"));
  }

  function createStandardMaterial(map, { roughness = 0.88, metalness = 0.02, color = 0xffffff } = {}) {
    return new THREE.MeshStandardMaterial({
      map,
      color,
      roughness,
      metalness
    });
  }

  function createCameraRig(x, mountY, z, { accent = 0x06b6d4, fovHeight, fovAngle = 52, fovOpacity = 0.1, floorY = FLOOR_Y } = {}) {
    const rig = new THREE.Group();
    rig.position.set(x, mountY, z);

    const coneHeight = Math.max(0.5, fovHeight ?? cameraFovConeHeight(mountY, floorY));

    const mountMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.45, metalness: 0.2 });
    const lensMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      emissive: accent,
      emissiveIntensity: 0.35,
      roughness: 0.2,
      metalness: 0.4
    });

    const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.05, 0.16), mountMat);
    bracket.position.y = -0.025;
    rig.add(bracket);

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 0.1), mountMat);
    body.position.y = -0.07;
    rig.add(body);

    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.05, 16), lensMat);
    lens.position.y = -0.11;
    rig.add(lens);

    const fovRadius = coneHeight * Math.tan(THREE.MathUtils.degToRad(fovAngle / 2));
    const fov = new THREE.Mesh(
      new THREE.ConeGeometry(fovRadius, coneHeight, 28, 1, true),
      new THREE.MeshBasicMaterial({
        color: accent,
        transparent: true,
        opacity: fovOpacity,
        depthWrite: false,
        side: THREE.DoubleSide
      })
    );
    // ConeGeometry is Y-centered: apex at +h/2, base at -h/2. Offset so apex is at the mount and base reaches y=0.
    fov.position.y = -coneHeight / 2;
    rig.add(fov);

    return rig;
  }

  function addLocalCoverageGrid(parent, footprintW, footprintD, strokeColor) {
    const cell = COVERAGE_CELL_SIZE;
    const cols = Math.max(1, Math.ceil(footprintW / cell));
    const rows = Math.max(1, Math.ceil(footprintD / cell));
    const points = [];
    const ox = -footprintW / 2;
    const oz = -footprintD / 2;

    for (let c = 0; c <= cols; c += 1) {
      const x = ox + c * cell;
      points.push(new THREE.Vector3(x, 0.06, oz), new THREE.Vector3(x, 0.06, oz + rows * cell));
    }
    for (let r = 0; r <= rows; r += 1) {
      const z = oz + r * cell;
      points.push(new THREE.Vector3(ox, 0.06, z), new THREE.Vector3(ox + cols * cell, 0.06, z));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const lines = new THREE.LineSegments(
      geometry,
      new THREE.LineBasicMaterial({ color: strokeColor, transparent: true, opacity: 0.55 })
    );
    parent.add(lines);
  }

  function disposeHeatmap() {
    if (heatmapMesh) {
      storeGroup.remove(heatmapMesh);
      disposeObject(heatmapMesh);
      heatmapMesh = null;
    }
    if (heatmapTexture) {
      heatmapTexture.dispose();
      heatmapTexture = null;
    }
    heatmapCanvas = null;
    heatmapCtx = null;
    heatmapImageData = null;
    heatmapCols = 0;
    heatmapRows = 0;
  }

  function ensureHeatmapSurface(heatmap) {
    const { cols, rows, pixels, widthMeters, depthMeters } = heatmap;
    if (heatmapMesh && heatmapCols === cols && heatmapRows === rows) {
      patchHeatmapPixels(pixels);
      return;
    }

    disposeHeatmap();
    heatmapCols = cols;
    heatmapRows = rows;
    heatmapCanvas = document.createElement("canvas");
    heatmapCanvas.width = cols;
    heatmapCanvas.height = rows;
    heatmapCtx = heatmapCanvas.getContext("2d");
    heatmapImageData = heatmapCtx.createImageData(cols, rows);

    heatmapTexture = new THREE.CanvasTexture(heatmapCanvas);
    heatmapTexture.colorSpace = THREE.SRGBColorSpace;
    heatmapTexture.minFilter = THREE.LinearFilter;
    heatmapTexture.magFilter = THREE.LinearFilter;

    const mat = new THREE.MeshBasicMaterial({
      map: heatmapTexture,
      transparent: true,
      opacity: 0.82,
      depthWrite: false
    });
    heatmapMesh = new THREE.Mesh(new THREE.PlaneGeometry(widthMeters, depthMeters), mat);
    heatmapMesh.rotation.x = -Math.PI / 2;
    heatmapMesh.position.set(widthMeters / 2, 0.048, depthMeters / 2);
    heatmapMesh.visible = simulationMode;
    heatmapMesh.name = "simulation-heatmap";
    heatmapMesh.renderOrder = 2;
    storeGroup.add(heatmapMesh);
    patchHeatmapPixels(pixels);
  }

  function patchHeatmapPixels(pixels) {
    if (!heatmapImageData || !heatmapCtx || !heatmapTexture || !pixels) return;
    heatmapImageData.data.set(pixels);
    heatmapCtx.putImageData(heatmapImageData, 0, 0);
    heatmapTexture.needsUpdate = true;
  }

  function updateHeatmap(heatmap) {
    if (!heatmap?.pixels || !lastLayout) return;
    ensureHeatmapSurface(heatmap);
  }

  function updateShoppers(positions) {
    const count = Math.min(positions?.length || 0, SHOPPER_MAX);
    for (let i = 0; i < count; i += 1) {
      const p = positions[i];
      // Deterministic per-shopper height variation for a natural crowd.
      const heightScale = 0.93 + ((i * 37) % 14) / 100;
      shopperDummy.position.set(p.x, 0, p.z);
      shopperDummy.rotation.y = p.angle || 0;
      shopperDummy.scale.set(1, heightScale, 1);
      shopperDummy.updateMatrix();
      shopperMesh.setMatrixAt(i, shopperDummy.matrix);
      if (!shopperColorsInitialized) {
        shopperColor.setHex(SHOPPER_TONES[(i * 7) % SHOPPER_TONES.length]);
        shopperMesh.setColorAt(i, shopperColor);
      }
    }
    shopperDummy.scale.set(1, 1, 1);
    // Colours are stable per instance index, so we only need to assign them once.
    if (!shopperColorsInitialized && count > 0) {
      if (shopperMesh.instanceColor) shopperMesh.instanceColor.needsUpdate = true;
      shopperColorsInitialized = count >= SHOPPER_MAX;
    }
    shopperMesh.count = count;
    shopperMesh.instanceMatrix.needsUpdate = count > 0;
    shopperMesh.visible = simulationMode && count > 0;
  }

  function clearShoppers() {
    shopperMesh.count = 0;
    shopperMesh.visible = false;
  }

  function setSimulationMode(on) {
    simulationMode = !!on;
    if (heatmapMesh) heatmapMesh.visible = simulationMode;
    if (!simulationMode) clearShoppers();
    else shopperMesh.visible = shopperMesh.count > 0;
    if (simulationMode) {
      selectFixture(null);
      transformControls.detach();
      transformControls.enabled = false;
      if (interactionMode === "walk" || interactionMode === "placeHuman") applyInteractionMode("edit");
    } else if (interactionMode === "edit") {
      transformControls.enabled = true;
    }
  }

  function shellSignature(layout) {
    return [
      layout.widthMeters,
      layout.heightMeters,
      wallHeight(),
      wallThickness(),
      layoutHasMonitoring(layout) ? 1 : 0,
      showMonitoringViz ? 1 : 0
    ].join("|");
  }

  function updateFloorGrid(w, d) {
    if (floorGridHelper) {
      scene.remove(floorGridHelper);
      floorGridHelper.geometry.dispose();
      const gridMaterials = Array.isArray(floorGridHelper.material)
        ? floorGridHelper.material
        : [floorGridHelper.material];
      gridMaterials.forEach((material) => material.dispose());
      floorGridHelper = null;
    }

    const span = Math.max(w, d);
    const divisions = Math.max(1, Math.ceil(span));
    floorGridHelper = new THREE.GridHelper(span, divisions, 0xe5e7eb, 0xf3f4f6);
    floorGridHelper.position.set(w / 2, 0.012, d / 2);
    floorGridHelper.material.opacity = 0.45;
    floorGridHelper.material.transparent = true;
    floorGridHelper.name = "store-floor-grid";
    scene.add(floorGridHelper);
  }

  function rebuildShell(layout) {
    textureKit.dispose();
    productFaceTextures = {};
    disposeHeatmap();
    while (storeGroup.children.length) {
      const child = storeGroup.children[0];
      storeGroup.remove(child);
      disposeObject(child);
    }

    const w = layout.widthMeters;
    const d = layout.heightMeters;
    storeSize = { w, d };
    const wallH = wallHeight();
    const wallT = wallThickness();
    const hasMonitoring = layoutHasMonitoring(layout);

    const floorTex = textureKit.applyRepeat(textureKit.createFloorTexture(), Math.max(1, w / 2), Math.max(1, d / 2));
    // Polished retail floor: low roughness + env reflections for the glossy showroom look.
    const floorMat = createStandardMaterial(floorTex, { roughness: 0.16, metalness: 0.0 });
    floorMat.envMapIntensity = 1.3;

    floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(w / 2, 0, d / 2);
    floorMesh.receiveShadow = true;
    floorMesh.userData.isStoreFloor = true;
    storeGroup.add(floorMesh);

    if (hasMonitoring && showMonitoringViz) {
      const coverageTex = textureKit.applyRepeat(
        textureKit.createCoverageGridTexture(),
        Math.max(1, w / COVERAGE_CELL_SIZE),
        Math.max(1, d / COVERAGE_CELL_SIZE)
      );
      const coverageMat = new THREE.MeshStandardMaterial({
        map: coverageTex,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        roughness: 1,
        metalness: 0
      });
      const coverage = new THREE.Mesh(new THREE.PlaneGeometry(w, d), coverageMat);
      coverage.rotation.x = -Math.PI / 2;
      coverage.position.set(w / 2, 0.025, d / 2);
      coverage.renderOrder = 1;
      storeGroup.add(coverage);
    }

    const wallTex = textureKit.applyRepeat(textureKit.createWallTexture(), Math.max(1, w / 2), Math.max(1, wallH / 2));
    const wallMat = new THREE.MeshStandardMaterial({
      map: wallTex,
      color: 0xf8fafc,
      roughness: 0.92,
      metalness: 0,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    [
      [w / 2, wallH / 2, -wallT / 2, w, wallH, wallT],
      [w / 2, wallH / 2, d + wallT / 2, w, wallH, wallT],
      [-wallT / 2, wallH / 2, d / 2, wallT, wallH, d],
      [w + wallT / 2, wallH / 2, d / 2, wallT, wallH, d]
    ].forEach(([x, y, z, ww, hh, dd]) => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(ww, hh, dd), wallMat);
      wall.position.set(x, y, z);
      wall.receiveShadow = true;
      wall.castShadow = false;
      storeGroup.add(wall);
    });

    const ceilingTex = textureKit.applyRepeat(
      textureKit.createCeilingTexture(),
      Math.max(1, w / 2),
      Math.max(1, d / 2)
    );
    const ceilingMat = createStandardMaterial(ceilingTex, { roughness: 0.95, metalness: 0 });
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(w, d), ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(w / 2, wallH - 0.04, d / 2);
    ceiling.receiveShadow = true;
    storeGroup.add(ceiling);

    if (showMonitoringViz) {
      const gridTex = textureKit.applyRepeat(
        textureKit.createCameraGridTexture(),
        Math.max(1, w / CAMERA_GRID_SPACING),
        Math.max(1, d / CAMERA_GRID_SPACING)
      );
      const gridMat = new THREE.MeshStandardMaterial({
        map: gridTex,
        transparent: true,
        opacity: hasMonitoring ? 0.88 : 0.45,
        roughness: 1,
        metalness: 0,
        side: THREE.DoubleSide
      });
      const cameraGridCeiling = new THREE.Mesh(new THREE.PlaneGeometry(w, d), gridMat);
      cameraGridCeiling.rotation.x = Math.PI / 2;
      cameraGridCeiling.position.set(w / 2, wallH - 0.06, d / 2);
      cameraGridCeiling.name = "camera-grid-ceiling";
      storeGroup.add(cameraGridCeiling);

      const cameraRigs = new THREE.Group();
      cameraRigs.name = "camera-grid-rigs";
      const mountY = ceilingCameraMountY();
      for (let x = CAMERA_GRID_SPACING / 2; x < w; x += CAMERA_GRID_SPACING) {
        for (let z = CAMERA_GRID_SPACING / 2; z < d; z += CAMERA_GRID_SPACING) {
          cameraRigs.add(
            createCameraRig(x, mountY, z, {
              accent: 0x06b6d4,
              fovAngle: 48,
              fovOpacity: hasMonitoring ? 0.06 : 0.03
            })
          );
        }
      }
      storeGroup.add(cameraRigs);
    }

    if (humanPlaced) {
      const next = clampToStore(humanGroup.position.x, humanGroup.position.z);
      humanGroup.position.set(next.x, 0, next.z);
    }
  }

  function addMonitoringOverlay(parent, spec, footprintW, footprintD, kind) {
    const overlayH = 0.04;
    const accent = hexToNumber(spec.color3d);
    const stroke = hexToNumber(spec.palette?.stroke || spec.color3d);
    const mat = makeMaterial(spec, kind);
    mat.emissive = new THREE.Color(accent);
    mat.emissiveIntensity = 0.35;
    mat.depthWrite = false;

    const slab = new THREE.Mesh(new THREE.BoxGeometry(footprintW, overlayH, footprintD), mat);
    slab.position.y = overlayH / 2 + 0.02;
    parent.add(slab);

    addLocalCoverageGrid(parent, footprintW, footprintD, stroke);

    const edgeMat = new THREE.MeshBasicMaterial({
      color: stroke,
      transparent: true,
      opacity: 0.85
    });
    const edgeT = 0.03;
    const edgeH = 0.12;
    [
      [0, edgeH / 2, -footprintD / 2, footprintW, edgeH, edgeT],
      [0, edgeH / 2, footprintD / 2, footprintW, edgeH, edgeT],
      [-footprintW / 2, edgeH / 2, 0, edgeT, edgeH, footprintD],
      [footprintW / 2, edgeH / 2, 0, edgeT, edgeH, footprintD]
    ].forEach(([x, y, z, w, h, dd]) => {
      const edge = new THREE.Mesh(new THREE.BoxGeometry(w, h, dd), edgeMat);
      edge.position.set(x, y + 0.02, z);
      parent.add(edge);
    });

    const fovAngle = kind === "monitor-entrance" ? 62 : kind === "monitor-shelf-zone" ? 44 : 56;
    const mountY = ceilingCameraMountY();
    const zoneCamera = createCameraRig(0, mountY, 0, {
      accent,
      fovAngle,
      fovOpacity: 0.14
    });
    parent.add(zoneCamera);

    if (kind === "monitor-entrance") {
      const postMat = new THREE.MeshStandardMaterial({
        color: accent,
        emissive: accent,
        emissiveIntensity: 0.5,
        roughness: 0.4
      });
      [-footprintW * 0.35, footprintW * 0.35].forEach((x) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.1, 8), postMat);
        post.position.set(x, 0.55, 0);
        parent.add(post);
      });
    }
  }

  function addFixtureMesh(group, obj, spec, footprintW, footprintD, height) {
    if (
      obj.kind.startsWith("shelf-") ||
      obj.kind === "produce-bin" ||
      obj.kind.startsWith("service-") ||
      obj.kind.startsWith("station-") ||
      obj.kind === "checkout" ||
      obj.kind === "entry-open" ||
      obj.kind === "entry-gated"
    ) {
      try {
        buildProceduralFixture(group, obj.kind, spec, footprintW, footprintD, height, fixtureTextureBridge());
      } catch (error) {
        console.warn("Procedural fixture build failed; using fallback box.", obj.kind, error);
        addBox(group, footprintW, height, footprintD, spec, obj.kind);
      }
      return;
    }

    const useGlb = modelLibrary.hasModel(obj.kind) && modelLibrary.isModelReady(obj.kind);
    if (useGlb) {
      const model = modelLibrary.createFixtureModelSync(obj.kind, {
        width: footprintW,
        depth: footprintD,
        height,
        spec
      });
      if (model) {
        group.add(model);
        return;
      }
    }

    addBox(group, footprintW, height, footprintD, spec, obj.kind);
  }

  function buildFixtureGroup(obj) {
    const spec = getArtifactSpec(obj.kind);
    const footprintW = obj.meters.w;
    const footprintD = obj.meters.h;
    const height = spec.heightMeters ?? 1.2;
    const group = new THREE.Group();
    group.userData.objectId = obj.id;
    group.userData.kind = obj.kind;
    group.position.set(obj.meters.x, 0, obj.meters.z);
    group.rotation.y = -THREE.MathUtils.degToRad(obj.angle || 0);

    if (obj.kind === "separator-wall") {
      const isVertical = Math.abs(obj.angle % 180) > 45 && Math.abs(obj.angle % 180) < 135;
      const ww = isVertical ? wallThickness() : footprintW;
      const dd = isVertical ? footprintD : wallThickness();
      const wallSpec = { ...spec, heightMeters: wallHeight(), color3d: "#e5e7eb", opacity3d: 0.95 };
      addBox(group, ww, wallHeight(), dd, wallSpec, obj.kind);
      return group;
    }

    if (spec.type === "wall-sign" || obj.kind.startsWith("sign-")) {
      buildWallSign(group, obj, spec, footprintW);
      return group;
    }

    if (obj.kind.startsWith("monitor-")) {
      addMonitoringOverlay(group, spec, footprintW, footprintD, obj.kind);
      return group;
    }

    addFixtureMesh(group, obj, spec, footprintW, footprintD, height);
    return group;
  }

  function clearFixtures() {
    transformControls.detach();
    selectedGroup = null;
    fixtureGroups.clear();
    while (fixturesGroup.children.length) {
      const child = fixturesGroup.children[0];
      fixturesGroup.remove(child);
      disposeObject(child);
    }
  }

  function populateFixtures(layout, preserveSelectionId) {
    const previousSelection = preserveSelectionId ?? null;
    (layout.objects || []).forEach((obj) => {
      try {
        const group = buildFixtureGroup(obj);
        fixturesGroup.add(group);
        if (obj.id) fixtureGroups.set(obj.id, group);
      } catch (error) {
        console.warn("Failed to build fixture group.", obj?.kind, error);
      }
    });

    refreshLayoutObstacles(layout);
    fixturesBuiltForToken = layoutSyncToken;

    if (previousSelection && fixtureGroups.has(previousSelection) && interactionMode === "edit") {
      selectFixture(fixtureGroups.get(previousSelection));
    }
  }

  function rebuildFixtures(layout, preserveSelectionId) {
    const selectionToPreserve = preserveSelectionId ?? selectedGroup?.userData?.objectId ?? null;
    clearFixtures();
    populateFixtures(layout, selectionToPreserve);
  }

  function fitCamera(force = false) {
    if (!lastLayout || interactionMode === "walk") return;
    const w = lastLayout.widthMeters;
    const d = lastLayout.heightMeters;
    const centerX = w / 2;
    const centerZ = d / 2;
    const span = Math.max(w, d);

    if (force || !fitCamera._initialized) {
      if (cameraViewMode === "isometric") {
        const dist = span * 0.92;
        camera.position.set(centerX + dist * 0.72, dist * 0.62, centerZ + dist * 0.72);
        orbit.target.set(centerX, 0.4, centerZ);
      } else {
        const aspect = Math.max(0.4, camera.aspect);
        const fovRad = THREE.MathUtils.degToRad(camera.fov);
        const distForHeight = (d * 0.55) / Math.tan(fovRad / 2);
        const distForWidth = (w * 0.55) / Math.tan(fovRad / 2) / aspect;
        const distance = Math.max(distForHeight, distForWidth, span * 0.75) * 1.22;
        camera.position.set(centerX + distance * 0.78, distance * 0.58, centerZ + distance * 0.78);
        orbit.target.set(centerX, 1, centerZ);
      }
      orbit.update();
      fitCamera._initialized = true;
    }
  }

  function zoomCamera(scale) {
    if (interactionMode === "walk" || !lastLayout) return;
    const offset = new THREE.Vector3().subVectors(camera.position, orbit.target);
    const distance = offset.length();
    if (distance <= 0) return;
    const next = clamp(distance * scale, orbit.minDistance, orbit.maxDistance);
    offset.setLength(next);
    camera.position.copy(orbit.target).add(offset);
    orbit.update();
  }

  function refreshFixturesIfReady() {
    if (!active || !lastLayout || !modelsLoaded) return;
    if (fixturesBuiltForToken === layoutSyncToken) return;
    rebuildFixtures(lastLayout, selectedGroup?.userData?.objectId || null);
  }

  function preloadFixtureModels() {
    return modelLibrary
      .preloadAll()
      .then(() => {
        modelsLoaded = true;
        refreshFixturesIfReady();
      })
      .catch(() => {
        modelsLoaded = true;
        refreshFixturesIfReady();
      });
  }

  function rebuildStore(layout, { refitCamera = false, preserveSelectionId = null } = {}) {
    layoutSyncToken += 1;
    lastLayout = layout;
    const selectionToPreserve = preserveSelectionId ?? selectedGroup?.userData?.objectId ?? null;
    clearFixtures();
    const signature = shellSignature(layout);
    if (signature !== lastShellSignature) {
      rebuildShell(layout);
      lastShellSignature = signature;
      updateFloorGrid(layout.widthMeters, layout.heightMeters);
    }
    populateFixtures(layout, selectionToPreserve);
    fitCamera(refitCamera);
  }

  function resizeToContainer() {
    const rawWidth = containerEl.clientWidth || containerEl.parentElement?.clientWidth || 0;
    const rawHeight = containerEl.clientHeight || containerEl.parentElement?.clientHeight || 0;
    if (!rawWidth || !rawHeight) {
      requestAnimationFrame(() => {
        if (active) resizeToContainer();
      });
      return;
    }
    const width = Math.max(320, rawWidth);
    const height = Math.max(320, rawHeight);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    fitCamera(false);
  }

  function pickFloorPoint(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObject(floorMesh, false);
    return hits[0]?.point || null;
  }

  transformControls.addEventListener("dragging-changed", (event) => {
    orbit.enabled = !event.value && interactionMode === "edit";
    if (selectedGroup && event.value) {
      selectedGroup.userData.dragAnchor = {
        x: selectedGroup.position.x,
        z: selectedGroup.position.z
      };
    }
  });

  transformControls.addEventListener("objectChange", () => {
    if (!selectedGroup) return;
    clampGroupPosition(selectedGroup);
    scheduleEmitTransform(selectedGroup);
  });

  transformControls.addEventListener("mouseUp", () => {
    flushActiveTransform();
  });

  renderer.domElement.addEventListener("pointerdown", (event) => {
    if (transformControls.dragging) return;

    if (interactionMode === "placeHuman") {
      const point = pickFloorPoint(event);
      if (point) {
        placeHumanAt(point.x, point.z);
        applyInteractionMode("edit");
      }
      return;
    }

    if (interactionMode !== "edit" || simulationMode) return;

    const rect = renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(fixturesGroup.children, true);
    if (hits.length) {
      selectFixture(findFixtureGroup(hits[0].object));
    } else if (event.target === renderer.domElement) {
      selectFixture(null);
    }
  });

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  const resizeObserver = new ResizeObserver(() => {
    if (!active) return;
    resizeToContainer();
  });
  resizeObserver.observe(containerEl);

  function animate() {
    if (!active) return;
    animationId = requestAnimationFrame(animate);
    const delta = clock.getDelta();
    updateWalk(delta);
    if (interactionMode !== "walk") orbit.update();
    renderer.render(scene, camera);
  }

  return {
    setConfig({ artifacts, planner } = {}) {
      if (artifacts) artifactConfig = mergeArtifactConfig(artifacts);
      if (planner) plannerConfig = structuredClone(planner);
      if (lastLayout && active) rebuildStore(lastLayout, { preserveSelectionId: selectedGroup?.userData?.objectId || null });
    },

    sync(layout, syncOptions = {}) {
      if (syncOptions.artifacts) artifactConfig = mergeArtifactConfig(syncOptions.artifacts);
      if (syncOptions.planner) plannerConfig = structuredClone(syncOptions.planner);
      if (!layout) return;
      lastLayout = layout;
      if (!active) return;
      rebuildStore(layout, {
        refitCamera: syncOptions.refitCamera ?? false,
        preserveSelectionId: syncOptions.preserveSelectionId ?? null
      });
    },

    cacheLayout(layout, syncOptions = {}) {
      if (syncOptions.artifacts) artifactConfig = mergeArtifactConfig(syncOptions.artifacts);
      if (syncOptions.planner) plannerConfig = structuredClone(syncOptions.planner);
      if (!layout) return;
      lastLayout = layout;
      if (!active) return;
      rebuildStore(layout, {
        refitCamera: syncOptions.refitCamera ?? false,
        preserveSelectionId: syncOptions.preserveSelectionId ?? (selectedGroup?.userData?.objectId || null)
      });
    },

    captureSnapshot() {
      renderer.render(scene, camera);
      return renderer.domElement.toDataURL("image/png");
    },

    resize(width, height) {
      if (width && height) {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
      } else {
        resizeToContainer();
      }
      fitCamera(false);
    },

    setTransformMode(mode) {
      if (interactionMode !== "edit") applyInteractionMode("edit");
      transformMode = mode === "rotate" ? "rotate" : "translate";
      transformControls.setMode(transformMode);
      if (transformMode === "translate") {
        transformControls.showX = true;
        transformControls.showY = false;
        transformControls.showZ = true;
      } else {
        transformControls.showX = false;
        transformControls.showY = true;
        transformControls.showZ = false;
      }
    },

    setInteractionMode(mode) {
      applyInteractionMode(mode);
    },

    getInteractionMode() {
      return interactionMode;
    },

    flushActiveTransform() {
      flushActiveTransform();
    },

    deleteSelectedFixture() {
      return deleteSelectedFixture();
    },

    fitCamera() {
      if (interactionMode === "walk") applyInteractionMode("edit");
      fitCamera(true);
    },

    zoomIn() {
      zoomCamera(0.82);
    },

    zoomOut() {
      zoomCamera(1.22);
    },

    setCameraView(mode) {
      cameraViewMode = mode === "perspective" ? "perspective" : "isometric";
      fitCamera(true);
    },

    getCameraView() {
      return cameraViewMode;
    },

    setShowMonitoringViz(show) {
      showMonitoringViz = show !== false;
      if (lastLayout && active) rebuildStore(lastLayout, { preserveSelectionId: selectedGroup?.userData?.objectId || null });
    },

    getShowMonitoringViz() {
      return showMonitoringViz;
    },

    setSimulationMode(on) {
      setSimulationMode(on);
    },

    getSimulationMode() {
      return simulationMode;
    },

    updateHeatmap(heatmap) {
      updateHeatmap(heatmap);
    },

    updateShoppers(positions) {
      updateShoppers(positions);
    },

    clearShoppers() {
      clearShoppers();
    },

    setActive(isActive) {
      active = isActive;
      if (active) {
        resizeToContainer();
        preloadFixtureModels();
        if (lastLayout) rebuildStore(lastLayout, { refitCamera: true });
        animate();
      } else {
        if (interactionMode === "walk") applyInteractionMode("edit");
        if (interactionMode === "placeHuman") applyInteractionMode("edit");
        selectFixture(null);
        if (animationId) {
          cancelAnimationFrame(animationId);
          animationId = null;
        }
      }
    },

    dispose() {
      this.setActive(false);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      resizeObserver.disconnect();
      disposePointerLock();
      transformControls.dispose();
      textureKit.dispose();
      disposeHeatmap();
      clearShoppers();
      shopperGeo.dispose();
      shopperMat.dispose();
      if (floorGridHelper) {
        scene.remove(floorGridHelper);
        floorGridHelper.geometry.dispose();
        const gridMaterials = Array.isArray(floorGridHelper.material)
          ? floorGridHelper.material
          : [floorGridHelper.material];
        gridMaterials.forEach((material) => material.dispose());
        floorGridHelper = null;
      }
      disposeObject(storeGroup);
      disposeObject(fixturesGroup);
      disposeObject(humanGroup);
      scene.environment = null;
      envTexture.dispose();
      pmremGenerator.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
  };
}
