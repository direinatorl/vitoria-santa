import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { handleRequestEmail } from '../src/request-email.js';

process.env.EMAIL_HOOK_SECRET = 'test-email-hook-secret';
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
      assert.equal(url, 'https://formsubmit.co/ajax/atendimento@vitoriasanta.com.br');
      assert.equal(JSON.parse(options.body).resumo, 'Resumo de teste');
      sends++; return { ok: true, status: 200, json: async () => ({ success: 'true' }) };
    },
  };
  assert.equal((await call(signed(), dependencies)).status, 202);
  assert.equal((await call(signed(), dependencies)).status, 202);
  assert.equal(sends, 1); assert.equal(patch.status, 'accepted');
});
test('ativação pendente e falha de rede não são marcadas como entrega', async () => {
  for (const scenario of ['activation', 'timeout']) {
    let recorded;
    const result = await call(signed(), {
      database: async (path, method, body) => {
        if (path === 'rpc/claim_request_email') return true;
        if (path === 'rpc/request_email_payload') return { resumo: 'teste' };
        recorded = body;
      },
      fetch: async () => { if (scenario === 'timeout') throw new Error('network'); return { ok: true, status: 200, json: async () => ({ success: 'false', message: 'This form needs Activation' }) }; },
    });
    assert.equal(result.status, 202);
    assert.equal(recorded.status, scenario === 'timeout' ? 'unknown' : 'activation_required');
  }
});
