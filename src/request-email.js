import { createHmac, timingSafeEqual } from 'node:crypto';
import { database } from './chat-api.js';

export const requestEmailRecipient = 'direinato13@gmail.com';

export async function sendRequestEmail(payload, id, fetchImpl = fetch) {
  const apiKey = process.env.vitoriasanta_RESEND_API_KEY || process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('Resend is not configured');
  const domain = process.env.vitoriasanta_RESEND_EMAIL_DOMAIN || 'resend.dev';
  if (!/^[a-z0-9.-]+$/i.test(domain)) throw new Error('Invalid sending domain');
  const response = await fetchImpl('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': `request-email/${id}` },
    body: JSON.stringify({
      from: `Vitória Santa <${domain === 'resend.dev' ? 'onboarding' : 'notificacoes'}@${domain}>`,
      to: [requestEmailRecipient],
      subject: payload._subject,
      text: `${payload.resumo}\n\nOrigem: ${payload.origem}\nProtocolo: ${payload.protocolo}`,
    }),
    signal: AbortSignal.timeout(12000),
  });
  // A known HTTP refusal remains a failure even if the provider returns HTML.
  let result = {};
  try { result = await response.json(); } catch { /* Non-JSON provider error. */ }
  return { status: response.ok && typeof result.id === 'string' ? 'accepted' : response.ok ? 'unknown' : 'failed',
    httpStatus: response.status, providerId: result.id || null, errorName: result.name || null,
    errorMessage: !response.ok && typeof result.message === 'string' ? result.message.replaceAll(apiKey, '[redacted]').slice(0, 512) : null };
}

export async function handleRequestEmail(req, res, dependencies = {}) {
  const reply = (status, notification) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify({ ok: status === 202, ...(notification ? { notification } : {}) })); };
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
    let status = 'unknown', httpStatus = null, notification;
    try {
      const payload = await db('rpc/request_email_payload', 'POST', { p_request: body.id });
      const result = await sendRequestEmail(payload, body.id, dependencies.fetch || fetch);
      notification = result;
      httpStatus = result.httpStatus;
      status = result.status;
      console.info('request-email', JSON.stringify({ requestId: body.id, ...result }));
    } catch { /* Unknown outcome: do not blindly retry an email which may have been sent. */ }
    await db(`request_email_notifications?request_id=eq.${body.id}&status=eq.processing`, 'PATCH', { status, http_status: httpStatus, checked_at: new Date().toISOString() });
    return reply(202, notification);
  } catch { return reply(503); }
}
