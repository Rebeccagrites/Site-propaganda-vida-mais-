import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const publicRoot = join(root, 'public');
const port = Number(process.env.PORT || 3000);
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

async function existingFile(path) {
  try {
    const info = await stat(path);
    return info.isFile() ? path : null;
  } catch {
    return null;
  }
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const requested = decodeURIComponent(url.pathname);
    const rootCandidate = normalize(join(root, requested === '/' ? '/index.html' : requested));
    const publicCandidate = normalize(join(publicRoot, requested === '/' ? '/index.html' : requested));
    const candidates = [rootCandidate, publicCandidate];
    if (!rootCandidate.startsWith(root) || !publicCandidate.startsWith(publicRoot)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    let filePath = null;
    for (const candidate of candidates) {
      filePath = await existingFile(candidate);
      if (filePath) break;
    }
    if (!filePath) filePath = join(root, 'index.html');
    const body = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': mime[extname(filePath)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(body);
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`Server error: ${error.message}`);
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Vida+ preview listening on http://0.0.0.0:${port}`);
});

