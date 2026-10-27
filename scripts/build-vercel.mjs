import { mkdirSync, cpSync, writeFileSync } from 'node:fs';
import { routes, renderPage } from '../src/pages.js';
const root = new URL('../vercel-public/', import.meta.url);
mkdirSync(root, { recursive: true });
cpSync(new URL('../public/', import.meta.url), root, { recursive: true });
const site = process.env.SITE_URL || `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || 'localhost'}`;
for (const route of [...Object.keys(routes), '/404']) {
  const directory = new URL(route === '/' ? './' : `.${route}/`, root);
  mkdirSync(directory, { recursive: true });
  const html = renderPage(route, site, { staticContact: true, chatApi: site });
  writeFileSync(new URL('index.html', directory), html);
  if (route === '/404') writeFileSync(new URL('404.html', root), html);
}
writeFileSync(new URL('robots.txt', root), `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${site}/sitemap.xml\n`);
writeFileSync(new URL('sitemap.xml', root), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${Object.keys(routes).map(route => `<url><loc>${site}${route}</loc></url>`).join('')}</urlset>`);
console.log('Frontend Vercel exportado. API de chat independente; servidor SQLite preservado.');
