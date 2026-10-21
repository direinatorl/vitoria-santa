import { company, whatsapp } from './config.js';
import { arrow, escape, icon, wa, faq, photo, steps, finalCta, header, footer } from './components.js';
import { form } from './forms.js';
import { homeFaq, consortiumFaq, healthFaq } from './content.js';
export { escape } from './components.js';

function home() {
  return `<section class="hero container">
    <div class="hero-copy"><p class="eyebrow"><span class="dot"></span> UM FUTURO MAIS TRANQUILO COMEÇA AQUI</p>
      <h1>Para seus planos.<br>Para sua vida.<br><em>Conte com a gente.</em></h1>
      <p>Consórcios para suas conquistas. Planos de saúde para cuidar de quem importa. A Vitória Santa ajuda você a escolher com clareza.</p>
      <div class="hero-actions"><a class="button" href="/consorcios">Quero um consórcio ${arrow}</a><a class="button button-outline" href="/planos-de-saude#solicitar">Quero um plano de saúde ${arrow}</a></div>
      <div class="hero-note">${icon('check')} Uma conversa próxima. Uma escolha bem orientada.</div>
    </div>
    <div class="hero-visual">${photo('cuidado', 'Pessoas abraçadas, de costas, aproveitando o pôr do sol ao ar livre', { eager: true })}
      <div class="image-caption"><span class="caption-icon">${icon('heart')}</span><div>O seu futuro é feito<br><strong>de quem está com você.</strong></div></div>
      <div class="visual-index"><span>01 — CONQUISTAR</span><span>02 — CUIDAR</span></div>
    </div>
  </section>
  <div class="trust-strip"><div class="container"><span>Segurança para dar o próximo passo.</span><span>${icon('check')} Atendimento personalizado</span><span>${icon('check')} Orientação na escolha</span><span>${icon('check')} Suporte pós-venda</span></div></div>
  <section class="section container" id="solucoes"><div class="section-heading">
    <div><p class="eyebrow">O QUE VOCÊ QUER PLANEJAR?</p><h2>Duas soluções.<br>O mesmo cuidado com você.</h2></div><p>Da conquista de um bem ao cuidado com a saúde,<br>entenda suas possibilidades com a gente.</p></div>
    <div class="service-grid">
      <a class="service-card" href="/consorcios"><div class="service-card-image"><img src="/assets/casa.jpg" alt="Casa contemporânea com jardim, ilustrando a aquisição planejada de um imóvel" width="1400" height="933" loading="lazy"><span class="service-icon">${icon('home')}</span></div>
        <div class="service-card-copy"><p class="eyebrow">01 / CONQUISTAR</p><h3>Consórcios</h3><p>Um caminho de planejamento para o imóvel ou o veículo que faz parte dos seus planos.</p><div class="card-link"><span>Conhecer opções de consórcio</span>${arrow}</div></div></a>
      <a class="service-card health-card" href="/planos-de-saude"><div class="service-card-image"><img src="/assets/cuidado.jpg" alt="Grupo de pessoas abraçadas ao ar livre, ilustrando cuidado e bem-estar" width="1400" height="933" loading="lazy"><span class="service-icon">${icon('heart')}</span></div>
        <div class="service-card-copy"><p class="eyebrow">02 / CUIDAR</p><h3>Planos de saúde</h3><p>Orientação para consultar alternativas para você, sua família ou sua empresa.</p><div class="card-link"><span>Solicitar uma cotação de saúde</span>${arrow}</div></div></a>
    </div><p class="small section-footnote">Disponibilidade e condições de contratação são verificadas no atendimento.</p>
  </section>
  <section class="about-band"><div class="container about-grid"><div><p class="eyebrow">A VITÓRIA SANTA</p><h2>O primeiro passo<br>é entender <em>você.</em></h2></div><div><p>Cada pessoa tem um momento, uma prioridade e um jeito de planejar o futuro. Por isso, nosso atendimento começa ouvindo o que faz sentido para a sua vida.</p><p>Orientação na escolha e atenção no pós-venda fazem parte do compromisso da Vitória Santa com seus clientes.</p><a class="text-link" href="/sobre">Conheça nossa corretora ${arrow}</a></div></div></section>
  ${steps()}
  <section class="section container faq-layout"><div><p class="eyebrow">INFORMAÇÃO TRAZ TRANQUILIDADE</p><h2>Podemos esclarecer?</h2><p>Respostas para começar<br>a conversa com mais confiança.</p><a class="text-link" href="/contato">Fale com a equipe ${arrow}</a></div>${faq(homeFaq)}</section>
  ${finalCta()}`;
}

