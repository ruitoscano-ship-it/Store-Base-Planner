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

  /** Retail vinyl / polished concrete floor tiles */
  createFloorTexture() {
    return this.createCanvasTexture((ctx, size) => {
      const tiles = 8;
      const tile = size / tiles;
      for (let y = 0; y < tiles; y += 1) {
        for (let x = 0; x < tiles; x += 1) {
          const base = (x + y) % 2 === 0 ? "#f0efeb" : "#e4e3df";
          ctx.fillStyle = base;
          ctx.fillRect(x * tile + 1, y * tile + 1, tile - 2, tile - 2);
          ctx.strokeStyle = "#d4d3cf";
          ctx.lineWidth = 1;
          ctx.strokeRect(x * tile + 0.5, y * tile + 0.5, tile - 1, tile - 1);
        }
      }
      ctx.globalAlpha = 0.06;
      for (let i = 0; i < 8000; i += 1) {
        ctx.fillStyle = i % 2 ? "#ffffff" : "#000000";
        ctx.fillRect(Math.random() * size, Math.random() * size, 1, 1);
      }
      ctx.globalAlpha = 1;
    });
  }

  /** Dark painted retail wall — contrasts with light floor for depth */
  createWallTexture() {
    return this.createCanvasTexture((ctx, size) => {
      ctx.fillStyle = "#111111";
      ctx.fillRect(0, 0, size, size);
      for (let y = 0; y < size; y += 6) {
        ctx.fillStyle = y % 12 === 0 ? "rgba(255,255,255,0.012)" : "rgba(0,0,0,0.04)";
        ctx.fillRect(0, y, size, 3);
      }
      for (let i = 0; i < 5000; i += 1) {
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.015})`;
        ctx.fillRect(Math.random() * size, Math.random() * size, 1, 1);
      }
    });
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
