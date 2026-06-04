import * as THREE from "three";

function hexToNumber(hex, fallback = 0x94a3b8) {
  if (!hex || typeof hex !== "string") return fallback;
  const parsed = Number.parseInt(hex.replace("#", ""), 16);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function addMesh(group, geometry, material, x, y, z, castShadow = true) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

export function buildProceduralGondola(group, { width, depth, height, levels, spec, kind }) {
  const frameColor = hexToNumber(spec?.color3d, kind.includes("cold") ? 0x38bdf8 : kind.includes("hot") ? 0xfb923c : 0xd9e57a);
  const badgeColor = hexToNumber(spec?.badge3d || spec?.color3d, frameColor);
  const emissiveColor = hexToNumber(spec?.emissive3d || spec?.color3d, frameColor);
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x6b7280, metalness: 0.55, roughness: 0.38 });
  const frameMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(frameColor),
    emissive: new THREE.Color(emissiveColor),
    emissiveIntensity: kind.includes("cold") ? 0.18 : kind.includes("hot") ? 0.14 : 0.06,
    roughness: 0.72,
    metalness: kind.includes("cold") ? 0.2 : 0.08
  });
  const badgeMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(badgeColor),
    emissive: new THREE.Color(emissiveColor),
    emissiveIntensity: 0.15,
    roughness: 0.5,
    metalness: 0.08
  });
  const boardMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.62, metalness: 0.04 });
  const railMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.55, metalness: 0.35 });
  const postW = 0.04;
  const kickH = 0.12;
  const backT = 0.03;

  [[-width / 2 + postW, -depth / 2 + postW], [width / 2 - postW, -depth / 2 + postW], [-width / 2 + postW, depth / 2 - postW], [width / 2 - postW, depth / 2 - postW]].forEach(
    ([x, z]) => {
      addMesh(group, new THREE.BoxGeometry(postW, height, postW), metalMat, x, height / 2, z);
    }
  );

  addMesh(group, new THREE.BoxGeometry(width * 0.96, height - kickH, backT), frameMat, 0, (height - kickH) / 2 + kickH, -depth / 2 + backT / 2);
  addMesh(group, new THREE.BoxGeometry(width * 0.98, kickH, depth * 0.98), metalMat, 0, kickH / 2, 0);
  addMesh(group, new THREE.BoxGeometry(width * 0.96, 0.05, depth * 0.92), badgeMat, 0, 0.025, 0);

  const shelfCount = Math.max(1, levels || 4);
  for (let i = 1; i <= shelfCount; i += 1) {
    const y = kickH + ((height - kickH - 0.08) * i) / (shelfCount + 1);
    addMesh(group, new THREE.BoxGeometry(width * 0.92, 0.035, depth * 0.88), boardMat, 0, y, depth * 0.02);
    addMesh(group, new THREE.BoxGeometry(width * 0.92, 0.02, 0.02), railMat, 0, y + 0.03, depth / 2 - 0.04);
  }

  if (kind.includes("cold")) {
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xc7e8ff,
      transparent: true,
      opacity: 0.35,
      roughness: 0.08,
      metalness: 0.1,
      transmission: 0.45,
      thickness: 0.02
    });
    addMesh(group, new THREE.BoxGeometry(width * 0.94, height * 0.82, 0.02), glassMat, 0, height * 0.48, depth / 2 - 0.02, false);
    const light = new THREE.PointLight(0x7dd3fc, 0.35, 2.5);
    light.position.set(0, height * 0.55, 0);
    group.add(light);
  }

  if (kind.includes("hot")) {
    const glowMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xea580c, emissiveIntensity: 0.35, roughness: 0.5 });
    addMesh(group, new THREE.BoxGeometry(width * 0.9, 0.06, depth * 0.75), glowMat, 0, height * 0.72, 0);
    addMesh(group, new THREE.BoxGeometry(width * 0.88, 0.04, depth * 0.7), boardMat, 0, height * 0.45, 0);
  }
}

export function buildProceduralShelf(group, kind, spec, footprintW, footprintD, height) {
  const levels = spec?.shelfLevels ?? 4;
  buildProceduralGondola(group, {
    width: footprintW,
    depth: footprintD,
    height,
    levels,
    spec,
    kind
  });
}