function servicePage(service) {
  const health = service === 'saude';
  const choices = health
    ? [['individual-familiar', 'Você e sua família', 'Conte onde você mora e o que prioriza para consultar alternativas individuais ou familiares.'], ['empresarial', 'Sua empresa', 'Conheça possibilidades de contratação empresarial de acordo com o perfil e a elegibilidade.']]
    : [['imovel', 'Seu próximo endereço', 'Planeje a aquisição de um imóvel e conheça as regras de utilização da carta de crédito.'], ['veiculo', 'Novos caminhos', 'Organize a aquisição do veículo considerando o valor do crédito, o prazo e seu orçamento.']];
  const compare = health
    ? [['Rede e abrangência', 'Confira hospitais, laboratórios e regiões de atendimento do produto específico.'], ['Cobertura e carências', 'Entenda o que está previsto no contrato e os prazos aplicáveis.'], ['Custos e acomodação', 'Compare mensalidade, coparticipação e tipo de acomodação.']]
    : [['Crédito e orçamento', 'Avalie o valor pretendido e o compromisso das parcelas ao longo do tempo.'], ['Regras de contemplação', 'Conheça os sorteios, os lances e as exigências para utilização do crédito.'], ['Taxas e reajustes', 'Compare administração, fundo de reserva e outros custos previstos no contrato.']];
  return `<section class="container service-hero">
    <div><p class="eyebrow"><a href="/">INÍCIO</a> / ${health ? 'PLANOS DE SAÚDE' : 'CONSÓRCIOS'}</p>
      <h1>${health ? 'Cuidado para hoje.<br><em>Tranquilidade<br>para o amanhã.</em>' : 'Suas conquistas<br>começam com<br><em>um bom plano.</em>'}</h1>
      <p>${health ? 'Entenda as opções de planos de saúde e encontre orientação para cuidar de você, da sua família ou da sua empresa.' : 'Imóveis e veículos: conheça o consórcio como alternativa para planejar a aquisição de um bem com orientação em cada etapa.'}</p>
      <a class="button" href="#solicitar">${health ? 'Solicitar uma cotação' : 'Quero conhecer as opções'} ${arrow}</a>
      <a class="text-link secondary-link" href="${whatsapp(service)}" target="_blank" rel="noopener noreferrer">Prefiro falar no WhatsApp ↗</a>
    </div>
    <div class="service-visual">${photo(health ? 'cuidado' : 'casa', health ? 'Pessoas abraçadas em um momento ao ar livre' : 'Casa contemporânea com jardim e iluminação acolhedora', { eager: true })}<div class="service-visual-label">${icon(health ? 'heart' : 'home')}<span>${health ? 'Cuidado em cada escolha.' : 'Planejamento para conquistar.'}</span></div></div>
  </section>
  <section class="section container choice-section"><div class="section-heading"><div><p class="eyebrow">${health ? 'PARA DIFERENTES MOMENTOS' : 'QUAL É A SUA PRÓXIMA CONQUISTA?'}</p><h2>${health ? 'O cuidado começa<br>pelo que você precisa.' : 'Um objetivo seu.<br>Uma escolha bem orientada.'}</h2></div><p>${health ? 'Modalidades e disponibilidade serão verificadas<br>de acordo com sua região e perfil.' : 'Você escolhe o objetivo. Nós ajudamos<br>a entender as condições do consórcio.'}</p></div>
    <div class="choice-grid">${choices.map(([value, title, text], index) => `<article><span class="choice-number">0${index + 1}</span><h3>${title}</h3><p>${text}</p><a class="text-link" href="#solicitar" data-prefill-field="${health ? 'plan' : 'asset'}" data-prefill-value="${value}">${health ? 'Consultar possibilidades' : 'Tenho interesse'} ${arrow}</a></article>`).join('')}</div>
  </section>
  <section class="comparison-band"><div class="container service-detail"><div><p class="eyebrow">ENTENDA ANTES DE DECIDIR</p><h2>${health ? 'A diferença está<br>nos detalhes.' : 'Como funciona<br>o consórcio?'}</h2><p>${health ? 'Uma boa escolha considera mais do que a mensalidade. Compare as informações do produto específico antes de contratar.' : 'Pessoas de um grupo contribuem para um fundo comum, gerenciado por uma administradora. A contemplação possibilita usar a carta de crédito, conforme as condições contratuais.'}</p><div class="notice">${health ? 'Não há garantia de operadora, rede ou carência nesta página. As condições são confirmadas na proposta e no contrato.' : 'A contemplação ocorre por sorteio ou lance, conforme as regras e os recursos do grupo. Não há promessa de data ou de contemplação imediata.'}</div></div>
    <div class="info-list">${compare.map(([title, text], i) => `<article><span>0${i + 1}</span><div><h3>${title}</h3><p>${text}</p></div></article>`).join('')}</div></div></section>
  <section class="section container faq-layout"><div><p class="eyebrow">PERGUNTAS FREQUENTES</p><h2>Mais clareza.<br>Uma decisão melhor.</h2><p>Condições específicas são verificadas<br>durante o atendimento.</p></div>${faq(health ? healthFaq : consortiumFaq)}</section>
  ${form(service)}`;
}

