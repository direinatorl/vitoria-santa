// Only these destinations can become links in assistant messages.
export const siteTopics = {
  location: { label: 'Ver localização', href: '/#localizacao', message: 'O endereço e o mapa ficam na seção Localização, no final da página inicial e também na página Contato. Use Como chegar para abrir a rota no mapa.' },
  insurers: { label: 'Ver operadoras', href: '/#health-insurers-title', message: 'As logos de Bradesco Saúde, Porto Saúde, SulAmérica Saúde e Amil ficam logo abaixo da localização, na página inicial. A disponibilidade de cada plano é confirmada pela equipe.' },
  contact: { label: 'Ver canais de contato', href: '/contato/', message: 'Na página Contato você encontra WhatsApp, telefone, e-mail e endereço. O botão Falar com um consultor, aqui na conversa, também abre o WhatsApp da equipe.' },
  hours: { label: 'Falar com a equipe', href: '/contato/', message: 'O site não informa um horário de atendimento. Confirme a disponibilidade diretamente com a equipe pelos canais da página Contato.' },
  health: { label: 'Ver planos de saúde', href: '/planos-de-saude/', message: 'A página Planos de saúde, no menu principal, reúne modalidades, orientações sobre rede, cobertura, carências e perguntas frequentes. Para pedir uma cotação, escolha Planos de saúde aqui no assistente.' },
  consortium: { label: 'Ver consórcios', href: '/consorcios/', message: 'A página Consórcios, no menu principal, explica opções para imóvel e carro, sorteios, lances, taxas e perguntas frequentes. Para preparar um pedido, escolha Consórcio Porto Seguro aqui no assistente.' },
  about: { label: 'Conhecer a Vitória Santa', href: '/sobre/', message: 'A página A Vitória Santa, no menu principal, apresenta a corretora e sua forma de atendimento.' },
  privacy: { label: 'Ler a política de privacidade', href: '/privacidade/', message: 'A Política de Privacidade explica o uso dos dados e fica no rodapé do site e no link Privacidade desta conversa.' },
};
export function siteHelp(text) {
  const q = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (/horario|que horas|funciona.{0,15}(sabado|domingo|feriado)/.test(q)) return 'hours';
  if (/localiza|endere[cç]o|onde (fica|ficam|estao)|como (chegar|chego)|mapa/.test(q)) return 'location';
  if (/operadora|seguradora|logotipo|\blogos?\b/.test(q) && !/cobertura|rede|carencia|pre[cç]o|valor|custa/.test(q)) return 'insurers';
  if (/contato|telefone|whatsapp|e-mail|email|falar com (a equipe|um consultor|uma pessoa|alguem|atendente)/.test(q)) return 'contact';
  if (/privacidade|meus dados|excluir.{0,20}dados/.test(q)) return 'privacy';
  if (/sobre (a |voces)|quem (sao|e a)|conhecer a corretora/.test(q)) return 'about';
  if (/onde|encontr|pagina|menu|se[cç]ao|informa[cç]oes sobre/.test(q)) {
    if (/saude|plano/.test(q)) return 'health';
    if (/consorcio|lance|sorteio/.test(q)) return 'consortium';
  }
  return null;
}

export const generalHelp = 'Posso ajudar a encontrar informações no site e esclarecer dúvidas gerais sobre planos de saúde e Consórcio Porto Seguro. Você pode continuar conversando ou escolher uma das duas opções para preparar seu pedido.';
export const sensitiveQuestion = text => /\d{4}|@|\b(cpf|cnpj|diagn[oó]stico|doen[cç]a|c[aâ]ncer|diabetes|hiv|medicamento|exame|cirurgia)\b/i.test(text);
