import { fields, validateField, consentVersion, knowledge } from './chat-flow.js';

const launcher = document.querySelector('#chat-launcher');
const panel = document.querySelector('#vs-chat');
const log = panel.querySelector('[role=log]');
const choices = panel.querySelector('.chat-choices');
const input = panel.querySelector('#chat-input');
const form = panel.querySelector('form');
const status = panel.querySelector('.chat-status');
const api = document.querySelector('meta[name=chat-api]')?.content || '';
const storageKey = 'vs-chat-session-v1';
let state = { product: '', data: {}, messages: [], consent: false, step: 0, mode: 'welcome', requestId: crypto.randomUUID() };
let busy = false, lastFocus, editing = null, controller;
try {
  const saved = JSON.parse(sessionStorage.getItem(storageKey));
  if (saved && Date.now() - saved.savedAt < 1800000 && Array.isArray(saved.messages) && ['welcome', 'consent', 'collect', 'review', 'done'].includes(saved.mode)) state = saved;
} catch { /* Session storage is optional. */ }
function save() {
  state.savedAt = Date.now(); state.messages = state.messages.slice(-70);
  try { sessionStorage.setItem(storageKey, JSON.stringify(state)); } catch { /* Continue in memory. */ }
}
function message(role, text, persist = true) {
  const bubble = document.createElement('p'); bubble.className = `chat-message ${role}`; bubble.textContent = text;
  log.append(bubble); log.scrollTop = log.scrollHeight;
  if (persist) { state.messages.push({ role, content: text }); save(); }
}
function options(items) {
  choices.replaceChildren();
  for (const [label, action] of items) {
    const button = document.createElement('button'); button.type = 'button'; button.textContent = label;
    button.addEventListener('click', () => { if (!busy) action(); }); choices.append(button);
  }
}
function consent() {
  state.mode = 'consent';
  message('assistant', 'Para preparar seu pedido, vamos coletar seus dados de contato e preferências. Com sua autorização, o pedido será enviado à Vitória Santa por uma API na Vercel e armazenado no Supabase por até 50 dias. Dúvidas enviadas à IA são processadas pelo Vercel AI Gateway e seu provedor; não inclua documentos ou dados médicos. O histórico fica nesta aba por até 30 minutos de inatividade. Consulte a Política de Privacidade abaixo. Você autoriza esse atendimento?');
  renderControls();
}
function start(product, preset) {
  if (state.product && state.product !== product && Object.keys(state.data).length) {
    options([['Continuar atendimento atual', renderControls], ['Iniciar novo atendimento', () => { reset(); start(product, preset); }]]);
    message('assistant', 'Você já tem um atendimento em andamento. Iniciar outro apaga o rascunho desta aba.'); return;
  }
  if (state.product === product && state.mode !== 'welcome') { renderControls(); return; }
  if (state.product && state.product !== product) reset();
  state.product = product;
  if (preset) state.data[product === 'consorcios' ? 'asset' : 'plan'] = preset;
  message('assistant', product === 'consorcios' ? 'Olá! 👋 Sou o Assistente Virtual Vitória Santa. Vamos conhecer o Consórcio Porto Seguro / Porto Bank para planejar seu imóvel ou carro? A contemplação acontece por sorteio ou lance, sem garantia de data. Prepararemos uma solicitação, não uma simulação de preços.' : 'Olá! 👋 Sou o Assistente Virtual Vitória Santa. Vou ajudar você a entender os planos de saúde e preparar uma solicitação de cotação para a equipe. Preços e disponibilidade serão confirmados por um consultor.');
  consent();
}
function reset() {
  controller?.abort(); busy = false; editing = null;
  delete form.dataset.question;
  state = { product: '', data: {}, messages: [], consent: false, step: 0, mode: 'welcome', requestId: crypto.randomUUID() };
  log.replaceChildren(); status.textContent = ''; save(); renderControls();
}
function currentField() { return fields(state.product, state.data).find(f => f.key === editing) || fields(state.product, state.data)[state.step]; }
function ask() {
  const list = fields(state.product, state.data);
  while (state.step < list.length && state.data[list[state.step].key]) state.step++;
  if (state.step >= list.length) return review();
  state.mode = 'collect'; message('assistant', currentField().question); renderControls(); input.focus();
}
function review() {
  state.mode = 'review'; editing = null;
  message('assistant', 'Revise seu pedido:\n' + fields(state.product, state.data).map(f => `${f.label}: ${state.data[f.key] || 'Não informado'}`).join('\n') + '\n\n' + (state.product === 'consorcios' ? 'Administradora: Porto Seguro / Porto Bank. ' : '') + 'Valores finais e disponibilidade dependem de proposta oficial e confirmação da equipe. Nenhum pedido foi enviado ainda.');
  renderControls();
}
function accept(text) {
  if (busy || state.mode !== 'collect') return;
  const f = currentField(); const result = validateField(f, text, state.data);
  if (result.error) { status.textContent = result.error; input.setAttribute('aria-invalid', 'true'); input.focus(); return; }
  status.textContent = ''; input.removeAttribute('aria-invalid'); message('user', text); state.data[f.key] = result.value;
  if (f.key === 'lives') delete state.data.ages;
  if (f.key === 'plan' && result.value !== 'Empresarial') delete state.data.company;
  if (editing) {
    editing = null;
    const missing = fields(state.product, state.data).findIndex(item => !state.data[item.key]);
    if (missing >= 0) { state.step = missing; return ask(); }
    return review();
  }
  state.step++; ask();
}
async function request(action, payload) {
  if (!api) throw new Error('O registro online ainda está indisponível. Seu pedido não foi salvo. Você pode continuar pelo WhatsApp.');
  controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch(`${api}/api/${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: controller.signal });
    const result = await response.json().catch(() => { throw new Error('Não conseguimos confirmar o envio. Tente novamente ou fale pelo WhatsApp.'); });
    if (!response.ok) throw new Error(result.message || 'Atendimento temporariamente indisponível. Tente novamente ou fale pelo WhatsApp.');
    return result;
  } finally { clearTimeout(timer); }
}
async function session() {
  if (!state.token) {
    const result = await request('chat', { action: 'session', product: state.product, consent: true, consentVersion });
    state.token = result.token; save();
  }
}
function loading(value, text = 'Assistente digitando…') {
  busy = value; status.textContent = value ? text : ''; form.setAttribute('aria-busy', String(value));
  input.disabled = value; panel.querySelectorAll('.chat-choices button, .chat-send').forEach(b => { b.disabled = value; });
}
async function sendRequest() {
  loading(true, 'Enviando seu pedido…');
  try {
    await session();
    const result = await request('requests', { token: state.token, requestId: state.requestId, product: state.product, data: state.data, consent: state.consent, consentVersion });
    if (!result.id) throw new Error('Não foi possível confirmar o registro. Tente novamente com este mesmo pedido.');
    state.mode = 'done'; message('assistant', `Solicitação registrada com sucesso. Protocolo ${result.id}. A equipe poderá continuar seu atendimento. Você também pode falar diretamente pelo WhatsApp.`);
    state.data = {}; save();
  } catch (error) { message('assistant', ['AbortError', 'TypeError'].includes(error.name) ? 'Não conseguimos confirmar o envio. Tente novamente: o identificador deste pedido será mantido para evitar duplicação. O WhatsApp continua disponível.' : error.message); }
  finally { loading(false); renderControls(); }
}
async function answerQuestion(text) {
  if (!state.consent) return;
  if (!text.trim() || text.length > 600) { status.textContent = 'Escreva uma dúvida com até 600 caracteres.'; return; }
  message('user', text); loading(true);
  try {
    await session();
    const result = await request('chat', { action: 'question', token: state.token, product: state.product, message: text });
    message('assistant', result.message);
  } catch {
    message('assistant', 'A IA está indisponível neste momento. Posso continuar com as orientações gerais e a coleta estruturada. ' + knowledge[state.product]);
  } finally { loading(false); renderControls(); }
}
function renderControls() {
  delete form.dataset.question;
  save(); form.hidden = state.mode !== 'collect'; input.value = ''; input.disabled = busy;
  if (state.mode === 'welcome') return options([['Consórcio Porto Seguro', () => start('consorcios')], ['Planos de saúde', () => start('saude')]]);
  if (state.mode === 'consent') return options([['Autorizo e quero continuar', () => { state.consent = true; state.step = 0; ask(); }], ['Entender sem informar dados', () => { message('assistant', knowledge[state.product]); renderControls(); }], ['Não autorizo', () => { reset(); message('assistant', 'Tudo bem. Nenhum pedido foi enviado. Você pode usar os canais de contato do site.'); }]]);
  if (state.mode === 'collect') {
    const f = currentField();
    if (!f) return review();
    input.placeholder = f.question;
    input.inputMode = ['credit', 'budget', 'term', 'lives', 'phone'].includes(f.key) ? 'tel' : 'text';
    options([...(f.choices || []).map(value => [value, () => accept(value)]), ['Tenho uma dúvida', showQuestion]]);
    return;
  }
  if (state.mode === 'review') return options([['Confirmar e enviar', sendRequest], ['Corrigir informações', () => options(fields(state.product, state.data).map(f => [f.label, () => { editing = f.key; state.mode = 'collect'; message('assistant', f.question); renderControls(); }]))], ['Tenho uma dúvida', showQuestion]]);
  options([['Novo atendimento', reset]]);
}
function showQuestion() {
  form.hidden = false; input.placeholder = 'Sua dúvida sobre o produto, sem dados pessoais'; input.inputMode = 'text'; input.focus();
  form.dataset.question = 'true'; options([['Voltar ao pedido', () => { delete form.dataset.question; renderControls(); }]]);
}
form.addEventListener('submit', async e => {
  e.preventDefault(); if (busy) return;
  const text = input.value.trim();
  if (form.dataset.question) { delete form.dataset.question; await answerQuestion(text); } else accept(text);
});
function open(product, preset) {
  lastFocus = document.activeElement; panel.showModal(); launcher.setAttribute('aria-expanded', 'true');
  if (product) start(product, preset); else renderControls();
  panel.querySelector('.chat-close').focus();
}
function close() { panel.close(); launcher.setAttribute('aria-expanded', 'false'); lastFocus?.focus(); }
launcher.addEventListener('click', () => open());
panel.querySelectorAll('[data-chat-close]').forEach(b => b.addEventListener('click', close));
panel.addEventListener('cancel', e => { e.preventDefault(); close(); });
panel.querySelector('[data-chat-reset]').addEventListener('click', () => {
  if (busy) return;
  options([['Apagar rascunho e reiniciar', reset], ['Continuar conversa', renderControls]]);
});
document.querySelectorAll('[data-chat-product]').forEach(link => link.addEventListener('click', e => {
  if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
  e.preventDefault(); open(link.dataset.chatProduct, link.dataset.chatPreset);
}));
for (const item of state.messages) message(item.role, item.content, false);
renderControls();
// Expire both the visible draft and browser storage while the page remains open.
setInterval(() => {
  if (!busy && state.savedAt && Date.now() - state.savedAt >= 1800000) {
    reset(); message('assistant', 'Seu rascunho foi apagado após 30 minutos sem interação. Escolha um novo atendimento.');
  }
}, 60000);
