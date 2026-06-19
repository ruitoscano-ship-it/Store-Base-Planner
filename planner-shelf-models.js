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

export function buildProceduralGondola(group, { width, depth, height, levels, kind, productTexture = null }) {
  const frameMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.58, metalness: 0.06 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.45, roughness: 0.42 });
  const boardMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.68, metalness: 0.03 });
  const railMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.5, metalness: 0.35 });
  const productMat = productTexture
    ? new THREE.MeshStandardMaterial({
        map: productTexture,
        roughness: 0.72,
        metalness: 0.02
      })
    : null;

  const postW = 0.035;
  const kickH = 0.1;
  const backT = 0.025;

  [[-width / 2 + postW, -depth / 2 + postW], [width / 2 - postW, -depth / 2 + postW], [-width / 2 + postW, depth / 2 - postW], [width / 2 - postW, depth / 2 - postW]].forEach(
    ([x, z]) => {
      addMesh(group, new THREE.BoxGeometry(postW, height, postW), metalMat, x, height / 2, z);
    }
  );

  addMesh(group, new THREE.BoxGeometry(width * 0.96, height - kickH, backT), frameMat, 0, (height - kickH) / 2 + kickH, -depth / 2 + backT / 2);
  addMesh(group, new THREE.BoxGeometry(width * 0.98, kickH, depth * 0.98), metalMat, 0, kickH / 2, 0);
  addMesh(group, new THREE.BoxGeometry(width * 0.96, 0.04, depth * 0.92), frameMat, 0, 0.02, 0);

  const shelfCount = Math.max(1, levels || 4);
  const shelfFaceH = 0.28;
  for (let i = 1; i <= shelfCount; i += 1) {
    const y = kickH + ((height - kickH - 0.08) * i) / (shelfCount + 1);
    addMesh(group, new THREE.BoxGeometry(width * 0.92, 0.03, depth * 0.88), boardMat, 0, y, depth * 0.02);
    addMesh(group, new THREE.BoxGeometry(width * 0.92, 0.015, 0.015), railMat, 0, y + 0.025, depth / 2 - 0.03);

    if (productMat) {
      const face = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.88, shelfFaceH), productMat);
      face.position.set(0, y + shelfFaceH * 0.45, depth / 2 - 0.012);
      face.castShadow = false;
      face.receiveShadow = true;
      group.add(face);
    }
  }

  if (kind.includes("cold")) {
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xf0f9ff,
      transparent: true,
      opacity: 0.22,
      roughness: 0.06,
      metalness: 0.05,
      transmission: 0.35,
      thickness: 0.015
    });
    addMesh(group, new THREE.BoxGeometry(width * 0.94, height * 0.82, 0.015), glassMat, 0, height * 0.48, depth / 2 - 0.01, false);
  }

  if (kind.includes("hot")) {
    const warmMat = productMat || new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.65 });
    addMesh(group, new THREE.BoxGeometry(width * 0.9, 0.05, depth * 0.72), warmMat, 0, height * 0.72, 0);
  }
}

