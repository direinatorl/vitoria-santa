import { whatsapp } from './config.js';
export function chatWidget() {
  return `<button id="chat-launcher" class="chat-launcher" aria-haspopup="dialog" aria-controls="vs-chat" aria-expanded="false"><span aria-hidden="true">✦</span> Assistente virtual</button>
  <dialog id="vs-chat" aria-labelledby="chat-title">
    <div class="chat-heading"><div><span class="chat-eyebrow">VITÓRIA SANTA · ATENDIMENTO</span><h2 id="chat-title">Assistente Virtual Vitória Santa</h2></div><button type="button" data-chat-close aria-label="Minimizar conversa">−</button><button type="button" class="chat-close" data-chat-close aria-label="Fechar conversa">×</button></div>
    <div class="chat-toolbar"><span>Consórcios Porto · Planos de saúde</span><button type="button" data-chat-reset>Reiniciar</button></div>
    <div class="chat-log" role="log" aria-label="Conversa" aria-live="polite" aria-relevant="additions"></div>
    <div class="chat-choices" aria-label="Respostas rápidas"></div>
    <form class="chat-composer" hidden><label class="sr-only" for="chat-input">Sua resposta ou dúvida</label><input id="chat-input" maxlength="600" autocomplete="off" aria-describedby="chat-status" required><button class="chat-send" type="submit" aria-label="Enviar mensagem">Enviar ↗</button></form>
    <p id="chat-status" class="chat-status" role="status"></p>
    <div class="chat-bottom"><a href="${whatsapp()}" target="_blank" rel="noopener noreferrer">Falar com um consultor ↗</a><a href="/privacidade">Privacidade</a></div>
  </dialog>`;
}
