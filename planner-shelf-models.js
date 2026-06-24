import * as THREE from "three";

function addMesh(group, geometry, material, x, y, z, castShadow = true) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function productVariant(kind) {
  if (kind.includes("cold")) return "cold";
  if (kind.includes("hot")) return "hot";
  return "ambient";
}

function createShelfMaterials(kind) {
  const frame = new THREE.MeshStandardMaterial({ color: 0xf6f6f4, roughness: 0.62, metalness: 0.05 });
  const back = new THREE.MeshStandardMaterial({ color: 0xe4e4e2, roughness: 0.72, metalness: 0.02 });
  const metal = new THREE.MeshStandardMaterial({ color: 0xb4b8be, metalness: 0.58, roughness: 0.36 });
  const shelf = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.54, metalness: 0.04 });
  const kick = new THREE.MeshStandardMaterial({ color: 0xd8d8d6, roughness: 0.68, metalness: 0.08 });
  const header = new THREE.MeshStandardMaterial({ color: 0xefefed, roughness: 0.6, metalness: 0.03 });
  const endCap = new THREE.MeshStandardMaterial({ color: 0xececea, roughness: 0.64, metalness: 0.04 });

  if (kind.includes("cold")) {
    frame.color.set(0xf0f7ff);
    back.color.set(0xdbeafe);
    kick.color.set(0xc7d9f5);
  } else if (kind.includes("hot")) {
    frame.color.set(0xfff8f0);
    back.color.set(0xffedd5);
    kick.color.set(0xfed7aa);
  }

  return { frame, back, metal, shelf, kick, header, endCap };
}

function addShelfProducts(group, {
  centerX,
  shelfY,
  shelfZ,
  shelfW,
  shelfD,
  variant,
  seed = 0,
  slanted = false
}) {
  const palette = {
    ambient: [0xef4444, 0xf59e0b, 0x22c55e, 0x3b82f6, 0xa855f7, 0xec4899],
    cold: [0x38bdf8, 0x0ea5e9, 0x22d3ee, 0x67e8f9, 0x06b6d4, 0x7dd3fc],
    hot: [0xfbbf24, 0xf97316, 0xef4444, 0xdc2626, 0xfcd34d, 0xfb923c]
  };
  const colors = palette[variant] || palette.ambient;
  const count = Math.max(3, Math.min(4, Math.floor(shelfW / 0.24)));
  const spacing = shelfW / (count + 1);

  for (let i = 0; i < count; i += 1) {
    const x = centerX - shelfW / 2 + spacing * (i + 1);
    const color = colors[(seed + i) % colors.length];
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.68, metalness: 0.04 });

    const isCylinder = (seed + i) % 3 === 0;

    if (isCylinder) {
      const radius = spacing * 0.16;
      const h = 0.1 + ((seed + i) % 4) * 0.02;
      const cyl = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, h, 10), mat);
      cyl.position.set(x, shelfY + h / 2 + 0.02, shelfZ);
      if (slanted) cyl.rotation.x = -0.28;
      cyl.castShadow = true;
      group.add(cyl);
    } else {
      const bw = spacing * 0.5;
      const bh = 0.1 + ((seed + i) % 3) * 0.025;
      const bd = Math.min(shelfD * 0.55, spacing * 0.42);
      const box = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), mat);
      box.position.set(x, shelfY + bh / 2 + 0.02, shelfZ);
      if (slanted) box.rotation.x = -0.28;
      box.castShadow = true;
      group.add(box);
    }
  }
}

