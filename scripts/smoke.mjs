import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import assert from 'node:assert/strict';

const directory = mkdtempSync(join(tmpdir(), 'vitoria-build-'));
const databasePath = join(directory, 'leads.sqlite');
const origin = 'http://127.0.0.1:3099';
const child = spawn(process.execPath, ['dist/server.js'], { env: { ...process.env, PORT: '3099', HOST: '127.0.0.1', SITE_URL: origin, DATABASE_PATH: databasePath }, stdio: ['ignore', 'pipe', 'pipe'] });
try {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Build não iniciou')), 10000);
    child.once('error', reject);
    child.once('exit', code => { clearTimeout(timer); reject(new Error(`Build terminou: ${code}`)); });
    child.stdout.on('data', chunk => { if (chunk.toString().includes('Vitória Santa:')) { clearTimeout(timer); resolve(); } });
  });
  assert.equal((await fetch(origin)).status, 200);
  assert.equal((await fetch(origin + '/assets/casa.jpg')).status, 200);
  const response = await fetch(origin + '/api/leads', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ service: 'contato', name: 'Teste build', phone: '11999990000', consent: true, requestId: randomUUID() }) });
  assert.equal(response.status, 201);
  const db = new DatabaseSync(databasePath);
  try { assert.equal(db.prepare('SELECT count(*) AS total FROM leads').get().total, 1); } finally { db.close(); }
  console.log('Build executado: página, imagem, formulário e persistência confirmados.');
} finally {
  if (child.exitCode === null) await new Promise(resolve => { child.once('exit', resolve); child.kill(); });
  rmSync(directory, { recursive: true, force: true });
}
