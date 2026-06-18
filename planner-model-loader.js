import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

/** Kenney Mini Market (CC0) — https://kenney.nl/assets/mini-market */
export const FIXTURE_MODELS = {
  "shelf-ambient": { url: "/models/kenney/shelf-boxes.glb" },
  "shelf-cold": { url: "/models/kenney/freezers-standing.glb" },
  "shelf-hot": { url: "/models/kenney/display-bread.glb" },
  checkout: { url: "/models/kenney/cash-register.glb", rotateY: Math.PI / 2 },
  "entry-gated": { url: "/models/kenney/fence-door-rotate.glb" },
  "entry-open": { url: "/models/kenney/wall-door-rotate.glb" }
};

export const FIXTURE_MODEL_URLS = Object.fromEntries(
  Object.entries(FIXTURE_MODELS).map(([kind, config]) => [kind, config.url])
);

function parseColor(hex, fallback = "#ffffff") {
  return new THREE.Color(hex || fallback);
}

function setMeshMaterials(mesh, mapper) {
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  const next = materials.map(mapper);
  mesh.material = next.length === 1 ? next[0] : next;
}

function applyShelfTypeVisuals(modelRoot, kind, _spec) {
  if (!kind.startsWith("shelf-")) return;

  modelRoot.traverse((child) => {
    if (!child.isMesh || !child.material) return;
    setMeshMaterials(child, (material) => {
      const mat = material.clone();
      if (mat.map) {
        mat.map = material.map;
        mat.map.colorSpace = THREE.SRGBColorSpace;
        mat.color.set(0xffffff);
      } else {
        mat.color.set(0xffffff);
      }
      mat.emissive.set(0x000000);
      mat.emissiveIntensity = 0;
      mat.metalness = Math.min(mat.metalness ?? 0, 0.12);
      mat.roughness = Math.max(mat.roughness ?? 0.5, 0.48);
      mat.needsUpdate = true;
      return mat;
    });
  });
}

function addShelfTypeMarkers(_parent, _kind, _spec, _width, _depth, _height) {
  // Visualizer mode uses neutral fixtures without type badges.
}

export class PlannerModelLibrary {
  constructor() {
    this.loader = new GLTFLoader();
    this.templates = new Map();
    this.pending = new Map();
  }

  async preloadAll() {
    const urls = [...new Set(Object.values(FIXTURE_MODELS).map((config) => config.url))];
    await Promise.allSettled(urls.map((url) => this.loadTemplate(url)));
  }

  async loadTemplate(url) {
    if (this.templates.has(url)) return this.templates.get(url);
    if (this.pending.has(url)) return this.pending.get(url);

    const promise = new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (gltf) => {
          const root = gltf.scene;
          root.updateMatrixWorld(true);
          const box = new THREE.Box3().setFromObject(root);
          const size = new THREE.Vector3();
          box.getSize(size);
          root.position.x -= (box.min.x + box.max.x) / 2;
          root.position.y -= box.min.y;
          root.position.z -= (box.min.z + box.max.z) / 2;
          root.updateMatrixWorld(true);

          root.traverse((child) => {
            if (!child.isMesh || !child.material) return;
            child.castShadow = true;
            child.receiveShadow = true;
            setMeshMaterials(child, (material) => {
              const mat = material.clone();
              if (mat.map) {
                mat.map = material.map;
                mat.map.colorSpace = THREE.SRGBColorSpace;
              }
              return mat;
            });
          });

          const template = {
            root,
            size: { x: Math.max(size.x, 0.01), y: Math.max(size.y, 0.01), z: Math.max(size.z, 0.01) }
          };
          this.templates.set(url, template);
          this.pending.delete(url);
          resolve(template);
        },
        undefined,
        (error) => {
          this.pending.delete(url);
          reject(error);
        }
      );
    });

    this.pending.set(url, promise);
    return promise;
  }

  createFixtureModelSync(kind, { width, depth, height, spec = null } = {}) {
    const config = FIXTURE_MODELS[kind];
    if (!config) return null;
    const template = this.templates.get(config.url);
    if (!template) return null;

    const wrapper = new THREE.Group();
    const model = template.root.clone(true);
    model.scale.set(width / template.size.x, height / template.size.y, depth / template.size.z);
    if (config.rotateY) model.rotation.y = config.rotateY;
    applyShelfTypeVisuals(model, kind, spec);
    wrapper.add(model);
    addShelfTypeMarkers(wrapper, kind, spec, width, depth, height);
    return wrapper;
  }

  async createFixtureModel(kind, dimensions) {
    const config = FIXTURE_MODELS[kind];
    if (!config) return null;
    try {
      await this.loadTemplate(config.url);
      return this.createFixtureModelSync(kind, dimensions);
    } catch (_error) {
      return null;
    }
  }

  hasModel(kind) {
    return Boolean(FIXTURE_MODELS[kind]);
  }

  isModelReady(kind) {
    const config = FIXTURE_MODELS[kind];
    return config ? this.templates.has(config.url) : false;
  }
}
