// Server-only provider adapter. Never accept credentials, URLs or models from the browser.
export function aiConfiguration(headers = {}) {
  if (process.env.CHAT_AI_ENABLED === 'true') {
    const key = process.env.OPENAI_API_KEY || process.env.OPEN_API_KEY;
    if (!key) return null;
    return { provider: 'openai', key, model: process.env.OPENAI_MODEL || 'gpt-6-luna' };
  }
  if (process.env.AI_GATEWAY_ENABLED !== 'true' || !process.env.AI_GATEWAY_MODEL) return null;
  const key = process.env.AI_GATEWAY_API_KEY || (process.env.VERCEL === '1' ? headers['x-vercel-oidc-token'] : undefined) || process.env.VERCEL_OIDC_TOKEN;
  return key ? { provider: 'gateway', key, model: process.env.AI_GATEWAY_MODEL } : null;
}

export async function generateAnswer(config, instructions, history, message, fetcher = fetch) {
  // Keep a short, chronological history and discard unexpected database roles.
  const input = history.filter(m => ['user', 'assistant'].includes(m.role) && typeof m.content === 'string').slice(-8).map(m => ({ role: m.role, content: m.content.slice(0, 4000) }));
  input.push({ role: 'user', content: message });
  const openai = config.provider === 'openai';
  const response = await fetcher(openai ? 'https://api.openai.com/v1/responses' : 'https://ai-gateway.vercel.sh/v1/chat/completions', {
    method: 'POST', headers: { Authorization: `Bearer ${config.key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(openai
      ? { model: config.model, instructions, input, store: false, max_output_tokens: 600, ...(config.model === 'gpt-6-luna' ? { reasoning: { effort: 'none' } } : {}) }
      : { model: config.model, messages: [{ role: 'system', content: instructions }, ...input], max_tokens: 450 }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error('AI provider unavailable');
  const data = await response.json();
  if (openai && data.status !== 'completed') throw new Error('Incomplete AI response');
  const answer = openai
    ? (data.output || []).filter(item => item.type === 'message' && item.role === 'assistant').flatMap(item => item.content || []).filter(item => item.type === 'output_text').map(item => item.text).join('\n')
    : data.choices?.[0]?.message?.content;
  if (typeof answer !== 'string' || !answer.trim() || answer.length > 4000) throw new Error('Invalid AI response');
  return answer.trim();
}
