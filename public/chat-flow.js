// Shared deterministic contract: browser and backend use the same allowed fields.
export const consentVersion = 'chat-2026-10-26';
export const states = 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ');
const field = (key, label, question, choices, optional = false) => ({ key, label, question, choices, optional });
export function fields(product, data = {}) {
  const contact = [field('name', 'Nome', 'Qual é o nome do responsável pelo contato?'), field('phone', 'WhatsApp', 'Qual é seu WhatsApp com DDD?')];
  const location = [field('city', 'Cidade', 'Em qual cidade você mora?'), field('state', 'Estado', 'Qual é a sigla do seu estado? Por exemplo: SP.')];
  if (product === 'consorcios') return [
    field('asset', 'Bem', 'Qual bem você deseja adquirir?', ['Imóvel', 'Carro']),
    field('credit', 'Crédito desejado', 'Qual o valor aproximado da carta de crédito, em reais?'),
    field('budget', 'Parcela desejada', 'Qual valor mensal cabe no seu orçamento, em reais?'),
    field('term', 'Prazo desejado', 'Em quantos meses você gostaria de pagar? É uma preferência, sujeita à disponibilidade.', ['Ainda não sei'], true),
    field('bid', 'Interesse em lance', 'Você tem interesse em ofertar um lance?', ['Sim', 'Não', 'Ainda não sei'], true), ...contact, ...location,
  ];
  if (product !== 'saude') return [];
  return [field('plan', 'Modalidade', 'Qual modalidade você procura?', ['Individual', 'Familiar', 'Empresarial']), ...location,
    field('lives', 'Beneficiários', 'Quantas pessoas estarão no plano?'),
    field('ages', 'Idades', 'Informe a idade de cada beneficiário, separada por vírgulas. Não informe nomes, documentos ou dados médicos.'),
    field('accommodation', 'Acomodação', 'Qual sua preferência de acomodação?', ['Enfermaria', 'Apartamento', 'Sem preferência']),
    field('copay', 'Coparticipação', 'Você considera pagar uma parte dos serviços utilizados?', ['Com coparticipação', 'Sem coparticipação', 'Quero orientação']),
    field('coverage', 'Abrangência', 'Qual abrangência de atendimento você procura?', ['Regional', 'Nacional', 'Quero orientação']),
    field('budget', 'Orçamento mensal', 'Qual seu orçamento mensal aproximado, em reais? Se preferir, pule esta pergunta.', ['Pular'], true),
    ...(data.plan === 'Empresarial' ? [field('company', 'Empresa', 'Qual é o nome da empresa? Não precisamos de CNPJ nesta etapa.')] : []), ...contact];
}
export function validateField(f, input, data = {}) {
  const value = String(input ?? '').trim();
  if (f.optional && ['Pular', 'Ainda não sei'].includes(value)) return { value };
  if (!value || value.length > 100 || /[<>\x00-\x1f]/.test(value)) return { error: 'Informe uma resposta válida, com até 100 caracteres.' };
  if (f.choices && !f.choices.includes(value) && f.key !== 'budget' && f.key !== 'term') return { error: 'Selecione uma das opções apresentadas.' };
  if (f.key === 'state' && !states.includes(value.toUpperCase())) return { error: 'Informe uma UF brasileira válida, como SP.' };
  if (f.key === 'phone' && (!/^[\d()+.\s-]+$/.test(value) || !/^(?:55)?[1-9]{2}\d{8,9}$/.test(value.replace(/\D/g, '')))) return { error: 'Informe um telefone válido com DDD.' };
  if (['name', 'city', 'company'].includes(f.key) && (!/[\p{L}]{2}/u.test(value) || /\d{5}/.test(value))) return { error: 'Informe apenas o nome solicitado, sem documentos ou dados médicos.' };
  if (['credit', 'budget'].includes(f.key)) {
    if (!/^\d{1,9}(?:[.,]\d{1,3}){0,3}$/.test(value)) return { error: 'Informe somente o valor em reais, por exemplo 1500 ou 1.500,00.' };
    const numeric = Number(value.includes(',') ? value.replaceAll('.', '').replace(',', '.') : /^\d{1,3}(\.\d{3})+$/.test(value) ? value.replaceAll('.', '') : value);
    if (!(numeric > 0 && numeric <= 100000000)) return { error: 'Informe um valor maior que zero e até 100 milhões.' };
    return { value: String(numeric) };
  }
  if (['lives', 'term'].includes(f.key) && (!/^\d{1,3}$/.test(value) || +value < 1 || +value > (f.key === 'lives' ? 100 : 360))) return { error: f.key === 'lives' ? 'Informe entre 1 e 100 beneficiários. Para grupos maiores, fale com a equipe.' : 'Informe um prazo entre 1 e 360 meses ou escolha Ainda não sei.' };
  if (f.key === 'ages') {
    const ages = value.split(',').map(s => s.trim());
    if (ages.length !== Number(data.lives) || ages.some(s => !/^\d{1,3}$/.test(s) || +s > 120)) return { error: `Informe exatamente ${data.lives} idades entre 0 e 120, separadas por vírgulas.` };
  }
  return { value: f.key === 'state' ? value.toUpperCase() : value };
}
export function validateRequest(raw) {
  if (!raw || !['consorcios', 'saude'].includes(raw.product) || !raw.data || typeof raw.data !== 'object' || Array.isArray(raw.data)) throw new Error('Solicitação inválida.');
  if (raw.consent !== true || raw.consentVersion !== consentVersion) throw new Error('Confirme o consentimento atualizado.');
  const data = {};
  for (const f of fields(raw.product, raw.data)) {
    const result = validateField(f, raw.data[f.key], data);
    if (result.error) throw new Error(`${f.label}: ${result.error}`);
    data[f.key] = result.value;
  }
  return { product: raw.product, data };
}
export const knowledge = {
  consorcios: 'Trabalhamos neste atendimento exclusivamente com Consórcio Porto Seguro / Porto Bank. A carta de crédito é o valor contratado para adquirir o bem após a contemplação e a análise prevista no contrato. O grupo contribui por parcelas. A contemplação ocorre por sorteio ou lance, conforme regras e recursos do grupo; não há garantia de contemplação imediata ou em data escolhida neste atendimento. Lance é uma oferta para concorrer à contemplação. Existem taxa de administração, reajustes e possíveis fundo de reserva e seguros conforme contrato. Sem uma tabela oficial vigente, não calculamos preços nem prometemos condições. Após coletar seu objetivo e orçamento, um consultor confirma a disponibilidade, apresenta a proposta e esclarece contrato e documentação antes da contratação.',
  saude: 'Planos individuais, familiares e empresariais têm critérios de contratação e disponibilidade que precisam ser confirmados. A acomodação pode ser enfermaria ou apartamento. Coparticipação é a participação no custo de serviços utilizados, conforme contrato. Abrangência é a região de atendimento. Rede, cobertura, carências, elegibilidade e preço dependem do produto e da proposta oficial. Não confirmamos parceria com operadoras sem validação da Vitória Santa. A equipe consulta a disponibilidade na sua região. Não informe CPF, CNPJ, documentos, diagnósticos ou histórico médico neste atendimento.',
};
