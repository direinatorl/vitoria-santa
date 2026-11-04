// Manual, synthetic test using the same sender and recipient as the bot.
// Never runs as part of the normal build.
import { randomUUID } from 'node:crypto';
import { sendRequestEmail, requestEmailRecipient } from '../src/request-email.js';
const id = randomUUID();
const result = await sendRequestEmail({
  _subject: 'Vitória Santa — teste do bot para Gmail — 03/11/2026',
  origem: 'https://vitoriasanta.vercel.app/',
  protocolo: id,
  resumo: 'TESTE DE INTEGRAÇÃO — dados fictícios, sem pedido comercial.\n\nCliente: TESTE Vitória Santa.\nInteresse: consórcio Porto Seguro / Porto Bank.\nLocalidade: São Paulo/SP.\nContato: não informado (teste).\n\nEsta mensagem verifica o mesmo serviço de envio usado para notificar os pedidos do bot salvos no Supabase. O recebimento deste teste isolado ainda não comprova o fluxo completo do banco até o e-mail.',
}, id);
console.log(JSON.stringify({ recipient: requestEmailRecipient, ...result }));
if (result.status !== 'accepted') process.exitCode = 1;