/** Wall gondola — single-sided gondola with back panel, uprights, tiered shelves, and planogram blocks. */
export function buildProceduralGondola(group, { width, depth, height, levels, kind, productTexture = null }) {
  const mats = createShelfMaterials(kind);
  const variant = productVariant(kind);
  const postW = 0.03;
  const kickH = 0.12;
  const backT = 0.022;
  const headerH = 0.08;
  const backZ = -depth / 2 + backT / 2;
  const shelfCount = Math.max(1, levels || 4);

  const postHeight = height - headerH;
  [[-width / 2 + postW, backZ + postW * 0.5], [width / 2 - postW, backZ + postW * 0.5]].forEach(([x, z]) => {
    addMesh(group, new THREE.BoxGeometry(postW, postHeight, postW), mats.metal, x, postHeight / 2, z);
  });

  addMesh(group, new THREE.BoxGeometry(width * 0.98, postHeight - kickH, backT), mats.back, 0, kickH + (postHeight - kickH) / 2, backZ);
  addMesh(group, new THREE.BoxGeometry(width * 0.98, kickH, depth * 0.96), mats.kick, 0, kickH / 2, 0);
  addMesh(group, new THREE.BoxGeometry(width * 0.96, headerH, depth * 0.9), mats.header, 0, height - headerH / 2, depth * 0.02);

  for (let i = 0; i <= shelfCount; i += 1) {
    const t = i / (shelfCount + 0.65);
    const y = kickH + (height - kickH - headerH - 0.06) * t;
    const shelfDepth = Math.max(0.12, i === 0 ? depth * 0.88 : depth * Math.max(0.42, 0.78 - i * 0.04));
    const shelfZ = backZ + backT / 2 + shelfDepth / 2;
    const shelfW = width * 0.94;

    addMesh(group, new THREE.BoxGeometry(shelfW, 0.028, shelfDepth), mats.shelf, 0, y, shelfZ);
    addMesh(group, new THREE.BoxGeometry(shelfW * 0.98, 0.012, 0.012), mats.metal, 0, y + 0.022, shelfZ + shelfDepth / 2 - 0.01);

    if (i > 0) {
      addShelfProducts(group, {
        centerX: 0,
        shelfY: y,
        shelfZ: shelfZ + shelfDepth * 0.08,
        shelfW: shelfW * 0.9,
        shelfD: shelfDepth,
        variant,
        seed: i * 7 + shelfCount,
        slanted: kind.includes("hot") && i === shelfCount
      });
    }
  }

  if (kind.includes("cold")) {
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0xf0f9ff,
      transparent: true,
      opacity: 0.28,
      roughness: 0.08,
      metalness: 0.04
    });
    addMesh(group, new THREE.BoxGeometry(width * 0.94, height * 0.78, 0.012), glassMat, 0, height * 0.46, depth / 2 - 0.008, false);
    [-width * 0.38, width * 0.38].forEach((x) => {
      addMesh(group, new THREE.BoxGeometry(0.018, height * 0.76, 0.018), mats.metal, x, height * 0.46, depth / 2 - 0.004);
    });
  }

  if (kind.includes("hot")) {
    const warmGlow = new THREE.MeshStandardMaterial({ color: 0xfef3c7, emissive: 0xfbbf24, emissiveIntensity: 0.12, roughness: 0.55 });
    addMesh(group, new THREE.BoxGeometry(width * 0.9, 0.04, depth * 0.7), warmGlow, 0, height * 0.74, depth * 0.06);
  }
}

/** Island gondola — double-sided spine, end caps, mirrored shelf tiers and products. */
export function buildProceduralIslandGondola(group, { width, depth, height, levels, productTexture = null }) {
  const mats = createShelfMaterials("shelf-island");
  const postW = 0.035;
  const kickH = 0.12;
  const headerH = 0.08;
  const spineW = 0.05;
  const endT = 0.035;
  const shelfCount = Math.max(1, levels || 4);

  [[-width / 2 + postW, -depth / 2 + postW], [width / 2 - postW, -depth / 2 + postW], [-width / 2 + postW, depth / 2 - postW], [width / 2 - postW, depth / 2 - postW]].forEach(
    ([x, z]) => {
      addMesh(group, new THREE.BoxGeometry(postW, height - headerH, postW), mats.metal, x, (height - headerH) / 2, z);
    }
  );

  addMesh(group, new THREE.BoxGeometry(width * 0.98, kickH, depth * 0.98), mats.kick, 0, kickH / 2, 0);
  addMesh(group, new THREE.BoxGeometry(width * 0.96, headerH, depth * 0.92), mats.header, 0, height - headerH / 2, 0);
  addMesh(group, new THREE.BoxGeometry(spineW, height - kickH - headerH, depth * 0.9), mats.back, 0, kickH + (height - kickH - headerH) / 2, 0);
  addMesh(group, new THREE.BoxGeometry(endT, height - kickH - headerH, depth * 0.88), mats.endCap, -width / 2 + endT / 2, kickH + (height - kickH - headerH) / 2, 0);
  addMesh(group, new THREE.BoxGeometry(endT, height - kickH - headerH, depth * 0.88), mats.endCap, width / 2 - endT / 2, kickH + (height - kickH - headerH) / 2, 0);

  const halfDepth = depth * 0.42;
  for (let i = 0; i <= shelfCount; i += 1) {
    const t = i / (shelfCount + 0.65);
    const y = kickH + (height - kickH - headerH - 0.06) * t;
    const shelfW = width * 0.94;
    const boardDepth = i === 0 ? halfDepth * 1.08 : halfDepth;

    addMesh(group, new THREE.BoxGeometry(shelfW, 0.028, boardDepth), mats.shelf, 0, y, halfDepth / 2 + spineW / 2);
    addMesh(group, new THREE.BoxGeometry(shelfW, 0.028, boardDepth), mats.shelf, 0, y, -halfDepth / 2 - spineW / 2);

    if (i > 0) {
      addShelfProducts(group, {
        centerX: 0,
        shelfY: y,
        shelfZ: halfDepth * 0.55,
        shelfW: shelfW * 0.88,
        shelfD: boardDepth,
        variant: "ambient",
        seed: i * 5
      });
      addShelfProducts(group, {
        centerX: 0,
        shelfY: y,
        shelfZ: -halfDepth * 0.55,
        shelfW: shelfW * 0.88,
        shelfD: boardDepth,
        variant: "ambient",
        seed: i * 5 + 3
      });
    }
  }
}

