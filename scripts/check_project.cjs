// Inventário somente leitura: inclui imports estáticos, dinâmicos, barrels e testes.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const config = ts.readConfigFile(path.join(root, 'tsconfig.json'), ts.sys.readFile).config;
const options = ts.parseJsonConfigFileContent(config, ts.sys, root).options;
const files = ts.sys.readDirectory(path.join(root, 'src'), ['.ts', '.tsx']).map(path.normalize);
const graph = new Map();
const packages = new Set();
for (const file of files) {
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  const targets = [];
  function visit(node) {
    let specifier;
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) specifier = node.moduleSpecifier;
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) specifier = node.arguments[0];
    if (specifier && ts.isStringLiteral(specifier)) {
      if (!specifier.text.startsWith('.') && !specifier.text.startsWith('@/')) packages.add(specifier.text.startsWith('@') ? specifier.text.split('/').slice(0, 2).join('/') : specifier.text.split('/')[0]);
      const resolved = ts.resolveModuleName(specifier.text, file, options, ts.sys).resolvedModule;
      if (resolved && !resolved.isExternalLibraryImport) targets.push(path.normalize(resolved.resolvedFileName));
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  graph.set(file, targets);
}
function reachable(roots) {
  const seen = new Set();
  function visit(file) { if (seen.has(file)) return; seen.add(file); (graph.get(file) || []).forEach(visit); }
  roots.forEach(visit);
  return seen;
}
const runtime = reachable([path.join(root, 'src', 'main.tsx')]);
const tests = reachable(files.filter(file => file.endsWith('.test.ts')));
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const report = {
  version: manifest.version,
  sourceFiles: files.length,
  runtimeFiles: runtime.size,
  unusedRuntimeFiles: files.filter(file => !file.endsWith('.test.ts') && !runtime.has(file)).map(file => ({ file: path.relative(root, file).replaceAll('\\', '/'), usedByTests: tests.has(file) })),
  dependencies: Object.keys(manifest.dependencies).map(name => ({ name, imported: packages.has(name) })),
  scope: 'Frontend TypeScript. Rust, migrations, assets, documentação e protótipos exigem revisão separada; nenhum arquivo é apagado automaticamente.',
};
const json = JSON.stringify(report, null, 2);
if (process.argv[2]) fs.writeFileSync(path.resolve(process.argv[2]), json + '\n', 'utf8');
console.log(json);
