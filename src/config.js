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
  mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d26834.21283629751!2d-46.52641652785854!3d-23.53736733558598!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce60c8651efc8f%3A0xc6e977cd02c222ba!2sRua%20Wadih%20Hatti%2C%20285%20-%20Vila%20R%C3%A9%2C%20S%C3%A3o%20Paulo%20-%20SP%2C%2003666-010!5e0!3m2!1spt-BR!2sbr!4v1730800201845!5m2!1spt-BR!2sbr',
};
export function whatsapp(service = 'contato') {
  const messages = {
    consorcios: 'Olá! Tenho interesse em conhecer as opções de consórcio da Vitória Santa.',
    saude: 'Olá! Gostaria de orientação e uma cotação de plano de saúde com a Vitória Santa.',
    contato: 'Olá! Gostaria de atendimento da Vitória Santa.',
  };
  return `https://wa.me/${company.whatsapp}?text=${encodeURIComponent(messages[service] || messages.contato)}`;
}
