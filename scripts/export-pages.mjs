import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { routes, renderPage, escape } from '../src/pages.js';

// Existing GitHub Pages publication: main, repository root. No provider is changed.
const root = fileURLToPath(new URL('../', import.meta.url));
const siteUrl = (process.env.PAGES_URL || 'https://direinatorl.github.io/vitoria-santa').replace(/\/$/, '');
const basePath = new URL(siteUrl).pathname.replace(/\/$/, '');
const check = process.argv.includes('--check');
function emit(name, content) {
  const file = resolve(root, name);
  if (check) {
    let current;
    try { current = readFileSync(file, 'utf8'); } catch { throw new Error(`Exportação ausente: ${name}`); }
    if (current.replace(/\r\n/g, '\n') !== content.replace(/\r\n/g, '\n')) throw new Error(`Exportação desatualizada: ${name}. Execute node scripts/export-pages.mjs.`);
  } else { mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, content); }
}
function staticHtml(path) {
  return renderPage(path, siteUrl, { staticContact: true, chatApi: process.env.CHAT_API_URL || 'https://vitoria-santa.vercel.app' })
    .replaceAll(siteUrl + '/assets/', siteUrl + '/public/assets/')
    .replace(/(href|src)="(\/[^"\s]*)"/g, (_, attribute, target) => {
      const url = new URL(target, 'https://local.invalid');
      const asset = url.pathname.startsWith('/assets/') || ['/styles.css', '/app.js', '/theme.js', '/chat.js'].includes(url.pathname);
      const suffix = asset ? '/public' + url.pathname : url.pathname.replace(/\/$/, '') + '/';
      return `${attribute}="${basePath}${suffix}${url.search}${url.hash}"`;
    })
    .replace(`rel="canonical" href="${escape(siteUrl + path)}"`, `rel="canonical" href="${escape(siteUrl + (path === '/' ? '/' : path + '/'))}"`);
}
for (const path of Object.keys(routes)) emit(path === '/' ? 'index.html' : path.slice(1) + '/index.html', staticHtml(path));
emit('404.html', staticHtml('/404'));
emit('.nojekyll', '');
emit('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`);
emit('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${Object.keys(routes).map(path => `<url><loc>${escape(siteUrl + (path === '/' ? '/' : path + '/'))}</loc></url>`).join('')}</urlset>\n`);
console.log(check ? 'Exportação GitHub Pages atualizada e verificada.' : 'Site exportado para a publicação existente do GitHub Pages. Atendimento público por WhatsApp; API preservada no servidor Node.');
