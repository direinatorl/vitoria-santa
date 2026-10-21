import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { routes, renderPage } from '../src/pages.js';

test('GitHub Pages apresenta o site, com links e imagens válidos no subdiretório', () => {
  for (const route of Object.keys(routes)) {
    const file = route === '/' ? 'index.html' : route.slice(1) + '/index.html';
    const html = readFileSync(file, 'utf8');
    assert.match(html, /lang="pt-BR"/);
    assert.doesNotMatch(html, /<form\b/);
    assert.match(html, /https:\/\/wa.me\/5511999747932/);
    for (const [, target] of html.matchAll(/(?:href|src)="(\/[^"\s]*)"/g)) {
      const url = new URL(target, 'https://local.invalid');
      assert.ok(url.pathname.startsWith('/vitoria-santa/'), target);
      let path = url.pathname.slice('/vitoria-santa/'.length);
      if (!path || path.endsWith('/')) path += 'index.html';
      assert.ok(existsSync(resolve(path)), target);
    }
  }
  assert.ok(existsSync('.nojekyll')); assert.ok(existsSync('404.html'));
});
test('formulários persistentes continuam presentes no servidor; Pages oferece contato real por WhatsApp', () => {
  for (const route of ['/consorcios', '/planos-de-saude', '/contato']) {
    assert.match(renderPage(route, 'http://localhost:3000'), /action="\/api\/leads"/);
    const published = renderPage(route, 'https://direinatorl.github.io/vitoria-santa', { staticContact: true });
    assert.doesNotMatch(published, /<form\b/);
    assert.match(published, /A mensagem só será enviada por você/);
  }
});
