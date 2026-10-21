import { arrow, icon, wa } from './components.js';

function field(name, label, attributes = '') {
  return `<div class="field"><label for="${name}">${label}</label><input name="${name}" id="${name}" ${attributes} aria-describedby="error-${name}"><span id="error-${name}" class="field-error" data-error="${name}"></span></div>`;
}

function select(name, label, items) {
  return `<div class="field"><label for="${name}">${label}</label><select name="${name}" id="${name}" required aria-describedby="error-${name}"><option value="">Selecione</option>${items.map(([value, text]) => `<option value="${value}">${text}</option>`).join('')}</select><span id="error-${name}" class="field-error" data-error="${name}"></span></div>`;
}

export function form(service) {
  const title = service === 'consorcios' ? 'Conte o que você quer conquistar' : service === 'saude' ? 'Vamos falar sobre o seu plano' : 'Como podemos ajudar você?';
  return `<section class="section form-section" id="solicitar"><div class="container form-layout">
    <div class="form-intro"><p class="eyebrow">UM BOM COMEÇO É UMA CONVERSA</p><h2>Vamos cuidar<br>do seu próximo passo.</h2>
      <p>Preencha os dados para iniciar seu atendimento. Sem compromisso de contratação.</p>
      <ul class="check-list"><li>${icon('check')}Orientação de acordo com seu interesse</li><li>${icon('check')}Dados usados para responder ao pedido</li><li>${icon('check')}Clareza antes de qualquer contratação</li></ul>
      <div class="form-direct"><p>Prefere conversar diretamente?</p>${wa(service, 'Falar pelo WhatsApp', 'button-outline')}<p class="small">Não envie documentos, diagnósticos ou dados médicos.</p></div>
    </div>
    <form class="lead-form" data-service="${service}" action="/api/leads" method="post" novalidate>
      <p class="eyebrow">${service === 'consorcios' ? 'CONSÓRCIOS' : service === 'saude' ? 'PLANOS DE SAÚDE' : 'CONTATO'}</p><h3>${title}</h3><p class="small">Campos com * são obrigatórios.</p>
      <noscript><p>Ative o JavaScript para enviar ou utilize os contatos desta página.</p></noscript>
      <div class="form-grid">
        ${field('name', 'Seu nome *', 'autocomplete="name" required minlength="2" maxlength="100" placeholder="Como podemos chamar você?"')}
        ${field('phone', 'WhatsApp com DDD *', 'type="tel" autocomplete="tel" inputmode="tel" required maxlength="20" placeholder="(11) 99999-9999"')}
        ${field('email', 'E-mail (opcional)', 'type="email" autocomplete="email" maxlength="180" placeholder="voce@exemplo.com.br"')}
        ${service === 'consorcios' ? select('asset', 'O que você quer conquistar? *', [['imovel', 'Imóvel'], ['veiculo', 'Veículo']]) + field('credit', 'Crédito de interesse (opcional)', 'maxlength="80" placeholder="Informe uma faixa de valor"') : ''}
        ${service === 'saude' ? field('city', 'Cidade *', 'required minlength="2" maxlength="100" autocomplete="address-level2" placeholder="Sua cidade"') + select('state', 'Estado *', 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ').map(value => [value, value])) + select('plan', 'Modalidade de interesse *', [['individual-familiar', 'Individual / familiar'], ['empresarial', 'Empresarial']]) + field('beneficiaries', 'Beneficiários (opcional)', 'type="number" min="1" max="99999" step="1" inputmode="numeric" placeholder="Quantidade de pessoas"') : ''}
        <div class="field full"><label for="message">Sua mensagem (opcional)</label><textarea name="message" id="message" rows="3" maxlength="1000" aria-describedby="error-message" placeholder="Conte o que você procura, sem dados sensíveis."></textarea><span id="error-message" class="field-error" data-error="message"></span></div>
      </div>
      <div class="honeypot" aria-hidden="true"><label>Website<input name="website" tabindex="-1" autocomplete="off"></label></div>
      <div class="consent"><input type="checkbox" id="consent" name="consent" required aria-describedby="error-consent"><label for="consent">Autorizo o uso dos meus dados para responder a este pedido e li a <a href="/privacidade" target="_blank" rel="noopener noreferrer">Política de Privacidade</a>. *</label></div>
      <span id="error-consent" class="field-error" data-error="consent"></span>
      <button class="button" type="submit">Enviar solicitação ${arrow}</button>
      <div class="form-status" role="status" aria-live="polite" tabindex="-1"></div>
      <p class="small form-disclaimer">O envio não representa contratação nem garante condições comerciais.</p>
    </form>
  </div></section>`;
}
