# Verificação da primeira versão

Executada em 21/10/2026, com Node.js 24.19.0.

## Resultado automatizado

`node --test`: **8 testes passaram, 0 falharam**.

- Páginas, metadados, links internos, assets, sitemap, robots e 404.
- Validação de campos, telefone, e-mail, consentimento, modalidades e honeypot.
- Pedido inválido rejeitado sem persistência.
- Persistência real dos três serviços, normalização, reenvio idempotente e conflito de identificador.
- Bloqueio de origem externa, método e formato incorretos.
- Limite de tentativas com resposta 429.
- Conteúdo potencialmente malicioso tratado como dado e persistência após reabertura do banco.
- WhatsApp com número e mensagens contextuais.

Verificações de sintaxe executadas com `node --check` em `server.js`, `src/pages.js`, `src/leads.js` e `public/app.js`: concluídas sem erro. Não há compilação nem dependências de build.

## Verificação no navegador

- Página inicial inspecionada em desktop e em viewport móvel de 390 × 844.
- Menu móvel aberto e navegação para consórcios confirmada.
- FAQ de contemplação expandida e texto verificado.
- Formulário de consórcio enviado com dados fictícios: confirmação com protocolo 1.
- Formulário de saúde enviado com dados fictícios: confirmação com protocolo 2.
- Formulário de saúde sem transbordamento horizontal na viewport móvel.
- Ajuste de quebra de linha em título móvel aplicado após inspeção.
- Retorno à página inicial e inspeção em 1366 × 900.

Os testes HTTP usam base temporária e não afetam os contatos reais. Os envios manuais no navegador foram realizados somente no ambiente local, sem mensagens externas. Nenhum contato de WhatsApp, e-mail ou rede social recebeu mensagem.

## Limites

Não houve deploy, envio ao GitHub remoto, teste de recebimento por uma equipe comercial, auditoria jurídica, nem verificação de atendimento real dos canais publicados. A atualidade comercial dos dados, o tratamento operacional dos leads, o HTTPS e a infraestrutura persistente devem ser confirmados antes da publicação conforme `PUBLICACAO.md`.