export function buildProceduralShelf(group, kind, spec, footprintW, footprintD, height, textures = null) {
  const levels = spec?.shelfLevels ?? 4;
  const variant = productVariant(kind);
  const productTexture = textures?.getProductFace?.(variant) || null;
  if (kind === "shelf-island") {
    buildProceduralIslandGondola(group, { width: footprintW, depth: footprintD, height, levels, productTexture });
    return;
  }
  buildProceduralGondola(group, {
    width: footprintW,
    depth: footprintD,
    height,
    levels,
    kind,
    productTexture
  });
}

function createEquipmentMaterials(variant = "entry") {
  const dark = new THREE.MeshStandardMaterial({ color: 0x404040, roughness: 0.62, metalness: 0.14 });
  const light = new THREE.MeshStandardMaterial({ color: 0xf2f2f0, roughness: 0.66, metalness: 0.05 });
  const metal = new THREE.MeshStandardMaterial({ color: 0xb4b8be, metalness: 0.58, roughness: 0.34 });
  const panel = new THREE.MeshStandardMaterial({ color: 0xe8e8e6, roughness: 0.58, metalness: 0.06 });
  const screen = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.28, metalness: 0.1 });
  const glass = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    transparent: true,
    opacity: 0.32,
    roughness: 0.08,
    metalness: 0.04
  });
  const accent =
    variant === "checkout"
      ? new THREE.MeshStandardMaterial({ color: 0x525252, roughness: 0.55, metalness: 0.16 })
      : new THREE.MeshStandardMaterial({ color: 0x3d3d3d, roughness: 0.55, metalness: 0.12 });
  return { dark, light, metal, panel, screen, glass, accent };
}

/** Slim turnstile / EAS gate pair with swing arm — matches barrier reference sheet. */
function buildProceduralTurnstileGate(group, width, depth, height) {
  const mats = createEquipmentMaterials("entry");
  const gateH = height * 0.94;
  const pillarW = Math.max(0.08, width * 0.09);
  const pillarD = Math.max(0.1, depth * 0.88);
  const panelT = Math.max(0.018, depth * 0.22);

  addMesh(group, new THREE.BoxGeometry(width * 0.98, 0.035, depth * 0.96), mats.metal, 0, 0.018, 0);

  [-1, 1].forEach((side) => {
    const x = side * (width / 2 - pillarW / 2 - 0.02);
    addMesh(group, new THREE.BoxGeometry(pillarW, gateH * 0.92, pillarD), mats.dark, x, gateH * 0.46, 0);
    addMesh(group, new THREE.BoxGeometry(pillarW * 0.72, gateH * 0.88, panelT), mats.panel, x - side * pillarW * 0.08, gateH * 0.46, depth * 0.22);
    addMesh(group, new THREE.BoxGeometry(pillarW * 0.55, gateH * 0.12, pillarW * 0.55), mats.light, x, gateH * 0.92, 0);
  });

  const armLen = width * 0.34;
  const armY = gateH * 0.42;
  addMesh(group, new THREE.BoxGeometry(armLen, 0.035, 0.035), mats.metal, -width * 0.12, armY, depth * 0.08);
  addMesh(group, new THREE.BoxGeometry(0.05, 0.05, 0.05), mats.accent, -width * 0.12 + armLen / 2, armY, depth * 0.08);
}

