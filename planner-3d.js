import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TransformControls } from "three/addons/controls/TransformControls.js";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { DEFAULT_ARTIFACTS, DEFAULT_PLANNER } from "./planner-artifacts.js";

const EYE_HEIGHT = 1.62;
const WALK_SPEED = 3.8;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function disposeObject(object) {
  object.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) child.material.forEach((material) => material.dispose());
      else child.material.dispose();
    }
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
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.85 });
  const accentMat = new THREE.MeshStandardMaterial({ color: 0xd9f04f, roughness: 0.7 });

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 14), bodyMat);
  head.position.y = 1.62;
  head.castShadow = true;
  group.add(head);

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.52, 10), bodyMat);
  torso.position.y = 1.24;
  torso.castShadow = true;
  group.add(torso);

  const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.1, 0.12), bodyMat);
  pelvis.position.y = 0.93;
  group.add(pelvis);

  const limb = (x, y, z, length, angleZ) => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, length, 8), bodyMat);
    mesh.position.set(x, y, z);
    mesh.rotation.z = angleZ;
    mesh.castShadow = true;
    group.add(mesh);
  };

  limb(-0.24, 1.28, 0, 0.42, 0.95);
  limb(0.24, 1.28, 0, 0.42, -0.95);
  limb(-0.08, 0.58, 0, 0.62, 0.08);
  limb(0.08, 0.58, 0, 0.62, -0.08);

  const marker = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.015, 24), accentMat);
  marker.position.y = 0.008;
  marker.receiveShadow = true;
  group.add(marker);

  return group;
}

