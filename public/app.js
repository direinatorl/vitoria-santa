const toggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() { navigation.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', 'Abrir menu'); }
toggle?.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') !== 'true';
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  navigation.classList.toggle('is-open', open);
});
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') { closeMenu(); toggle.focus(); } });
navigation?.addEventListener('click', (event) => { if (event.target.closest('a')) closeMenu(); });
for (const form of document.querySelectorAll('.lead-form')) {
  let requestId = crypto.randomUUID();
  let lastPayload = '';
  let busy = false;
  const status = form.querySelector('.form-status');
  const phone = form.elements.namedItem('phone');
  function validatePhone() {
    phone.setCustomValidity(/^(?:55)?[1-9]{2}\d{8,9}$/.test(phone.value.replace(/\D/g, '')) ? '' : 'Informe um telefone válido com DDD.');
  }
  phone.addEventListener('input', validatePhone);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    validatePhone();
    if (busy || !form.reportValidity()) return;
    form.querySelectorAll('[data-error]').forEach(el => { el.textContent = ''; });
    form.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
    const data = Object.fromEntries(new FormData(form));
    data.service = form.dataset.service;
    data.consent = data.consent === 'on';
    const payload = JSON.stringify(data);
    if (lastPayload && payload !== lastPayload) requestId = crypto.randomUUID();
    lastPayload = payload;
    data.requestId = requestId;
    const button = form.querySelector('[type=submit]');
    const original = button.innerHTML;
    busy = true; button.disabled = true; form.setAttribute('aria-busy', 'true');
    status.dataset.state = 'loading'; status.textContent = 'Registrando sua solicitação…';
    button.textContent = 'Enviando…';
    try {
      const response = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), signal: AbortSignal.timeout(15000) });
      const result = await response.json();
      if (!response.ok) {
        for (const [name, error] of Object.entries(result.errors || {})) {
          const hint = form.querySelector(`[data-error="${name}"]`);
          if (hint) hint.textContent = error;
          const input = form.elements.namedItem(name);
          if (input) { input.setAttribute('aria-invalid', 'true'); if (hint) { hint.id = `error-${name}`; input.setAttribute('aria-describedby', hint.id); } }
        }
        throw new Error(result.message || 'Não foi possível enviar. Tente novamente ou fale pelo WhatsApp.');
      }
      status.dataset.state = 'success';
      status.textContent = `Solicitação registrada. Protocolo ${result.id}. Para atendimento direto, utilize o WhatsApp.`;
      form.reset(); phone.setCustomValidity(''); requestId = crypto.randomUUID(); lastPayload = '';
    } catch (error) {
      status.dataset.state = 'error';
      status.textContent = error.name === 'TimeoutError' || error.name === 'TypeError' ? 'Não conseguimos confirmar o envio. Tente novamente; seu pedido não será duplicado. Você também pode usar o WhatsApp.' : error.message;
    } finally {
      busy = false; button.disabled = false; button.innerHTML = original; form.removeAttribute('aria-busy'); status.focus();
    }
  });
}
