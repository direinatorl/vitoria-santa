import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, sep } from 'node:path';
import { openDatabase, validateLead, saveLead } from './src/leads.js';
import { routes, renderPage, escape } from './src/pages.js';
import { handleChatApi } from './src/chat-api.js';

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '127.0.0.1';
const siteUrl = (process.env.SITE_URL || `http://localhost:${port}`).replace(/\/$/, '');
const origin = new URL(siteUrl).origin;
const publicDir = fileURLToPath(new URL('./public/', import.meta.url));
const databasePath = resolve(process.env.DATABASE_PATH || './data/contacts.sqlite');
if (databasePath.startsWith(resolve(publicDir) + sep)) throw new Error('DATABASE_PATH deve ficar fora de public/.');
const db = openDatabase(databasePath);
// Development loopback aliases share the same application; production remains exact-origin.
const allowedOrigins = new Set([origin]);
const localUrl = new URL(origin);
if (localUrl.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(localUrl.hostname)) {
  for (const hostname of ['localhost', '127.0.0.1', '[::1]']) allowedOrigins.add(`http://${hostname}${localUrl.port ? ':' + localUrl.port : ''}`);
}
const buckets = new Map();
const windowMs = 15 * 60 * 1000;
const cleanup = setInterval(() => { const now = Date.now(); for (const [key, value] of buckets) if (now > value.until) buckets.delete(key); }, 60000);
cleanup.unref();
function rateLimit(ip) {
  let bucket = buckets.get(ip);
  if (!bucket || Date.now() > bucket.until) { if (buckets.size >= 10000) return false; bucket = { count: 0, until: Date.now() + windowMs }; buckets.set(ip, bucket); }
  return ++bucket.count <= 8;
}
function send(res, status, data, type = 'application/json; charset=utf-8', extra = {}) {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', ...extra });
  res.end(type.startsWith('application/json') ? JSON.stringify(data) : data);
}
const server = http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
  if (siteUrl.startsWith('https:')) res.setHeader('Strict-Transport-Security', 'max-age=31536000');
  try {
    const url = new URL(req.url, origin);
    if (['/api/chat', '/api/requests'].includes(url.pathname)) return await handleChatApi(req, res);
    if (url.pathname === '/api/leads') {
      if (req.method !== 'POST') return send(res, 405, { message: 'Método não permitido.' }, undefined, { Allow: 'POST' });
      if (!allowedOrigins.has(req.headers.origin)) return send(res, 403, { message: 'Origem não autorizada. Atualize a página.' });
      if (!rateLimit(req.socket.remoteAddress)) return send(res, 429, { message: 'Muitos envios. Aguarde 15 minutos ou fale pelo WhatsApp.' }, undefined, { 'Retry-After': '900' });
      if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) return send(res, 415, { message: 'Formato não aceito.' });
      const chunks = []; let size = 0;
      for await (const chunk of req.iterator({ destroyOnReturn: false })) {
        size += chunk.length;
        if (size > 16384) { send(res, 413, { message: 'Solicitação muito grande.' }); req.resume(); return; }
        chunks.push(chunk);
      }
      let raw;
      try { raw = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return send(res, 400, { message: 'Solicitação inválida.' }); }
      const { errors, value } = validateLead(raw);
      if (Object.keys(errors).length) return send(res, 422, { message: 'Revise os campos indicados e tente novamente.', errors });
      const result = saveLead(db, value);
      if (result.conflict) return send(res, 409, { message: 'Identificador de envio já utilizado. Atualize a página.' });
      return send(res, result.duplicate ? 200 : 201, { id: result.id, message: 'Solicitação registrada.' });
    }
    if (!['GET', 'HEAD'].includes(req.method)) return send(res, 405, { message: 'Método não permitido.' }, undefined, { Allow: 'GET, HEAD' });
    if (url.pathname === '/robots.txt') return send(res, 200, `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${siteUrl}/sitemap.xml\n`, 'text/plain; charset=utf-8');
    if (url.pathname === '/sitemap.xml') return send(res, 200, `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${Object.keys(routes).map(path=>`<url><loc>${escape(siteUrl+path)}</loc></url>`).join('')}</urlset>`, 'application/xml; charset=utf-8');
    if (['/styles.css','/app.js','/theme.js','/chat.js','/chat-flow.js'].includes(url.pathname) || url.pathname.startsWith('/assets/')) {
      const file = resolve(publicDir, '.' + decodeURIComponent(url.pathname));
      if (!file.startsWith(resolve(publicDir) + sep)) return send(res, 403, { message: 'Acesso negado.' });
      const types = { css: 'text/css; charset=utf-8', js: 'text/javascript; charset=utf-8', jpg: 'image/jpeg', svg: 'image/svg+xml' };
      const type = types[file.split('.').at(-1)];
      if (!type) return send(res, 404, { message: 'Arquivo não encontrado.' });
      try { const data = await readFile(file); return send(res, 200, req.method === 'HEAD' ? '' : data, type, { 'Cache-Control': 'public, max-age=3600' }); }
      catch { return send(res, 404, { message: 'Arquivo não encontrado.' }); }
    }
    const path = url.pathname === '/' ? '/' : url.pathname.replace(/\/$/, '');
    const exists = Object.hasOwn(routes, path);
    if (exists && path !== url.pathname) return send(res, 308, '', 'text/plain', { Location: path + url.search });
    send(res, exists ? 200 : 404, req.method === 'HEAD' ? '' : renderPage(path, siteUrl, { chatApi: origin }), 'text/html; charset=utf-8');
  } catch (error) {
    console.error('Falha no processamento:', error.code || error.name || 'UnknownError');
    if (!res.headersSent) send(res, 500, { message: 'Não foi possível processar o pedido. Tente novamente ou utilize o WhatsApp.' });
    else res.end();
  }
});
server.requestTimeout = 20000;
server.headersTimeout = 15000;
server.listen(port, host, () => console.log(`Vitória Santa: ${siteUrl}`));
function shutdown() { server.close(() => { clearInterval(cleanup); db.close(); process.exit(0); }); }
process.on('SIGTERM', shutdown); process.on('SIGINT', shutdown);