export function createPlanner3D(containerEl, options = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe9eae6);

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

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 600);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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

  scene.add(new THREE.AmbientLight(0xffffff, 0.74));
  const sun = new THREE.DirectionalLight(0xffffff, 0.88);
  sun.position.set(14, 24, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  scene.add(sun);
  scene.add(new THREE.DirectionalLight(0xd9e57a, 0.22).translateX(-10).translateY(8).translateZ(-8));

  const clock = new THREE.Clock();
  let animationId = null;
  let active = false;
  let lastLayout = null;
  let selectedGroup = null;
  let transformMode = "translate";
  let fixtureGroups = new Map();
  let storeSize = { w: 20, d: 20 };
  let floorMesh = null;
  let artifactConfig = structuredClone(options.artifacts || DEFAULT_ARTIFACTS);
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
    const next = clampToStore(group.position.x, group.position.z);
    group.position.x = next.x;
    group.position.z = next.z;
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
    const next = clampToStore(x, z);
    humanGroup.position.set(next.x, 0, next.z);
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
      transformControls.enabled = true;
      humanGroup.visible = humanPlaced;
      renderer.domElement.style.cursor = "";
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

    const speed = WALK_SPEED * delta;
    if (moveState.forward) pointerLockControls.moveForward(speed);
    if (moveState.backward) pointerLockControls.moveForward(-speed);
    if (moveState.left) pointerLockControls.moveRight(-speed);
    if (moveState.right) pointerLockControls.moveRight(speed);

    const next = clampToStore(camera.position.x, camera.position.z);
    camera.position.x = next.x;
    camera.position.z = next.z;
    camera.position.y = EYE_HEIGHT;
  }

  function onKeyDown(event) {
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

  function rebuildShell(layout) {
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

    floorMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, d),
      new THREE.MeshStandardMaterial({ color: 0xf3f4f0, roughness: 0.95 })
    );
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(w / 2, 0, d / 2);
    floorMesh.receiveShadow = true;
    floorMesh.userData.isStoreFloor = true;
    storeGroup.add(floorMesh);

    const wallMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    [
      [w / 2, wallH / 2, -wallT / 2, w, wallH, wallT],
      [w / 2, wallH / 2, d + wallT / 2, w, wallH, wallT],
      [-wallT / 2, wallH / 2, d / 2, wallT, wallH, d],
      [w + wallT / 2, wallH / 2, d / 2, wallT, wallH, d]
    ].forEach(([x, y, z, ww, hh, dd]) => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(ww, hh, dd), wallMat);
      wall.position.set(x, y, z);
      wall.receiveShadow = true;
      storeGroup.add(wall);
    });

    const grid = new THREE.GridHelper(Math.max(w, d), Math.max(w, d), 0x6b7280, 0xd1d5db);
    grid.position.set(w / 2, 0.015, d / 2);
    storeGroup.add(grid);

    if (humanPlaced) {
      const next = clampToStore(humanGroup.position.x, humanGroup.position.z);
      humanGroup.position.set(next.x, 0, next.z);
    }
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
      const wallSpec = { ...spec, heightMeters: wallHeight() };
      addBox(group, ww, wallHeight(), dd, wallSpec, obj.kind);
      return group;
    }

    if (obj.kind.startsWith("shelf-")) {
      addBox(group, footprintW, height, footprintD, spec, obj.kind);
      const levels = clamp(Math.round(spec.shelfLevels || 0), 0, 12);
      for (let i = 1; i <= levels; i += 1) {
        const shelf = new THREE.Mesh(
          new THREE.BoxGeometry(footprintW * 0.96, 0.04, footprintD * 0.96),
          new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 })
        );
        shelf.position.y = (height * i) / (levels + 1);
        group.add(shelf);
      }
      return group;
    }

    addBox(group, footprintW, height, footprintD, spec, obj.kind);
    return group;
  }

  function rebuildFixtures(layout, preserveSelectionId) {
    const previousSelection = preserveSelectionId || selectedGroup?.userData?.objectId || null;
    transformControls.detach();
    selectedGroup = null;
    fixtureGroups.clear();

    while (fixturesGroup.children.length) {
      const child = fixturesGroup.children[0];
      fixturesGroup.remove(child);
      disposeObject(child);
    }

    layout.objects.forEach((obj) => {
      const group = buildFixtureGroup(obj);
      fixturesGroup.add(group);
      if (obj.id) fixtureGroups.set(obj.id, group);
    });

    if (previousSelection && fixtureGroups.has(previousSelection) && interactionMode === "edit") {
      selectFixture(fixtureGroups.get(previousSelection));
    }
  }

  function fitCamera(force = false) {
    if (!lastLayout || interactionMode === "walk") return;
    const w = lastLayout.widthMeters;
    const d = lastLayout.heightMeters;
    const centerX = w / 2;
    const centerZ = d / 2;
    const aspect = Math.max(0.4, camera.aspect);
    const fovRad = THREE.MathUtils.degToRad(camera.fov);
    const distForHeight = (d * 0.55) / Math.tan(fovRad / 2);
    const distForWidth = (w * 0.55) / Math.tan(fovRad / 2) / aspect;
    const distance = Math.max(distForHeight, distForWidth, Math.max(w, d) * 0.75) * 1.22;

    if (force || !fitCamera._initialized) {
      camera.position.set(centerX + distance * 0.78, distance * 0.58, centerZ + distance * 0.78);
      orbit.target.set(centerX, 1, centerZ);
      orbit.update();
      fitCamera._initialized = true;
    }
  }

  function rebuildStore(layout, { refitCamera = false, preserveSelectionId = null } = {}) {
    lastLayout = layout;
    rebuildShell(layout);
    rebuildFixtures(layout, preserveSelectionId);
    fitCamera(refitCamera);
  }

  function resizeToContainer() {
    const width = Math.max(320, containerEl.clientWidth);
    const height = Math.max(320, containerEl.clientHeight);
    if (!width || !height) return;
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
  });

  transformControls.addEventListener("objectChange", () => {
    if (!selectedGroup) return;
    clampGroupPosition(selectedGroup);
  });

  transformControls.addEventListener("mouseUp", () => {
    if (selectedGroup) emitTransform(selectedGroup);
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

    if (interactionMode !== "edit") return;

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
      rebuildStore(layout, {
        refitCamera: syncOptions.refitCamera ?? false,
        preserveSelectionId: syncOptions.preserveSelectionId ?? null
      });
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

    fitCamera() {
      if (interactionMode === "walk") applyInteractionMode("edit");
      fitCamera(true);
    },

    setActive(isActive) {
      active = isActive;
      if (active) {
        resizeToContainer();
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
      disposeObject(storeGroup);
      disposeObject(fixturesGroup);
      disposeObject(humanGroup);
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
  };
}
