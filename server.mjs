import { createHash, randomUUID } from 'node:crypto';
import { createReadStream, existsSync, promises as fs } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, 'public');
const mockStorePath = path.join(__dirname, '.dead-drops.json');
const port = Number(process.env.PORT || 3000);

const synapsePrivateKey = process.env.SYNAPSE_PRIVATE_KEY;
const forceMock = process.env.DEAD_DROP_MODE === 'mock';
const shouldUseSynapse = Boolean(synapsePrivateKey) && !forceMock;

let synapseClientPromise;

const mimeTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.svg', 'image/svg+xml'],
]);

function json(res, statusCode, body) {
  res.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 128 * 1024) {
        reject(new Error('Request body is too large.'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

async function loadMockStore() {
  if (!existsSync(mockStorePath)) return {};
  return JSON.parse(await fs.readFile(mockStorePath, 'utf8'));
}

async function saveMockStore(store) {
  await fs.writeFile(mockStorePath, JSON.stringify(store, null, 2));
}

function makeMockPieceCid(payload) {
  const digest = createHash('sha256').update(payload).digest('hex');
  return `mock-piece-${digest.slice(0, 20)}`;
}

async function getSynapseClient() {
  if (!synapseClientPromise) {
    synapseClientPromise = import('@filoz/synapse-sdk').then(({ Synapse }) =>
      Synapse.create({ privateKey: synapsePrivateKey })
    );
  }
  return synapseClientPromise;
}

function normalizeDeadDrop(input) {
  const title = String(input.title || '').trim().slice(0, 80);
  const clue = String(input.clue || '').trim().slice(0, 1200);
  const revealRule = String(input.revealRule || '').trim().slice(0, 160);
  if (!title) throw new Error('Give this dead drop a title.');
  if (clue.length < 12) throw new Error('The clue needs at least 12 characters.');
  return {
    id: randomUUID(),
    app: 'Filecoin Dead Drop',
    title,
    clue,
    revealRule: revealRule || 'Paste the PieceCID back into the reveal panel.',
    sealedAt: new Date().toISOString(),
  };
}

async function sealDrop(body) {
  const drop = normalizeDeadDrop(body);
  const payload = JSON.stringify(drop, null, 2);
  const bytes = new TextEncoder().encode(payload.padEnd(128, ' '));

  if (shouldUseSynapse) {
    const synapse = await getSynapseClient();
    const result = await synapse.storage.upload(bytes);
    return {
      mode: 'synapse',
      pieceCid: String(result.pieceCid),
      complete: Boolean(result.complete),
      copies: Array.isArray(result.copies) ? result.copies.length : 0,
      failedAttempts: Array.isArray(result.failedAttempts) ? result.failedAttempts.length : 0,
      sealedAt: drop.sealedAt,
      title: drop.title,
    };
  }

  const pieceCid = makeMockPieceCid(payload);
  const store = await loadMockStore();
  store[pieceCid] = payload;
  await saveMockStore(store);
  return {
    mode: 'mock',
    pieceCid,
    complete: true,
    copies: 2,
    failedAttempts: 0,
    sealedAt: drop.sealedAt,
    title: drop.title,
  };
}

async function revealDrop(body) {
  const pieceCid = String(body.pieceCid || '').trim();
  if (!pieceCid) throw new Error('Paste a PieceCID to reveal a dead drop.');

  if (shouldUseSynapse && !pieceCid.startsWith('mock-piece-')) {
    const synapse = await getSynapseClient();
    const downloadedData = await synapse.storage.download({ pieceCid });
    const decodedText = new TextDecoder().decode(downloadedData).trim();
    return { mode: 'synapse', pieceCid, drop: JSON.parse(decodedText) };
  }

  const store = await loadMockStore();
  if (!store[pieceCid]) throw new Error('No local mock dead drop found for that PieceCID.');
  return { mode: 'mock', pieceCid, drop: JSON.parse(store[pieceCid]) };
}

async function handleApi(req, res) {
  try {
    const raw = await readBody(req);
    const body = raw ? JSON.parse(raw) : {};
    if (req.url === '/api/seal' && req.method === 'POST') {
      json(res, 200, await sealDrop(body));
      return;
    }
    if (req.url === '/api/reveal' && req.method === 'POST') {
      json(res, 200, await revealDrop(body));
      return;
    }
    if (req.url === '/api/status' && req.method === 'GET') {
      json(res, 200, {
        mode: shouldUseSynapse ? 'synapse' : 'mock',
        synapseReady: shouldUseSynapse,
        message: shouldUseSynapse
          ? 'Synapse SDK mode is active.'
          : 'Mock mode is active. Set SYNAPSE_PRIVATE_KEY to use Synapse SDK.',
      });
      return;
    }
    json(res, 404, { error: 'Unknown API route.' });
  } catch (error) {
    json(res, 400, { error: error.message || 'Something went wrong.' });
  }
}

async function serveStatic(req, res) {
  const url = new URL(req.url, `http://localhost:${port}`);
  const safePath = path.normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(publicDir, safePath === '/' ? 'index.html' : safePath);
  const finalPath = filePath.startsWith(publicDir) ? filePath : path.join(publicDir, 'index.html');
  const ext = path.extname(finalPath);

  if (!existsSync(finalPath)) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }

  res.writeHead(200, {
    'content-type': mimeTypes.get(ext) || 'application/octet-stream',
    'cache-control': ext === '.html' ? 'no-store' : 'public, max-age=3600',
  });
  createReadStream(finalPath).pipe(res);
}

const server = http.createServer((req, res) => {
  if (req.url?.startsWith('/api/')) {
    handleApi(req, res);
  } else {
    serveStatic(req, res);
  }
});

server.listen(port, () => {
  console.log(`Filecoin Dead Drop running at http://localhost:${port}`);
  console.log(`Storage mode: ${shouldUseSynapse ? 'Synapse SDK' : 'mock demo'}`);
});