export function buildProceduralEntry(group, kind, spec, width, depth, height) {
  const accent = hexToNumber(spec?.color3d, kind === "entry-gated" ? 0xf472b6 : 0xa78bfa);
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x6b7280, metalness: 0.6, roughness: 0.35 });
  const frameMat = new THREE.MeshStandardMaterial({ color: accent, roughness: 0.55, metalness: 0.12 });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xdbeafe,
    transparent: true,
    opacity: 0.45,
    roughness: 0.06,
    metalness: 0.05,
    transmission: 0.35
  });
  const postW = 0.07;
  const gateH = height * 0.92;

  [[-width / 2 + postW, -depth / 2 + postW], [width / 2 - postW, -depth / 2 + postW]].forEach(([x, z]) => {
    addMesh(group, new THREE.BoxGeometry(postW, gateH, postW), metalMat, x, gateH / 2, z);
  });

  addMesh(group, new THREE.BoxGeometry(width * 0.88, 0.06, depth * 0.75), frameMat, 0, gateH * 0.55, 0);

  if (kind === "entry-gated") {
    addMesh(group, new THREE.BoxGeometry(width * 0.72, 0.05, 0.05), metalMat, 0, gateH * 0.42, depth / 2 - 0.04);
    addMesh(group, new THREE.BoxGeometry(0.12, 0.12, 0.08), new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x16a34a, emissiveIntensity: 0.4 }), -width / 2 + 0.18, gateH * 0.75, depth / 2);
    addMesh(group, new THREE.BoxGeometry(width * 0.15, gateH * 0.7, 0.03), glassMat, width / 2 - 0.12, gateH * 0.45, 0);
  } else {
    addMesh(group, new THREE.BoxGeometry(width * 0.78, gateH * 0.75, 0.03), glassMat, 0, gateH * 0.45, depth / 2 - 0.02);
    addMesh(group, new THREE.BoxGeometry(width * 0.9, 0.04, depth * 0.85), new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.85 }), 0, 0.02, 0);
  }
}

export function buildProceduralCheckout(group, spec, width, depth, height) {
  const accent = hexToNumber(spec?.color3d, 0xfbbf24);
  const counterMat = new THREE.MeshStandardMaterial({ color: 0xe5e7eb, roughness: 0.55, metalness: 0.08 });
  const frontMat = new THREE.MeshStandardMaterial({ color: accent, roughness: 0.48, metalness: 0.1 });
  const screenMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.35, metalness: 0.2 });
  const beltMat = new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.7, metalness: 0.15 });

  addMesh(group, new THREE.BoxGeometry(width * 0.92, height * 0.72, depth * 0.88), counterMat, 0, height * 0.36, 0);
  addMesh(group, new THREE.BoxGeometry(width * 0.94, height * 0.08, depth * 0.9), frontMat, 0, height * 0.08, 0);
  addMesh(group, new THREE.BoxGeometry(width * 0.22, height * 0.38, 0.06), screenMat, -width * 0.22, height * 0.78, depth * 0.2);
  addMesh(group, new THREE.BoxGeometry(width * 0.18, height * 0.12, 0.08), screenMat, width * 0.18, height * 0.62, depth * 0.18);
  addMesh(group, new THREE.BoxGeometry(width * 0.55, 0.04, depth * 0.35), beltMat, width * 0.08, height * 0.76, -depth * 0.18);
  addMesh(group, new THREE.BoxGeometry(width * 0.14, height * 0.55, depth * 0.14), metalMatCheckout(), width * 0.32, height * 0.42, depth * 0.28);
}

function metalMatCheckout() {
  return new THREE.MeshStandardMaterial({ color: 0x9ca3af, metalness: 0.65, roughness: 0.32 });
}

export function buildProceduralFixture(group, kind, spec, footprintW, footprintD, height) {
  if (kind.startsWith("shelf-")) {
    buildProceduralShelf(group, kind, spec, footprintW, footprintD, height);
    return;
  }
  if (kind === "entry-open" || kind === "entry-gated") {
    buildProceduralEntry(group, kind, spec, footprintW, footprintD, height);
    return;
  }
  if (kind === "checkout") {
    buildProceduralCheckout(group, spec, footprintW, footprintD, height);
  }
}
