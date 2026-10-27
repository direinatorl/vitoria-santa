import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { fields, validateField, validateRequest, consentVersion } from '../public/chat-flow.js';
import { handleChatApi, signSession, verifySession } from '../src/chat-api.js';

process.env.CHAT_SESSION_SECRET = 'test-only-secret-not-for-production-0123456789';
process.env.CHAT_ALLOWED_ORIGINS = 'https://direinatorl.github.io,https://vitoria-santa.vercel.app';
const consortium = { asset: 'Imóvel', credit: '350.000,00', budget: '2.000', term: '180', bid: 'Ainda não sei', name: 'Pessoa Teste', phone: '11999990000', city: 'São Paulo', state: 'SP' };
const health = { plan: 'Empresarial', city: 'São Paulo', state: 'SP', lives: '2', ages: '20, 40', accommodation: 'Apartamento', copay: 'Quero orientação', coverage: 'Nacional', budget: 'Pular', company: 'Empresa Teste', name: 'Pessoa Teste', phone: '11999990000' };
test('coleta completa e validação compartilhada dos dois produtos', () => {
  for (const [product, data] of [['consorcios', consortium], ['saude', health]]) {
    const result = validateRequest({ product, data, consent: true, consentVersion });
    assert.equal(result.product, product);
    assert.equal(Object.keys(result.data).length, fields(product, data).length);
  }
  assert.equal(validateField({ key: 'credit' }, '350.000,00').value, '350000');
  assert.ok(validateField({ key: 'ages' }, '20', { lives: '2' }).error);
  assert.ok(validateField({ key: 'state' }, 'ZZ').error);
  assert.ok(validateField({ key: 'phone' }, '123').error);
  assert.ok(validateField({ key: 'name' }, '<script>').error);
  assert.throws(() => validateRequest({ product: 'consorcios', data: consortium, consent: false, consentVersion }));
  assert.throws(() => validateRequest({ product: 'saude', data: { ...health, company: '' }, consent: true, consentVersion }));
});
test('sessão assinada rejeita adulteração e expiração', () => {
  const token = signSession('consorcios');
  assert.equal(verifySession(token).product, 'consorcios');
  assert.throws(() => verifySession(token + 'x'));
  assert.throws(() => verifySession(signSession('saude', randomUUID(), 0)));
});
async function call(body, { origin = 'https://direinatorl.github.io', method = 'POST', path = '/api/chat', db = async () => true, headers = {} } = {}) {
  const req = { url: path, method, body, headers: { origin, 'content-type': 'application/json', ...headers }, socket: { remoteAddress: '127.0.0.1' } };
  const result = { headers: {} };
  const res = { setHeader(key, value) { result.headers[key] = value; }, writeHead(code) { result.status = code; }, end(value) { result.body = value ? JSON.parse(value) : null; } };
  await handleChatApi(req, res, { database: db });
  return result;
}
test('CORS exato, métodos, tamanho, consentimento e limite distribuído', async () => {
  assert.equal((await call({}, { origin: 'https://evil.example' })).status, 403);
  assert.equal((await call({}, { method: 'OPTIONS' })).status, 204);
  assert.equal((await call({}, { method: 'GET' })).status, 405);
  assert.equal((await call({ message: 'x'.repeat(13000) })).status, 413);
  assert.equal((await call({}, { db: async () => false })).status, 429);
  assert.equal((await call({ action: 'session', product: 'saude', consent: false, consentVersion })).status, 422);
  assert.equal((await call(null)).status, 400);
});
test('registro só confirma após a transação; falhas e conflitos nunca viram sucesso', async () => {
  const token = signSession('consorcios'); const id = randomUUID();
  const body = { token, requestId: id, product: 'consorcios', data: consortium, consent: true, consentVersion };
  const db = async (path, method, args) => path.includes('rate_limit') ? true : { id: args.p_request, duplicate: false };
  const result = await call(body, { path: '/api/requests', db });
  assert.equal(result.status, 201); assert.equal(result.body.id, id);
  const failure = await call(body, { path: '/api/requests', db: async path => { if (path.includes('rate_limit')) return true; throw new Error('private database error'); } });
  assert.equal(failure.status, 503); assert.equal(failure.body.id, undefined); assert.doesNotMatch(failure.body.message, /private/);
  assert.equal((await call(body, { path: '/api/requests', db: async path => path.includes('rate_limit') ? true : { id, duplicate: true } })).status, 200);
  assert.equal((await call(body, { path: '/api/requests', db: async path => path.includes('rate_limit') ? true : { id, conflict: true } })).status, 409);
  assert.equal((await call({ ...body, product: 'saude' }, { path: '/api/requests', db })).status, 422);
});
test('IA ausente e dados sensíveis têm resposta explícita sem chamada a provedor', async () => {
  const token = signSession('saude');
  delete process.env.AI_GATEWAY_API_KEY; delete process.env.VERCEL_OIDC_TOKEN;
  const response = await call({ token, product: 'saude', action: 'question', message: 'O que é coparticipação?' });
  assert.equal(response.body.ai, false); assert.match(response.body.message, /ainda não está disponível/);
  const sensitive = await call({ token, product: 'saude', action: 'question', message: 'Meu CPF é 12345678900' });
  assert.equal(sensitive.body.ai, false); assert.match(sensitive.body.message, /não encaminhei/);
});
