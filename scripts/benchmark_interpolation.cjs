// Compara a fonte anterior capturada antes da alteração com a implementação atual.
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const { performance } = require('node:perf_hooks');
const ts = require('typescript');
const crypto = require('node:crypto');
const baselineFile = process.argv[2];
const outputFile = process.argv[3];
if (!baselineFile) throw new Error('Informe o arquivo interpolation.ts da versão anterior.');
const currentFile = path.resolve(__dirname, '../src/services/baropodometry/interpolation.ts');
function load(file) {
  const source = fs.readFileSync(file, 'utf8');
  const mod = new Module(file);
  mod._compile(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021 } }).outputText, file);
  return mod.exports;
}
const before = load(path.resolve(baselineFile));
const after = load(currentFile);
const grid = Array.from({ length: 225 }, (_, i) => (i * 7919) % 4096);
function medianTime(render) {
  for (let i = 0; i < 3; i++) render();
  const times = [];
  for (let i = 0; i < 11; i++) { const start = performance.now(); render(); times.push(performance.now() - start); }
  return times.sort((a, b) => a - b)[Math.floor(times.length / 2)];
}
const rows = [150, 300, 450].map(resolution => {
  const workspace = after.createInterpolationWorkspace(resolution, resolution);
  let maxDifference = 0;
  for (const values of [grid, Array(225).fill(0), Array(225).fill(4095)]) for (const smoothing of [0, .35, 1]) {
    const expected = before.interpolateGrid(values, resolution, resolution, smoothing);
    const actual = after.interpolateGrid(values, resolution, resolution, smoothing, workspace);
    for (let i = 0; i < expected.length; i++) maxDifference = Math.max(maxDifference, Math.abs(expected[i] - actual[i]));
  }
  if (maxDifference !== 0) throw new Error(`Superfície mudou: ${resolution}: ${maxDifference}`);
  const beforeMs = medianTime(() => before.interpolateGrid(grid, resolution, resolution, .35));
  const afterMs = medianTime(() => after.interpolateGrid(grid, resolution, resolution, .35, workspace));
  return { resolution, beforeMs, afterMs, speedup: beforeMs / afterMs, maxDifference };
});
const report = {
  baselineSha256: crypto.createHash('sha256').update(fs.readFileSync(baselineFile)).digest('hex'),
  currentSha256: crypto.createHash('sha256').update(fs.readFileSync(currentFile)).digest('hex'),
  node: process.version, samples: 11, warmup: 3, rows,
  scope: 'Interpolação sintética em Node. Não mede o WebView2, navegação real nem o ESP32.',
};
const json = JSON.stringify(report, null, 2);
if (outputFile) fs.writeFileSync(outputFile, json + '\n', 'utf8');
console.log(json);