/** Automatic sliding door pair for open entrances. */
function buildProceduralSlidingDoors(group, width, depth, height) {
  const mats = createEquipmentMaterials("entry");
  const doorH = height * 0.92;
  const doorT = Math.max(0.02, depth * 0.35);
  const leafW = width * 0.42;

  addMesh(group, new THREE.BoxGeometry(width * 0.98, 0.03, depth * 0.92), mats.metal, 0, 0.015, 0);

  [-1, 1].forEach((side) => {
    const x = side * (width * 0.22);
    addMesh(group, new THREE.BoxGeometry(leafW, doorH, doorT), mats.glass, x, doorH / 2, 0);
    addMesh(group, new THREE.BoxGeometry(0.025, doorH * 0.92, 0.025), mats.dark, x + side * leafW * 0.38, doorH * 0.5, doorT * 0.55);
  });

  addMesh(group, new THREE.BoxGeometry(width * 0.96, height * 0.06, depth * 0.75), mats.light, 0, doorH + height * 0.03, 0);
}

/** Self-checkout kiosk — pedestal, vertical screen, scanner pole. */
function buildProceduralSelfCheckout(group, width, depth, height) {
  const mats = createEquipmentMaterials("checkout");
  const baseH = Math.min(height * 0.42, 0.95);
  const baseD = Math.max(depth * 0.92, 0.14);
  const baseW = width * 0.62;

  addMesh(group, new THREE.BoxGeometry(baseW, baseH, baseD), mats.dark, 0, baseH / 2, 0);
  addMesh(group, new THREE.BoxGeometry(baseW * 0.96, 0.04, baseD * 0.94), mats.light, 0, baseH + 0.02, 0);

  const screenW = Math.min(width * 0.34, 0.62);
  const screenH = height * 0.78;
  addMesh(group, new THREE.BoxGeometry(screenW, screenH, 0.035), mats.screen, 0, baseH + screenH / 2, -baseD / 2 + 0.02);
  addMesh(group, new THREE.BoxGeometry(screenW * 0.88, screenH * 0.82, 0.008), mats.glass, 0, baseH + screenH / 2, -baseD / 2 + 0.055, false);

  const poleX = width * 0.22;
  addMesh(group, new THREE.BoxGeometry(0.028, height * 0.52, 0.028), mats.metal, poleX, baseH + height * 0.26, baseD * 0.15);
  addMesh(group, new THREE.BoxGeometry(0.16, 0.1, 0.12), mats.light, poleX, baseH + height * 0.52, baseD * 0.15);
  addMesh(group, new THREE.BoxGeometry(0.08, 0.04, 0.06), mats.accent, poleX, baseH + height * 0.58, baseD * 0.15);

  const payX = -width * 0.24;
  addMesh(group, new THREE.BoxGeometry(0.022, height * 0.38, 0.022), mats.metal, payX, baseH + height * 0.2, baseD * 0.12);
  addMesh(group, new THREE.BoxGeometry(0.11, 0.14, 0.05), mats.panel, payX, baseH + height * 0.4, baseD * 0.12);
}

export function buildProceduralEntry(group, kind, _spec, width, depth, height) {
  if (kind === "entry-open") {
    buildProceduralSlidingDoors(group, width, depth, height);
    return;
  }
  buildProceduralTurnstileGate(group, width, depth, height);
}

export function buildProceduralCheckout(group, spec, width, depth, height) {
  buildProceduralSelfCheckout(group, width, depth, height);
}

export function buildProceduralFixture(group, kind, spec, footprintW, footprintD, height, textures = null) {
  if (kind.startsWith("shelf-")) {
    buildProceduralShelf(group, kind, spec, footprintW, footprintD, height, textures);
    return;
  }
  if (kind === "entry-open" || kind === "entry-gated") {
    buildProceduralEntry(group, kind, spec, footprintW, footprintD, height);
    return;
  }
  if (kind === "checkout") {
    buildProceduralCheckout(group, spec, footprintW, footprintD, height);
    return;
  }
}
