// Optional local static preview. No API routes or access to the parent project.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const files = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/assets/favicon.svg', ['assets/favicon.svg', 'image/svg+xml']],
  ['/assets/pressure-map.svg', ['assets/pressure-map.svg', 'image/svg+xml']],
]);
const port = 4178;
const server = createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }
  const path = new URL(req.url, 'http://127.0.0.1').pathname;
  const entry = files.get(path);
  if (!entry) { res.writeHead(404).end('Not found'); return; }
  try {
    const data = await readFile(fileURLToPath(new URL(entry[0], import.meta.url)));
    res.writeHead(200, { 'Content-Type': entry[1], 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' });
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch {
    res.writeHead(500).end('Unable to read local preview file');
  }
});
server.on('error', error => {
  console.error(error.code === 'EADDRINUSE' ? 'A porta 4178 esta ocupada. Abra index.html diretamente ou encerre a previa anterior.' : error.message);
  process.exitCode = 1;
});
server.listen(port, '127.0.0.1', () => console.log(`Baropress Liquid Glass: http://127.0.0.1:${port}\nSomente arquivos estaticos desta pasta. Ctrl+C para encerrar.`));