export function buildProceduralIslandGondola(group, { width, depth, height, levels, productTexture = null }) {
  const frameMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.58, metalness: 0.06 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.45, roughness: 0.42 });
  const boardMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.68, metalness: 0.03 });
  const endMat = new THREE.MeshStandardMaterial({ color: 0xe5e7eb, roughness: 0.62, metalness: 0.05 });
  const productMat = productTexture
    ? new THREE.MeshStandardMaterial({ map: productTexture, roughness: 0.72, metalness: 0.02 })
    : null;

  const postW = 0.04;
  const kickH = 0.1;
  [[-width / 2 + postW, -depth / 2 + postW], [width / 2 - postW, -depth / 2 + postW], [-width / 2 + postW, depth / 2 - postW], [width / 2 - postW, depth / 2 - postW]].forEach(
    ([x, z]) => addMesh(group, new THREE.BoxGeometry(postW, height, postW), metalMat, x, height / 2, z)
  );

  addMesh(group, new THREE.BoxGeometry(width * 0.98, kickH, depth * 0.98), metalMat, 0, kickH / 2, 0);
  addMesh(group, new THREE.BoxGeometry(width * 0.96, 0.04, depth * 0.92), frameMat, 0, 0.02, 0);
  addMesh(group, new THREE.BoxGeometry(0.04, height - kickH, depth * 0.88), endMat, -width / 2 + 0.02, (height - kickH) / 2 + kickH, 0);
  addMesh(group, new THREE.BoxGeometry(0.04, height - kickH, depth * 0.88), endMat, width / 2 - 0.02, (height - kickH) / 2 + kickH, 0);

  const shelfCount = Math.max(1, levels || 4);
  const shelfFaceH = 0.28;
  for (let i = 1; i <= shelfCount; i += 1) {
    const y = kickH + ((height - kickH - 0.08) * i) / (shelfCount + 1);
    addMesh(group, new THREE.BoxGeometry(width * 0.94, 0.03, depth * 0.86), boardMat, 0, y, 0);
    if (productMat) {
      const front = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.9, shelfFaceH), productMat);
      front.position.set(0, y + shelfFaceH * 0.45, depth / 2 - 0.012);
      front.castShadow = false;
      group.add(front);
      const back = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.9, shelfFaceH), productMat);
      back.rotation.y = Math.PI;
      back.position.set(0, y + shelfFaceH * 0.45, -depth / 2 + 0.012);
      back.castShadow = false;
      group.add(back);
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

export function buildProceduralEntry(group, kind, _spec, width, depth, height, { palette = "entry" } = {}) {
  const palettes = {
    entry: {
      post: 0xd1d5db,
      frame: 0xffffff,
      glass: 0xf8fafc,
      accent: 0x22c55e,
      rail: 0xd1d5db
    },
    checkout: {
      post: 0xd97706,
      frame: 0xfffbeb,
      glass: 0xfef3c7,
      accent: 0xf59e0b,
      rail: 0xb45309
    }
  };
  const colors = palettes[palette] || palettes.entry;
  const metalMat = new THREE.MeshStandardMaterial({ color: colors.post, metalness: 0.55, roughness: 0.38 });
  const frameMat = new THREE.MeshStandardMaterial({ color: colors.frame, roughness: 0.55, metalness: 0.08 });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: colors.glass,
    transparent: true,
    opacity: 0.35,
    roughness: 0.05,
    metalness: 0.04,
    transmission: 0.25
  });
  const accentMat = new THREE.MeshStandardMaterial({ color: colors.accent, roughness: 0.55 });
  const postW = 0.06;
  const gateH = height * 0.92;

  [[-width / 2 + postW, -depth / 2 + postW], [width / 2 - postW, -depth / 2 + postW]].forEach(([x, z]) => {
    addMesh(group, new THREE.BoxGeometry(postW, gateH, postW), metalMat, x, gateH / 2, z);
  });

  addMesh(group, new THREE.BoxGeometry(width * 0.88, 0.05, depth * 0.75), frameMat, 0, gateH * 0.55, 0);

  if (kind === "entry-gated" || palette === "checkout") {
    addMesh(group, new THREE.BoxGeometry(width * 0.72, 0.04, 0.04), metalMat, 0, gateH * 0.42, depth / 2 - 0.04);
    addMesh(group, new THREE.BoxGeometry(0.1, 0.1, 0.07), accentMat, -width / 2 + 0.18, gateH * 0.75, depth / 2);
    addMesh(group, new THREE.BoxGeometry(width * 0.15, gateH * 0.7, 0.02), glassMat, width / 2 - 0.12, gateH * 0.45, 0);
  } else {
    addMesh(group, new THREE.BoxGeometry(width * 0.78, gateH * 0.75, 0.02), glassMat, 0, gateH * 0.45, depth / 2 - 0.02);
    addMesh(group, new THREE.BoxGeometry(width * 0.9, 0.03, depth * 0.85), frameMat, 0, 0.015, 0);
  }
}

export function buildProceduralCheckout(group, spec, width, depth, height) {
  buildProceduralEntry(group, "entry-gated", spec, width, depth, height, { palette: "checkout" });
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
  }
}
