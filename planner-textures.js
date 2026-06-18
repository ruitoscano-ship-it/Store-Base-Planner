import * as THREE from "three";

/** Procedural store textures + monitoring grid patterns (no external assets). */
export class StoreTextureKit {
  constructor() {
    this.textures = [];
  }

  register(texture) {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = 4;
    this.textures.push(texture);
    return texture;
  }

  dispose() {
    this.textures.forEach((texture) => texture.dispose());
    this.textures = [];
  }

  createCanvasTexture(drawFn, size = 512) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    drawFn(ctx, size);
    return this.register(new THREE.CanvasTexture(canvas));
  }

  /** Light polished retail floor for 3D visualizer */
  createVisualizerFloorTexture() {
    return this.createCanvasTexture((ctx, size) => {
      ctx.fillStyle = "#ececec";
      ctx.fillRect(0, 0, size, size);
      const tiles = 12;
      const tile = size / tiles;
      for (let y = 0; y < tiles; y += 1) {
        for (let x = 0; x < tiles; x += 1) {
          const shade = (x + y) % 2 === 0 ? "#f3f3f3" : "#e8e8e8";
          ctx.fillStyle = shade;
          ctx.fillRect(x * tile + 0.5, y * tile + 0.5, tile - 1, tile - 1);
        }
      }
      ctx.globalAlpha = 0.04;
      for (let i = 0; i < 6000; i += 1) {
        ctx.fillStyle = i % 2 ? "#ffffff" : "#bdbdbd";
        ctx.fillRect(Math.random() * size, Math.random() * size, 1, 1);
      }
      ctx.globalAlpha = 1;
    });
  }

  /** Light glass-like store shell walls */
  createVisualizerWallTexture() {
    return this.createCanvasTexture((ctx, size) => {
      ctx.fillStyle = "#d8dce2";
      ctx.fillRect(0, 0, size, size);
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 2;
      ctx.strokeRect(8, 8, size - 16, size - 16);
      for (let i = 0; i < 3000; i += 1) {
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.08})`;
        ctx.fillRect(Math.random() * size, Math.random() * size, 1, 1);
      }
    });
  }

  /** Planogram-style product blocks for gondola shelf fronts */
  createProductFaceTexture(variant = "ambient") {
    const palettes = {
      ambient: ["#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7", "#ec4899", "#14b8a6", "#f97316"],
      cold: ["#38bdf8", "#0ea5e9", "#22d3ee", "#67e8f9", "#06b6d4", "#7dd3fc", "#0284c7", "#bae6fd"],
      hot: ["#fbbf24", "#f97316", "#ef4444", "#dc2626", "#fcd34d", "#fb923c", "#ea580c", "#fde68a"]
    };
    const colors = palettes[variant] || palettes.ambient;

    return this.createCanvasTexture((ctx, size) => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      const cols = 8;
      const rows = 5;
      const pad = 4;
      const cellW = (size - pad * 2) / cols;
      const cellH = (size - pad * 2) / rows;
      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          const color = colors[(row * cols + col) % colors.length];
          const x = pad + col * cellW + 1;
          const y = pad + row * cellH + 1;
          const w = cellW - 2;
          const h = cellH - 2;
          ctx.fillStyle = color;
          ctx.fillRect(x, y, w, h * 0.82);
          ctx.fillStyle = "rgba(255,255,255,0.35)";
          ctx.fillRect(x, y, w, h * 0.18);
          ctx.strokeStyle = "rgba(0,0,0,0.08)";
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
        }
      }
    }, 256);
  }

  /** Retail vinyl / polished concrete floor tiles */
  createFloorTexture() {
    return this.createVisualizerFloorTexture();
  }

  /** Light store shell walls for semi-transparent enclosure */
  createWallTexture() {
    return this.createVisualizerWallTexture();
  }

  /** Drop ceiling tiles ( acoustic panel look ) */
  createCeilingTexture() {
    return this.createCanvasTexture((ctx, size) => {
      const tiles = 6;
      const tile = size / tiles;
      ctx.fillStyle = "#f8faf8";
      ctx.fillRect(0, 0, size, size);
      for (let y = 0; y < tiles; y += 1) {
        for (let x = 0; x < tiles; x += 1) {
          ctx.fillStyle = "#eef1ee";
          ctx.fillRect(x * tile + 2, y * tile + 2, tile - 4, tile - 4);
          ctx.strokeStyle = "#cbd5c9";
          ctx.lineWidth = 1.5;
          ctx.strokeRect(x * tile + 1, y * tile + 1, tile - 2, tile - 2);
          ctx.fillStyle = "rgba(255,255,255,0.35)";
          ctx.fillRect(x * tile + 4, y * tile + 4, tile * 0.35, tile * 0.2);
        }
      }
    });
  }

  /**
   * Ceiling camera placement grid — intersection dots + meter lines.
   * Used to visualize typical overhead CV camera layout (~3 m spacing).
   */
  createCameraGridTexture(cellPx = 64) {
    return this.createCanvasTexture(
      (ctx, size) => {
        ctx.fillStyle = "rgba(248,250,248,0.92)";
        ctx.fillRect(0, 0, size, size);
        ctx.strokeStyle = "rgba(14,116,144,0.35)";
        ctx.lineWidth = 1;
        for (let p = 0; p <= size; p += cellPx) {
          ctx.beginPath();
          ctx.moveTo(p, 0);
          ctx.lineTo(p, size);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(0, p);
          ctx.lineTo(size, p);
          ctx.stroke();
        }
        for (let y = cellPx / 2; y < size; y += cellPx) {
          for (let x = cellPx / 2; x < size; x += cellPx) {
            ctx.fillStyle = "rgba(6,182,212,0.85)";
            ctx.beginPath();
            ctx.arc(x, y, cellPx * 0.11, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "rgba(8,51,68,0.6)";
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.fillStyle = "rgba(255,255,255,0.9)";
            ctx.beginPath();
            ctx.arc(x - cellPx * 0.03, y - cellPx * 0.03, cellPx * 0.035, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      },
      512
    );
  }

  /** Floor analytics cell grid for monitoring coverage (1 m cells) */
  createCoverageGridTexture() {
    return this.createCanvasTexture((ctx, size) => {
      const cells = 16;
      const cell = size / cells;
      ctx.clearRect(0, 0, size, size);
      for (let y = 0; y < cells; y += 1) {
        for (let x = 0; x < cells; x += 1) {
          ctx.fillStyle = (x + y) % 2 === 0 ? "rgba(56,189,248,0.06)" : "rgba(6,182,212,0.04)";
          ctx.fillRect(x * cell, y * cell, cell, cell);
        }
      }
      ctx.strokeStyle = "rgba(14,116,144,0.22)";
      ctx.lineWidth = 1;
      for (let p = 0; p <= size; p += cell) {
        ctx.beginPath();
        ctx.moveTo(p, 0);
        ctx.lineTo(p, size);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, p);
        ctx.lineTo(size, p);
        ctx.stroke();
      }
    });
  }

  applyRepeat(texture, repeatX, repeatY) {
    texture.repeat.set(repeatX, repeatY);
    return texture;
  }
}
