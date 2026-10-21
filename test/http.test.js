import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

const directory = mkdtempSync(join(tmpdir(), 'vitoria-http-'));
const origin = 'http://127.0.0.1:3098';
let child;
before(async () => {
  child = spawn(process.execPath, ['server.js'], { env: { ...process.env, PORT: '3098', SITE_URL: origin, DATABASE_PATH: join(directory, 'leads.sqlite') }, stdio: ['ignore', 'pipe', 'pipe'] });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timeout ao iniciar servidor')), 10000);
    child.once('error', reject);
    child.once('exit', code => { clearTimeout(timer); reject(new Error(`Servidor terminou: ${code}`)); });
    child.stdout.on('data', chunk => { if (chunk.toString().includes('Vitória Santa:')) { clearTimeout(timer); resolve(); } });
  });
});
after(async () => {
  if (child && child.exitCode === null) await new Promise(resolve => { child.once('exit', resolve); child.kill(); });
  rmSync(directory, { recursive: true, force: true });
});
const post = (body, requestOrigin = origin) => fetch(origin + '/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: requestOrigin }, body });

test('JSON inválido e corpo excessivo recebem respostas estruturadas', async () => {
  assert.equal((await post('{')).status, 400);
  assert.equal((await post('null')).status, 422);
  const large = await post(JSON.stringify({ message: 'x'.repeat(20000) }));
  assert.equal(large.status, 413); assert.ok((await large.json()).message);
  assert.equal((await fetch(origin)).status, 200);
});
test('aliases locais funcionam e origem de outra porta é bloqueada', async () => {
  const data = { service: 'contato', name: 'Teste HTTP', phone: '11999990000', consent: true, requestId: randomUUID() };
  assert.equal((await post(JSON.stringify(data), 'http://localhost:3098')).status, 201);
  assert.equal((await post(JSON.stringify(data), 'http://localhost:4000')).status, 403);
  assert.equal((await post(JSON.stringify(data), 'null')).status, 403);
});
test('URLs canônicas, HEAD e rotas inexistentes preservam os códigos HTTP', async () => {
  const redirect = await fetch(origin + '/consorcios/?origem=teste', { redirect: 'manual' });
  assert.equal(redirect.status, 308); assert.equal(redirect.headers.get('location'), '/consorcios?origem=teste');
  assert.equal((await fetch(origin + '/contato', { method: 'HEAD' })).status, 200);
  for (const path of ['/constructor', '/__proto__', '/assets/ausente.jpg']) assert.equal((await fetch(origin + path)).status, 404);
  const missing = await fetch(origin + '/nao-existe');
  assert.match(await missing.text(), /name="robots" content="noindex"/);
});