function about() {
  return `<section class="container service-hero about-hero"><div><p class="eyebrow">A VITÓRIA SANTA</p><h1>Uma relação<br>de confiança.<br><em>Do seu jeito.</em></h1><p>Entender suas necessidades e orientar sua escolha: é assim que a Vitória Santa Corretora cuida de cada atendimento.</p><a class="button" href="/contato">Vamos conversar ${arrow}</a></div>
    <div class="about-statement"><span class="statement-mark" aria-hidden="true">“</span><h2>Antes de apresentar<br>uma solução,<br>queremos conhecer<br>os seus planos.</h2><p>VITÓRIA SANTA CORRETORA</p></div>
  </section>
  <section class="section container company-story"><p class="eyebrow">ATENÇÃO AO QUE IMPORTA</p><div><h2>Presença na escolha.<br>Cuidado depois dela.</h2><p>O compromisso da Vitória Santa com o atendimento inclui conhecer as necessidades de cada cliente e orientar soluções adequadas ao seu momento, com suporte pós-venda.<br><br>Neste site, reunimos dois caminhos para essa conversa: consórcios e planos de saúde. Você recebe informações para compreender as alternativas e avaliar as condições antes de decidir.</p></div></section>
  ${steps()}${finalCta()}`;
}

function contact() {
  return `<section class="container page-hero contact-hero"><p class="eyebrow">CONTATO</p><h1>Seus planos merecem<br><em>uma boa conversa.</em></h1><p>Escolha como prefere falar com a Vitória Santa.<br>Estamos aqui para entender o seu próximo passo.</p></section>
    <section class="container contact-grid" aria-label="Canais de atendimento">
      <article><span class="contact-symbol">${icon('whatsapp')}</span><p class="eyebrow">ATENDIMENTO DIRETO</p><h2>Fale com a gente</h2><a class="contact-primary" href="${whatsapp()}" target="_blank" rel="noopener noreferrer">${company.whatsappLabel} ${arrow}</a><p>WhatsApp</p><a href="tel:${company.phoneHref}">Telefone: ${company.phone}</a></article>
      <article><span class="contact-symbol">@</span><p class="eyebrow">POR E-MAIL</p><h2>Escreva para nós</h2><a class="contact-email" href="mailto:${company.email}">${company.email} ${arrow}</a><p>Ou envie sua solicitação<br>pelo formulário abaixo.</p></article>
      <article><span class="contact-symbol">${icon('home')}</span><p class="eyebrow">SÃO PAULO / SP</p><h2>Onde estamos</h2><p>${company.address}</p><a class="text-link" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(company.address)}" target="_blank" rel="noopener noreferrer">Ver no mapa ${arrow}</a><p class="small">Confirme a disponibilidade antes de uma visita.</p></article>
    </section>${form('contato')}`;
}

