import { createHmac, timingSafeEqual } from 'node:crypto';
import { database } from './chat-api.js';

export async function handleRequestEmail(req, res, dependencies = {}) {
  const reply = status => { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify({ ok: status === 202 })); };
  if (req.method !== 'POST') return reply(405);
  if (!process.env.EMAIL_HOOK_SECRET) return reply(503);
  let body;
  try {
    if (req.body !== undefined) body = typeof req.body === 'object' ? req.body : JSON.parse(req.body);
    else {
      let text = '';
      for await (const chunk of req) { text += chunk; if (text.length > 1024) return reply(413); }
      body = JSON.parse(text);
    }
    if (!body || JSON.stringify(body).length > 1024) return reply(413);
    const { id, timestamp, signature } = body;
    if (!/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(id) || !/^\d{10}$/.test(timestamp) || !/^[\da-f]{64}$/.test(signature)) return reply(403);
    if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return reply(403);
    const expected = createHmac('sha256', process.env.EMAIL_HOOK_SECRET).update(`${id}:${timestamp}`).digest();
    if (!timingSafeEqual(expected, Buffer.from(signature, 'hex'))) return reply(403);
  } catch { return reply(400); }
  const db = dependencies.database || database;
  try {
    // Atomic claim prevents replay or duplicate requests from sending a second email.
    if (await db('rpc/claim_request_email', 'POST', { p_request: body.id }) !== true) return reply(202);
    let status = 'unknown', httpStatus = null;
    try {
      const payload = await db('rpc/request_email_payload', 'POST', { p_request: body.id });
      const response = await (dependencies.fetch || fetch)('https://formsubmit.co/ajax/atendimento@vitoriasanta.com.br', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json', Referer: 'https://vitoriasanta.vercel.app/' },
        body: JSON.stringify(payload), signal: AbortSignal.timeout(12000),
      });
      httpStatus = response.status;
      const result = await response.json();
      status = response.ok && [true, 'true'].includes(result.success) ? 'accepted' : /activation/i.test(result.message || '') ? 'activation_required' : 'failed';
    } catch { /* Unknown outcome: do not blindly retry an email which may have been sent. */ }
    await db(`request_email_notifications?request_id=eq.${body.id}&status=eq.processing`, 'PATCH', { status, http_status: httpStatus, checked_at: new Date().toISOString() });
    return reply(202);
  } catch { return reply(503); }
}
