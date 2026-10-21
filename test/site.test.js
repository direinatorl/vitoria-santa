import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { openDatabase, validateLead, saveLead } from '../src/leads.js';
import { company, whatsapp } from '../src/config.js';

const directory = mkdtempSync(join(tmpdir(), 'vitoria-santa-test-'));
const databasePath = join(directory, 'test.sqlite');
const origin = 'http://127.0.0.1:3097';
let child;
const lead = (service = 'contato') => ({ service, name: 'Cliente de Teste', phone: '(11) 99999-0000', email: 'teste@example.com', consent: true, requestId: randomUUID(), asset: 'imovel', city: 'São Paulo', state: 'SP', plan: 'individual-familiar', beneficiaries: '2' });
const post = (data, headers = {}) => fetch(origin + '/api/leads', { method: 'POST', headers: { origin, 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(data) });
before(async () => {
  child = spawn(process.execPath, ['server.js'], { cwd: process.cwd(), env: { ...process.env, PORT: '3097', HOST: '127.0.0.1', SITE_URL: origin, DATABASE_PATH: databasePath }, stdio: ['ignore','pipe','pipe'] });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Servidor não iniciou')), 10000);
    child.once('error', reject);
    child.once('exit', code => { clearTimeout(timer); reject(new Error(`Servidor terminou: ${code}`)); });
    child.stdout.on('data', chunk => { if (chunk.toString().includes('Vitória Santa:')) { clearTimeout(timer); resolve(); } });
  });
});
after(async () => {
  if (child && child.exitCode === null) await new Promise(resolve => { child.once('exit', resolve); child.kill(); });
  rmSync(directory, { recursive: true, force: true });
});
test('páginas, metadados, assets e erro 404', async () => {
  for (const path of ['/', '/consorcios', '/planos-de-saude', '/sobre', '/privacidade']) {
    const result = await fetch(origin + path); assert.equal(result.status, 200);
    const body = await result.text(); assert.match(body, /lang="pt-BR"/); assert.match(body, /name="description"/); assert.match(body, /aria-label="Navegação principal"/);
    assert.ok(result.headers.get('content-security-policy').includes("frame-ancestors 'none'"));
    for (const [, href] of body.matchAll(/href="(\/(?:[^"#]*))"/g)) {
      const linked = await fetch(origin + href); assert.equal(linked.status, 200, href);
    }
  }
  for (const path of ['/styles.css','/app.js','/assets/logo.jpg','/assets/familia.jpg','/assets/favicon.svg','/robots.txt','/sitemap.xml']) assert.equal((await fetch(origin + path)).status, 200, path);
  assert.equal((await fetch(origin + '/nao-existe')).status, 404);
  assert.equal((await fetch(origin + '/data/contacts.sqlite')).status, 404);
  assert.equal((await fetch(origin + '/.env')).status, 404);
});
test('validação rejeita campos ausentes, email inválido, spam, modalidades e dados excessivos', () => {
  assert.ok(Object.keys(validateLead({}).errors).length >= 4);
  assert.ok(validateLead({ ...lead(), consent: false }).errors.consent);
  assert.ok(validateLead({ ...lead(), email: 'invalido' }).errors.email);
  assert.ok(validateLead({ ...lead(), website: 'bot' }).errors.form);
  assert.ok(validateLead({ ...lead('saude'), state: 'XX', beneficiaries: '-1' }).errors.state);
  assert.ok(validateLead({ ...lead('consorcios'), asset: 'invalido' }).errors.asset);
  assert.ok(validateLead({ ...lead(), message: 'x'.repeat(1001) }).errors.message);
  assert.ok(validateLead({ ...lead(), phone: '123' }).errors.phone);
});
test('API rejeita dados inválidos e não grava registros', async () => {
  const response = await post({ ...lead(), consent: false, phone: '123' });
  assert.equal(response.status, 422);
  const db = new DatabaseSync(databasePath); assert.equal(db.prepare('SELECT count(*) as total FROM leads').get().total, 0); db.close();
});
test('três serviços são persistidos, reenvio é idempotente e conflito é rejeitado', async () => {
  for (const service of ['contato','consorcios','saude']) {
    const data = lead(service); const response = await post(data); assert.equal(response.status, 201);
    const saved = await response.json(); assert.ok(saved.id > 0);
    if (service === 'contato') {
      const duplicate = await post(data); assert.equal(duplicate.status, 200); assert.equal((await duplicate.json()).id, saved.id);
      assert.equal((await post({ ...data, name: 'Outra Pessoa' })).status, 409);
    }
  }
  const db = new DatabaseSync(databasePath);
  const rows = db.prepare('SELECT * FROM leads ORDER BY id').all(); assert.equal(rows.length, 3);
  assert.equal(rows[0].phone, '11999990000'); assert.equal(rows[0].consent_version, '2026-10-21');
  assert.equal(JSON.parse(rows[2].details).city, 'São Paulo'); db.close();
});
test('origem externa, método e formato incorretos são bloqueados', async () => {
  assert.equal((await post(lead(), { origin: 'https://malicioso.example' })).status, 403);
  assert.equal((await fetch(origin + '/api/leads')).status, 405);
  assert.equal((await post(lead(), { 'Content-Type': 'text/plain' })).status, 415);
});
test('limite de envios impede abuso', async () => {
  let response;
  for (let i=0;i<10;i++) response = await post(lead());
  assert.equal(response.status, 429); assert.equal(response.headers.get('retry-after'), '900');
});
test('SQL parametrizado preserva conteúdo como dado e banco permanece íntegro', () => {
  const path = join(directory, 'injection.sqlite'); let db = openDatabase(path);
  const raw = { ...lead(), name: "Teste'); DROP TABLE leads; --", message: '<script>alert(1)</script>' };
  const { value, errors } = validateLead(raw); assert.deepEqual(errors, {}); saveLead(db, value); db.close();
  db = openDatabase(path); const row = db.prepare('SELECT name, details FROM leads').get();
  assert.equal(row.name, raw.name); assert.equal(JSON.parse(row.details).message, raw.message); db.close();
});
test('WhatsApp usa número oficial e mensagens diferentes por serviço', () => {
  for (const service of ['contato','consorcios','saude']) { const url = new URL(whatsapp(service)); assert.equal(url.pathname, '/' + company.whatsapp); assert.ok(url.searchParams.get('text').includes('Vitória Santa')); }
  assert.notEqual(whatsapp('consorcios'), whatsapp('saude'));
});
