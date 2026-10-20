import { describe, expect, it } from "vitest";
import { createInterpolationWorkspace, interpolateGrid, sampleBicubic } from "@/services/baropodometry/interpolation";

describe("Interpolação otimizada preserva a superfície anterior", () => {
  it("preserva a amostragem bicúbica inclusive bordas, picos e matriz assimétrica", () => {
    const grids = [Array(225).fill(0), Array(225).fill(4095), Array.from({ length: 225 }, (_, i) => (i * 7919) % 4096)];
    for (const [width, height] of [[1, 1], [31, 27], [15, 15]]) {
      for (const grid of grids) {
        const result = interpolateGrid(grid, width, height, 0);
        for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
          expect(result[y * width + x]).toBe(Math.fround(sampleBicubic(grid, x * 14 / Math.max(1, width - 1), y * 14 / Math.max(1, height - 1))));
        }
      }
    }
  });

  it("mantém o hash completo da superfície suavizada produzida pela versão 0.2.8", async () => {
    const grid = Array.from({ length: 225 }, (_, i) => (i * 7919) % 4096);
    const result = interpolateGrid(grid, 32, 27, 0.62);
    const bytes = new Uint8Array(result.byteLength);
    bytes.set(new Uint8Array(result.buffer));
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    const hash = Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, "0")).join("");
    expect(hash).toBe("ae561b2aa6262b5a573f40650520bfaa4ecb0066d7329b1e5f3a328a9c01bed5");
  });

  it("reutiliza os buffers sem deixar resíduos do quadro anterior", () => {
    const workspace = createInterpolationWorkspace(150, 150);
    const first = interpolateGrid(Array(225).fill(4095), 150, 150, 0.35, workspace);
    const next = interpolateGrid(Array(225).fill(0), 150, 150, 0.35, workspace);
    expect(next).toBe(first);
    expect(next.every(value => value === 0)).toBe(true);
    expect(() => interpolateGrid(Array(225).fill(0), 30, 30, 0.35, workspace)).toThrow("dimensões incompatíveis");
  });
});