function privacy() {
  const paragraphs = [
    ['Quem recebe seus dados', `A Vitória Santa Corretora recebe as solicitações enviadas neste site. Para informações e pedidos relativos a dados pessoais, escreva para <a href="mailto:${company.email}">${company.email}</a>.`],
    ['Dados e finalidade', 'Coletamos nome, telefone e, se informado, e-mail, além das informações de interesse comercial e da mensagem. Usamos esses dados para responder ao pedido e orientar sobre o serviço escolhido, mediante o consentimento solicitado no formulário. Não solicitamos dados médicos, documentos ou diagnósticos.'],
    ['Armazenamento e acesso', 'Os pedidos são registrados no banco privado da aplicação, com data e versão do consentimento. O acesso deve ser restrito à equipe responsável e aos prestadores necessários à hospedagem. Esta versão não envia dados automaticamente a operadoras, administradoras ou sistemas de marketing. Qualquer encaminhamento necessário a uma proposta deve ser informado durante o atendimento.'],
    ['Conservação e seus direitos', 'Os dados devem ser mantidos somente pelo período necessário ao atendimento ou ao cumprimento de obrigação legal. Você pode solicitar confirmação do tratamento, acesso, correção, informações sobre compartilhamento, revogação do consentimento e eliminação, observadas as hipóteses legais de conservação, pelo e-mail acima.'],
    ['Cookies e serviços externos', 'Este site não utiliza cookies de publicidade, rastreadores ou analytics. Os controles de abuso usam temporariamente o endereço IP em memória por até 15 minutos. Ao acessar WhatsApp, mapas ou redes sociais pelos links, você usa serviços externos com políticas próprias. Imagens e estilos são servidos localmente.'],
    ['Segurança', 'Aplicamos validação de dados e controles de envio. O ambiente de produção deve utilizar HTTPS, acesso restrito ao banco e cópias de segurança protegidas. Não envie informações sensíveis no campo de mensagem.'],
  ];
  return `<article class="container legal section"><p class="eyebrow">TRANSPARÊNCIA</p><h1>Política de Privacidade</h1><p class="small">Versão de 21 de outubro de 2026.</p>${paragraphs.map(([title, text]) => `<h2>${title}</h2><p>${text}</p>`).join('')}<a class="text-link" href="/contato">Entrar em contato ${arrow}</a></article>`;
}

export const routes = Object.assign(Object.create(null), {
  '/': { title: 'Consórcios e planos de saúde', description: 'Consórcios para suas conquistas e planos de saúde para cuidar de quem importa. Conte com a orientação da Vitória Santa Corretora.', render: home },
  '/consorcios': { title: 'Consórcios de imóveis e veículos', description: 'Entenda o consórcio, os sorteios, lances e custos. Solicite orientação para planejar sua aquisição com a Vitória Santa.', image: 'casa', render: () => servicePage('consorcios') },
  '/planos-de-saude': { title: 'Planos de saúde para você e sua empresa', description: 'Consulte opções de planos de saúde para você, sua família e sua empresa. Entenda rede, cobertura e condições com a Vitória Santa.', render: () => servicePage('saude') },
  '/sobre': { title: 'Conheça a Vitória Santa Corretora', description: 'Atendimento personalizado, orientação na escolha e suporte pós-venda. Conheça a proposta da Vitória Santa Corretora.', render: about },
  '/contato': { title: 'Contato e atendimento', description: 'Fale com a Vitória Santa por WhatsApp, telefone, e-mail ou formulário. Atendimento para consórcios e planos de saúde em São Paulo.', render: contact },
  '/privacidade': { title: 'Política de Privacidade', description: 'Saiba como os dados de contato são tratados no site da Vitória Santa.', render: privacy },
});

export function renderPage(path, siteUrl) {
  const exists = Object.hasOwn(routes, path);
  const page = exists ? routes[path] : { title: 'Página não encontrada', description: 'Esta página não foi encontrada.', render: () => `<section class="container page-hero error-page"><p class="eyebrow">ERRO 404</p><h1>Vamos voltar<br><em>ao caminho certo?</em></h1><p>A página que você procura não está disponível.</p><a class="button" href="/">Ir para a página inicial ${arrow}</a></section>` };
  const service = path === '/consorcios' ? 'consorcios' : path === '/planos-de-saude' ? 'saude' : 'contato';
  const canonical = escape(siteUrl + (exists ? path : '/'));
  return `<!doctype html><html lang="pt-BR"><head>
    <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${escape(page.title)} | Vitória Santa</title><meta name="description" content="${escape(page.description)}">
    <meta property="og:title" content="${escape(page.title)} | Vitória Santa"><meta property="og:description" content="${escape(page.description)}">
    <meta property="og:type" content="website"><meta property="og:locale" content="pt_BR"><meta property="og:url" content="${canonical}">
    <meta property="og:image" content="${escape(siteUrl)}/assets/${page.image || 'cuidado'}.jpg"><meta property="og:image:alt" content="${page.image === 'casa' ? 'Casa ilustrando aquisição planejada' : 'Pessoas reunidas ao ar livre'}">
    <meta name="theme-color" content="#234b3b"><link rel="canonical" href="${canonical}">${exists ? '' : '<meta name="robots" content="noindex">'}
    <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/styles.css"><script src="/app.js" defer></script>
    </head><body>${header(path)}<main id="conteudo">${page.render()}</main>${footer(service)}</body></html>`;
}
