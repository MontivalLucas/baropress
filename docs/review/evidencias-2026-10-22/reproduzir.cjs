const fs = require('node:fs'), path = require('node:path'), Module = require('node:module'), { performance: perf } = require('node:perf_hooks');
const root = path.resolve(process.argv[2] || process.cwd()), req = Module.createRequire(path.join(root, 'package.json')), ts = req('typescript');
function load(file, stubs = {}) { const name = path.join(root, file), m = new Module(name); m.filename = name; m.paths = Module._nodeModulePaths(path.dirname(name)); m.require = n => n in stubs ? stubs[n] : req(n); m._compile(ts.transpileModule(fs.readFileSync(name, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React, esModuleInterop: true } }).outputText, name); return m.exports; }
const lib = load('src/services/baropodometry/interpolation.ts'), grid = Array.from({ length: 225 }, (_, i) => i * 7919 % 4096);
const timing = [150, 300, 450].map(res => { const w = lib.createInterpolationWorkspace(res, res); for (let i = 0; i < 3; i++)
    lib.interpolateGrid(grid, res, res, .35, w); const t = []; for (let i = 0; i < 11; i++) {
    const start = perf.now();
    lib.interpolateGrid(grid, res, res, .35, w);
    t.push(perf.now() - start);
} t.sort((a, b) => a - b); return { resolution: res, medianMs: t[5], minMs: t[0], maxMs: t[10] }; });
let hook = 0, state = [], effects = [], time = 100, draws = [];
const ctx = new Proxy({ createImageData: () => ({}), drawImage: () => { } }, { get: (o, k) => k in o ? o[k] : () => { } });
const canvas = { width: 520, height: 520, getContext: () => ctx };
const react = { createElement: () => null, useRef: (value) => { const i = hook++; return state[i] ?? (state[i] = { current: i === 0 ? canvas : value }); }, useMemo: (cb) => { const i = hook++; return state[i] ?? (state[i] = cb()); }, useEffect: cb => effects.push(cb) };
global.document = { createElement: () => canvas };
Object.defineProperty(global, 'performance', { value: { now: () => time }, configurable: true });
const { BaropodometricHeatmap } = load('src/features/baropodometry/BaropodometricHeatmap.tsx', { 'react': react, 'clsx': () => '', '@/services/baropodometry/trajectory': { drawTrajectory: () => { } }, '@/services/baropodometry': { createInterpolationWorkspace: () => ({}), interpolateGrid: values => { draws.push(values[0]); return []; }, renderInterpolatedToImageData: () => { }, copToCanvas: () => ({ x: 0, y: 0 }) } });
const config = { resolution: 150, renderFps: 30, gamma: 1.3, vmax: 2200, threshold: 150, smoothing: .35, showCop: false };
function render(value) { hook = 0; effects = []; BaropodometricHeatmap({ values: Array(225).fill(value), config, cop: null }); effects.forEach(cb => cb()); }
render(100);
time = 110;
render(900);
time = 1000;
const rows = Array.from({ length: 8 }, (_, ordinal) => [{ type: 'integer', value: 1 }, { type: 'integer', value: ordinal }, { type: 'text', value: JSON.stringify(Array.from({ length: ordinal === 7 ? 30 : 60 }, (_, i) => ({ values: Array(225).fill(2048), sequence: ordinal * 60 + i, receivedMs: (ordinal * 60 + i) * 100 }))) }]);
const bytesPerExam = Buffer.byteLength(JSON.stringify({ name: 'exam_raw_chunks', columns: ['exam_id', 'ordinal', 'frames_json'], rows }, null, 2));
console.log(JSON.stringify({ interpolation: timing, heatmap: { inputValues: [100, 900], timesMs: [100, 110], observedUntilMs: time, drawnValues: draws, latestValueLost: draws.at(-1) !== 900 }, backup: { rawFramesPerExam: 450, rawChunkBytesPerExam: bytesPerExam, limitBytes: 64 * 1024 * 1024, examsToExceedLimit: Math.floor(64 * 1024 * 1024 / bytesPerExam) + 1 } }, null, 2));
