// Contatos encontrados em https://www.vitoriasanta.com.br em 21/10/2026.
// Confirmar titularidade e disponibilidade com a empresa antes de publicar.
export const company = {
  name: 'Vitória Santa',
  phone: '(11) 2957-8551',
  phoneHref: '+551129578551',
  whatsapp: '5511999747932',
  whatsappLabel: '(11) 99974-7932',
  email: 'atendimento@vitoriasanta.com.br',
  address: 'Rua Wadih Hatti, 285 anexo - 405, Vila Ré, São Paulo - SP, CEP 03666-010',
};
export function whatsapp(service = 'contato') {
  const messages = {
    consorcios: 'Olá! Tenho interesse em conhecer as opções de consórcio da Vitória Santa.',
    saude: 'Olá! Gostaria de orientação e uma cotação de plano de saúde com a Vitória Santa.',
    contato: 'Olá! Gostaria de atendimento da Vitória Santa.',
  };
  return `https://wa.me/${company.whatsapp}?text=${encodeURIComponent(messages[service] || messages.contato)}`;
}
