/**
 * Vite dev plugin: serves /api/* by calling the Netlify function
 * (netlify/functions/api.ts) directly – so `npm run dev:vite` works without
 * the Netlify CLI. Storage falls back to .data/ JSON files (see netlify/lib/store.ts).
 */
import type { Plugin } from 'vite';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { IncomingMessage } from 'node:http';

async function loadDotEnv(root: string) {
  for (const f of ['.env', '.env.local']) {
    try {
      const txt = await fs.readFile(path.join(root, f), 'utf8');
      for (const line of txt.split('\n')) {
        const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
        if (!m || line.trim().startsWith('#')) continue;
        let v = m[2];
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
        if (process.env[m[1]] === undefined) process.env[m[1]] = v;
      }
    } catch {
      /* no file */
    }
  }
}

function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export function netlifyApiPlugin(): Plugin {
  return {
    name: 'local-netlify-api',
    async configureServer(server) {
      await loadDotEnv(server.config.root);
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !(req.url === '/api' || req.url.startsWith('/api/') || req.url.startsWith('/api?'))) return next();
        try {
          const mod = await server.ssrLoadModule('/netlify/functions/api.ts');
          const handler = mod.default as (r: Request, c: unknown) => Promise<Response>;
          const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
          const headers = new Headers();
          for (const [k, v] of Object.entries(req.headers)) {
            if (Array.isArray(v)) v.forEach((x) => headers.append(k, x));
            else if (typeof v === 'string') headers.set(k, v);
          }
          const method = req.method || 'GET';
          const body = method === 'GET' || method === 'HEAD' ? undefined : await readBody(req);
          const request = new Request(url, { method, headers, body: body && body.length ? new Uint8Array(body) : undefined });
          const context = { ip: req.socket.remoteAddress || '127.0.0.1' };
          const response = await handler(request, context);
          res.statusCode = response.status;
          response.headers.forEach((v, k) => res.setHeader(k, v));
          const buf = Buffer.from(await response.arrayBuffer());
          res.end(buf);
        } catch (err) {
          console.error('[local-netlify-api]', err);
          res.statusCode = 500;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({ error: 'Local API error: ' + String((err as Error)?.message ?? err) }));
        }
      });
    },
  };
}
