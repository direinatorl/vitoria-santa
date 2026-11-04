import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { handleRequestEmail } from '../src/request-email.js';

process.env.EMAIL_HOOK_SECRET = 'test-email-hook-secret';
process.env.vitoriasanta_RESEND_API_KEY = 'test-resend-key';
process.env.vitoriasanta_RESEND_EMAIL_DOMAIN = 'resend.dev';
const id = '05966913-08dc-47fc-a3d1-f1394d794730';
function signed(timestamp = String(Math.floor(Date.now() / 1000))) {
  return { id, timestamp, signature: createHmac('sha256', process.env.EMAIL_HOOK_SECRET).update(`${id}:${timestamp}`).digest('hex') };
}
async function call(body, dependencies) {
  const result = {};
  await handleRequestEmail({ method: 'POST', body }, { writeHead(status) { result.status = status; }, end(text) { result.body = JSON.parse(text); } }, dependencies);
  return result;
}
test('notificação rejeita assinaturas inválidas e expiradas antes de ler dados', async () => {
  const dependencies = { database() { throw new Error('must not query'); } };
  assert.equal((await call({ ...signed(), signature: '0'.repeat(64) }, dependencies)).status, 403);
  assert.equal((await call(signed('1700000000'), dependencies)).status, 403);
  assert.equal((await call(null, dependencies)).status, 413);
});
test('notificação envia apenas uma vez e somente ao destinatário fixo', async () => {
  let claimed = false, sends = 0, patch;
  const dependencies = {
    database: async (path, method, body) => {
      if (path === 'rpc/claim_request_email') { if (claimed) return false; claimed = true; return true; }
      if (path === 'rpc/request_email_payload') return { resumo: 'Resumo de teste', protocolo: id };
      patch = body;
    },
    fetch: async (url, options) => {
      assert.equal(url, 'https://api.resend.com/emails');
      const payload = JSON.parse(options.body);
      assert.deepEqual(payload.to, ['direinato13@gmail.com']);
      assert.equal(payload.from, 'Vitória Santa <onboarding@resend.dev>');
      assert.match(payload.text, /Resumo de teste/);
      assert.equal(options.headers['Idempotency-Key'], `request-email/${id}`);
      sends++; return { ok: true, status: 200, json: async () => ({ id: 'provider-test-id' }) };
    },
  };
  assert.equal((await call(signed(), dependencies)).status, 202);
  assert.equal((await call(signed(), dependencies)).status, 202);
  assert.equal(sends, 1); assert.equal(patch.status, 'accepted');
});
test('recusa HTTP, HTML de bloqueio e falha de rede não são marcadas como entrega', async () => {
  for (const scenario of ['refusal', 'html', 'timeout', 'invalid-success']) {
    let recorded;
    const result = await call(signed(), {
      database: async (path, method, body) => {
        if (path === 'rpc/claim_request_email') return true;
        if (path === 'rpc/request_email_payload') return { resumo: 'teste' };
        recorded = body;
      },
      fetch: async () => {
        if (scenario === 'timeout') throw new Error('network');
        return { ok: scenario === 'invalid-success', status: scenario === 'invalid-success' ? 200 : 403,
          json: async () => { if (scenario === 'html') throw new SyntaxError('HTML'); return {}; } };
      },
    });
    assert.equal(result.status, 202);
    assert.equal(recorded.status, ['timeout', 'invalid-success'].includes(scenario) ? 'unknown' : 'failed');
    if (scenario === 'html') assert.equal(recorded.http_status, 403);
  }
});
