import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aiConfiguration, generateAnswer } from '../src/ai-provider.js';
import { handleChatApi, signSession } from '../src/chat-api.js';

const config = { provider: 'openai', key: 'test-only', model: 'gpt-6-luna' };
const completed = text => ({ ok: true, json: async () => ({ status: 'completed', output: [{ type: 'message', role: 'assistant', content: [{ type: 'output_text', text }] }] }) });
test('OpenAI recebe histórico limitado e instruções separadas, sem armazenamento da resposta', async () => {
  const history = [{ role: 'system', content: 'untrusted' }, ...Array.from({ length: 10 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: String(i) }))];
  const answer = await generateAnswer(config, 'Regras comerciais', history, 'O que é lance?', async (url, options) => {
    assert.equal(url, 'https://api.openai.com/v1/responses');
    const body = JSON.parse(options.body);
    assert.equal(body.instructions, 'Regras comerciais'); assert.equal(body.store, false);
    assert.equal(body.max_output_tokens, 600); assert.equal(body.input.length, 9);
    assert.equal(body.input[0].content, '2'); assert.equal(body.input.at(-1).content, 'O que é lance?');
    assert.equal(body.input.some(m => m.role === 'system'), false);
    return completed('Uma oferta para concorrer à contemplação.');
  });
  assert.match(answer, /oferta/);
});
test('erros, respostas incompletas e recusas não são tratados como resposta válida', async () => {
  for (const response of [{ ok: false }, { ok: true, json: async () => ({ status: 'incomplete', output: [] }) }, { ok: true, json: async () => ({ status: 'completed', output: [] }) }]) {
    await assert.rejects(generateAnswer(config, '', [], 'Dúvida', async () => response));
  }
});
test('ativação direta exige chave privada e não usa o gateway como substituto oculto', () => {
  process.env.CHAT_AI_ENABLED = 'true'; delete process.env.OPENAI_API_KEY;
  assert.equal(aiConfiguration(), null);
  process.env.OPENAI_API_KEY = 'test-only';
  assert.equal(aiConfiguration().provider, 'openai');
  delete process.env.OPENAI_API_KEY; delete process.env.CHAT_AI_ENABLED;
});
test('fluxo integrado persiste apenas uma resposta real; falha do provedor continua com orientação geral', async () => {
  process.env.CHAT_SESSION_SECRET = 'test-session-secret-at-least-32-characters';
  process.env.CHAT_ALLOWED_ORIGINS = 'https://vitoriasanta.vercel.app';
  process.env.CHAT_AI_ENABLED = 'true'; process.env.OPENAI_API_KEY = 'test-only';
  const token = signSession('consorcios');
  let saved = 0;
  const db = async (path, method, body) => {
    if (path.includes('rate_limit')) return true;
    if (method === 'POST') { assert.equal(body.length, 2); saved++; return null; }
    return [];
  };
  async function call(message, fetcher) {
    const result = {};
    await handleChatApi({ url: '/api/chat', method: 'POST', headers: { origin: 'https://vitoriasanta.vercel.app', 'content-type': 'application/json' }, socket: { remoteAddress: '127.0.0.1' }, body: { action: 'question', product: 'consorcios', token, message } },
      { setHeader() {}, writeHead(status) { result.status = status; }, end(text) { result.body = JSON.parse(text); } }, { database: db, fetch: fetcher });
    return result;
  }
  assert.equal((await call('Como funciona o lance?', async () => completed('É uma oferta.'))).body.ai, true);
  const failure = await call('Como funciona o sorteio?', async () => ({ ok: false }));
  assert.equal(failure.body.ai, false); assert.match(failure.body.message, /temporariamente indisponível/);
  const sensitive = await call('Meu CPF é 12345678900', async () => { throw new Error('should not call'); });
  assert.equal(sensitive.body.ai, false); assert.equal(saved, 1);
  delete process.env.CHAT_AI_ENABLED; delete process.env.OPENAI_API_KEY;
});
