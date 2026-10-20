const IN_COLS = 15;
const IN_ROWS = 15;

/**
 * Interpolação cúbica 1D (Catmull-Rom spline) entre 4 pontos com parâmetro t in [0, 1].
 */
function catmullRom1D(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;

  const a0 = -0.5 * p0 + 1.5 * p1 - 1.5 * p2 + 0.5 * p3;
  const a1 = p0 - 2.5 * p1 + 2.0 * p2 - 0.5 * p3;
  const a2 = -0.5 * p0 + 0.5 * p2;
  const a3 = p1;

  const val = a0 * t3 + a1 * t2 + a2 * t + a3;
  return Math.max(0, val);
}

/**
 * Obtém valor da grade 15x15 com clamp nos limites (0..14).
 */
function getGridSample(grid: number[], r: number, c: number): number {
  const cr = Math.min(IN_ROWS - 1, Math.max(0, r));
  const cc = Math.min(IN_COLS - 1, Math.max(0, c));
  return grid[cr * IN_COLS + cc] ?? 0;
}

/**
 * Amostra o valor bicúbico contínuo na posição de coordenadas de sensor (x, y) onde x, y in [0, 14].
 */
export function sampleBicubic(grid: number[], x: number, y: number): number {
  const x1 = Math.floor(x);
  const y1 = Math.floor(y);
  const tx = x - x1;
  const ty = y - y1;

  // Interpola 4 linhas na horizontal
  const colVal = new Array<number>(4);
  for (let dy = -1; dy <= 2; dy++) {
    const rowIdx = y1 + dy;
    const p0 = getGridSample(grid, rowIdx, x1 - 1);
    const p1 = getGridSample(grid, rowIdx, x1);
    const p2 = getGridSample(grid, rowIdx, x1 + 1);
    const p3 = getGridSample(grid, rowIdx, x1 + 2);
    colVal[dy + 1] = catmullRom1D(p0, p1, p2, p3, tx);
  }

  // Interpola o resultado na vertical
  return catmullRom1D(colVal[0], colVal[1], colVal[2], colVal[3], ty);
}

/**
 * Aplica filtro gaussiano separável 2D suave com intensidade configurável (0.0 a 1.0)
 * sobre a grade interpolada para produzir transição orgânica ou bordas mais definidas.
 *
 * @param smoothing Fator contínuo de suavização (0.0 = sem blur/nítido, 1.0 = máxima suavidade).
 */
function applyGaussianSmooth(
  src: Float32Array,
  w: number,
  h: number,
  smoothing = 0.35,
  temp: Float32Array = new Float32Array(w * h)
): Float32Array {
  if (smoothing <= 0) return src;

  // Suporte a compatibilidade caso receba número inteiro de passes (ex: 1)
  const factor = Math.min(1.0, Math.max(0.0, smoothing));
  const wn = factor * 0.25; // Peso dos vizinhos
  const wc = 1.0 - 2.0 * wn; // Peso central (soma dos pesos = 1.0)

  const current = src;

  // Pass horizontal
  for (let y = 0; y < h; y++) {
    const rowOffset = y * w;
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - 1);
      const x1 = x;
      const x2 = Math.min(w - 1, x + 1);
      const v =
        wn * current[rowOffset + x0] +
        wc * current[rowOffset + x1] +
        wn * current[rowOffset + x2];
      temp[rowOffset + x] = v;
    }
  }

  // Pass vertical
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const y0 = Math.max(0, y - 1);
      const y1 = y;
      const y2 = Math.min(h - 1, y + 1);
      const v =
        wn * temp[y0 * w + x] +
        wc * temp[y1 * w + x] +
        wn * temp[y2 * w + x];
      current[y * w + x] = v;
    }
  }

  return current;
}

/**
 * Transforma a matriz discreta 15x15 em uma superfície contínua de alta resolução (ex: 150x150, 300x300, 450x450).
 * Garante que não haja aparência de blocos ou grade, produzindo transições fluidas.
 */
export interface InterpolationWorkspace {
  width: number;
  height: number;
  horizontal: Float64Array;
  result: Float32Array;
  temp: Float32Array;
}

export function createInterpolationWorkspace(width: number, height: number): InterpolationWorkspace {
  return { width, height, horizontal: new Float64Array(IN_ROWS * width), result: new Float32Array(width * height), temp: new Float32Array(width * height) };
}

export function interpolateGrid(
  grid15x15: number[],
  outWidth: number,
  outHeight: number,
  smoothing = 0.35,
  workspace = createInterpolationWorkspace(outWidth, outHeight)
): Float32Array {
  if (workspace.width !== outWidth || workspace.height !== outHeight) throw new Error("Buffer de interpolação com dimensões incompatíveis.");
  const { result, horizontal, temp } = workspace;

  // Mapeia cada pixel de saída (0..outWidth-1) para o espaço de coordenadas dos sensores (0..14)
  const stepX = (IN_COLS - 1) / Math.max(1, outWidth - 1);
  const stepY = (IN_ROWS - 1) / Math.max(1, outHeight - 1);

  // Catmull-Rom é separável. Cada linha original é interpolada só uma vez;
  // Float64 mantém a precisão/clamp da amostragem anterior antes da vertical.
  for (let row = 0; row < IN_ROWS; row++) {
    for (let px = 0; px < outWidth; px++) {
      const gridX = px * stepX;
      const x1 = Math.floor(gridX);
      horizontal[row * outWidth + px] = catmullRom1D(
        getGridSample(grid15x15, row, x1 - 1), getGridSample(grid15x15, row, x1),
        getGridSample(grid15x15, row, x1 + 1), getGridSample(grid15x15, row, x1 + 2), gridX - x1,
      );
    }
  }

  for (let py = 0; py < outHeight; py++) {
    const gridY = py * stepY;
    const y1 = Math.floor(gridY);
    const ty = gridY - y1;
    const r0 = Math.max(0, y1 - 1) * outWidth;
    const r1 = y1 * outWidth;
    const r2 = Math.min(IN_ROWS - 1, y1 + 1) * outWidth;
    const r3 = Math.min(IN_ROWS - 1, y1 + 2) * outWidth;
    const rowOffset = py * outWidth;

    for (let px = 0; px < outWidth; px++) {
      result[rowOffset + px] = catmullRom1D(horizontal[r0 + px], horizontal[r1 + px], horizontal[r2 + px], horizontal[r3 + px], ty);
    }
  }

  if (smoothing > 0) {
    return applyGaussianSmooth(result, outWidth, outHeight, smoothing, temp);
  }

  return result;
}
