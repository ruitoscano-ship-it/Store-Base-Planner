import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TransformControls } from "three/addons/controls/TransformControls.js";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
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

function createStickFigure() {
  const group = new THREE.Group();
  group.name = "stick-figure";
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.82, metalness: 0.04 });
  const shadowMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, transparent: true, opacity: 0.35, roughness: 1 });

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), bodyMat);
  head.position.y = 1.62;
  head.castShadow = true;
  group.add(head);

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.05, 0.5, 10), bodyMat);
  torso.position.y = 1.24;
  torso.castShadow = true;
  group.add(torso);

  const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.11), bodyMat);
  pelvis.position.y = 0.93;
  group.add(pelvis);

  const limb = (x, y, z, length, angleZ) => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, length, 8), bodyMat);
    mesh.position.set(x, y, z);
    mesh.rotation.z = angleZ;
    mesh.castShadow = true;
    group.add(mesh);
  };

  limb(-0.22, 1.28, 0, 0.4, 0.95);
  limb(0.22, 1.28, 0, 0.4, -0.95);
  limb(-0.08, 0.58, 0, 0.6, 0.08);
  limb(0.08, 0.58, 0, 0.6, -0.08);

  const marker = new THREE.Mesh(new THREE.CircleGeometry(0.16, 24), shadowMat);
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
  const shopperGeo = new THREE.CapsuleGeometry(0.09, 0.36, 4, 8);
  const shopperMat = new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.78, metalness: 0.04 });
  const shopperMesh = new THREE.InstancedMesh(shopperGeo, shopperMat, SHOPPER_MAX);
  shopperMesh.count = 0;
  shopperMesh.castShadow = true;
  shopperMesh.visible = false;
  shoppersGroup.add(shopperMesh);
  const shopperDummy = new THREE.Object3D();

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 600);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.domElement.style.display = "block";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  containerEl.appendChild(renderer.domElement);

  const orbit = new OrbitControls(camera, renderer.domElement);
  orbit.enableDamping = true;
  orbit.dampingFactor = 0.07;
  orbit.maxPolarAngle = Math.PI / 2.02;
  orbit.minDistance = 2;
  orbit.maxDistance = 180;

  const transformControls = new TransformControls(camera, renderer.domElement);
  transformControls.setSpace("world");
  scene.add(transformControls);

  scene.add(new THREE.AmbientLight(0xffffff, 0.58));
  scene.add(new THREE.HemisphereLight(0xffffff, 0xe5e7eb, 0.42));
  const sun = new THREE.DirectionalLight(0xffffff, 0.72);
  sun.position.set(10, 22, 14);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 120;
  sun.shadow.camera.left = -40;
  sun.shadow.camera.right = 40;
  sun.shadow.camera.top = 40;
  sun.shadow.camera.bottom = -40;
  sun.shadow.bias = -0.00015;
  scene.add(sun);
  scene.add(new THREE.DirectionalLight(0xffffff, 0.18).translateX(-8).translateY(10).translateZ(-6));

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
  let artifactConfig = structuredClone(options.artifacts || getAllArtifacts());
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
    return artifactConfig[kind] || {
      label: "Fixture",
      widthMeters: 1,
      depthMeters: 1,
      heightMeters: 1.2,
      shelfLevels: 0,
      color3d: "#94a3b8"
    };
  }

  function wallHeight() {
    return plannerConfig.wallHeightMeters ?? DEFAULT_PLANNER.wallHeightMeters;
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
      shopperDummy.position.set(p.x, 0.68, p.z);
      shopperDummy.rotation.y = p.angle || 0;
      shopperDummy.updateMatrix();
      shopperMesh.setMatrixAt(i, shopperDummy.matrix);
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
    const floorMat = createStandardMaterial(floorTex);

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
    if (obj.kind.startsWith("shelf-") || obj.kind === "checkout" || obj.kind === "entry-open" || obj.kind === "entry-gated") {
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
    const previousSelection = preserveSelectionId || null;
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
    clearFixtures();
    populateFixtures(layout, preserveSelectionId);
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
    clearFixtures();
    const signature = shellSignature(layout);
    if (signature !== lastShellSignature) {
      rebuildShell(layout);
      lastShellSignature = signature;
      updateFloorGrid(layout.widthMeters, layout.heightMeters);
    }
    populateFixtures(layout, preserveSelectionId);
    fitCamera(refitCamera);
  }

  function resizeToContainer() {
    const width = Math.max(320, containerEl.clientWidth || containerEl.parentElement?.clientWidth || 0);
    const height = Math.max(320, containerEl.clientHeight || containerEl.parentElement?.clientHeight || 0);
    if (!width || !height) {
      requestAnimationFrame(() => {
        if (active) resizeToContainer();
      });
      return;
    }
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
      if (artifacts) artifactConfig = structuredClone(artifacts);
      if (planner) plannerConfig = structuredClone(planner);
      if (lastLayout && active) rebuildStore(lastLayout, { preserveSelectionId: selectedGroup?.userData?.objectId || null });
    },

    sync(layout, syncOptions = {}) {
      if (syncOptions.artifacts) artifactConfig = structuredClone(syncOptions.artifacts);
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
      if (syncOptions.artifacts) artifactConfig = structuredClone(syncOptions.artifacts);
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
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
  };
}
