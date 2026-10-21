import { company, whatsapp } from './config.js';

export const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const arrow = '<span aria-hidden="true">↗</span>';
export const navigation = [['/', 'Início'], ['/consorcios', 'Consórcios'], ['/planos-de-saude', 'Planos de saúde'], ['/sobre', 'A Vitória Santa'], ['/contato', 'Contato']];

export function icon(type) {
  const paths = {
    home: '<path d="M3 15 16 4l13 11M7 12v16h18V12M13 28V18h6v10"/>',
    heart: '<path d="M16 27S3 19 3 10a7 7 0 0 1 13-3 7 7 0 0 1 13 3c0 9-13 17-13 17Z"/><path d="M7 15h6l3-5 3 10 2-5h4"/>',
    check: '<path d="m6 17 6 6L27 8"/>',
    whatsapp: '<path d="M27 15a12 12 0 0 1-18 11l-6 3 2-7a12 12 0 1 1 22-7Z"/><path d="M11 9c-4 5 6 15 11 11l-4-4-2 2-3-3 2-2Z"/>',
  };
  return `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[type] || paths.check}</svg>`;
}

export function wa(service = 'contato', label = 'Conversar no WhatsApp', extraClass = '') {
  return `<a class="button ${extraClass}" href="${whatsapp(service)}" target="_blank" rel="noopener noreferrer">${icon('whatsapp')}${label}${arrow}</a>`;
}

export function faq(items) {
  return `<div class="faq">${items.map(([question, answer]) => `<details>
    <summary>${question}<span aria-hidden="true">+</span></summary><p>${answer}</p>
  </details>`).join('')}</div>`;
}

export function photo(file, alt, { eager = false, caption = '' } = {}) {
  return `<figure class="editorial-photo"><img src="/assets/${file}.jpg" alt="${escape(alt)}" width="1400" height="933" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'}>
    <figcaption>${caption || 'Imagem ilustrativa'}</figcaption></figure>`;
}

export function steps() {
  const items = [
    ['01', 'A conversa', 'Você conta seu momento, suas necessidades e o que quer planejar.'],
    ['02', 'A orientação', 'Entenda as alternativas e compare condições com atenção aos detalhes.'],
    ['03', 'A escolha', 'Decida com informação e conte com orientação na contratação.'],
  ];
  return `<section class="section container"><div class="section-heading">
    <div><p class="eyebrow">COM VOCÊ EM CADA ETAPA</p><h2>O próximo passo fica mais fácil<br>quando a gente conversa.</h2></div>
    <p>Atendimento personalizado,<br>da primeira dúvida à contratação.</p></div>
    <div class="steps">${items.map(([number, title, text]) => `<article><span class="step-number">${number}</span><h3>${title}</h3><p>${text}</p></article>`).join('')}</div>
  </section>`;
}

export function finalCta() {
  return `<section class="container final-cta"><div><p class="eyebrow">SEUS PLANOS, NOSSA ATENÇÃO</p><h2>Vamos encontrar o seu próximo passo?</h2><p>Converse com a Vitória Santa e conte o que você procura.</p></div>${wa()}</section>`;
}

export function header(path) {
  return `<a class="skip-link" href="#conteudo">Pular para o conteúdo</a>
    <div class="topbar"><div class="container"><span>Planejar o futuro. Cuidar do presente.</span><a href="tel:${company.phoneHref}">Fale com a Vitória Santa · ${company.phone}</a></div></div>
    <header class="header"><div class="container header-inner">
      <a class="brand" href="/" aria-label="Vitória Santa — início"><img src="/assets/logo.jpg" alt="Vitória Santa Seguros Corretora" width="200" height="100"></a>
      <button class="menu-toggle" aria-controls="navigation" aria-expanded="false" aria-label="Abrir menu"><span></span><span></span><span></span></button>
      <nav id="navigation" aria-label="Navegação principal">${navigation.map(([href, label]) => `<a href="${href}"${href === path ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</nav>
      <a class="button header-cta" href="/contato#solicitar">Solicitar atendimento ${arrow}</a>
    </div></header>`;
}

export function footer(service) {
  return `<footer><div class="container footer-grid">
    <div><a class="footer-brand" href="/">Vitória Santa<span>CORRETORA DE SEGUROS</span></a><p>Planejamento para suas conquistas.<br>Cuidado com o seu futuro.</p></div>
    <div><h2>Explore</h2>${navigation.map(([href, label]) => `<a href="${href}">${label}</a>`).join('')}</div>
    <div><h2>Vamos conversar</h2><a href="tel:${company.phoneHref}">${company.phone}</a><a href="${whatsapp()}">WhatsApp ${company.whatsappLabel}</a><a href="mailto:${company.email}">${company.email}</a><p>${company.address}</p></div>
    <div><h2>Acompanhe</h2><a href="https://www.instagram.com/segurosvitoriasanta" target="_blank" rel="noopener noreferrer">Instagram ↗</a><a href="https://www.facebook.com/vitoriasantacorretoraseguros" target="_blank" rel="noopener noreferrer">Facebook ↗</a><a href="/privacidade">Política de Privacidade</a></div>
    </div><div class="container footer-bottom"><span>© ${new Date().getFullYear()} Vitória Santa Corretora.</span><span>Consórcios e planos de saúde · São Paulo</span></div></footer>
    <a class="floating-wa" href="${whatsapp(service)}" target="_blank" rel="noopener noreferrer" aria-label="Conversar com a Vitória Santa no WhatsApp">${icon('whatsapp')}<span>Fale com a gente</span></a>`;
}
