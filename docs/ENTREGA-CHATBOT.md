# Entrega — Vitória Santa, 27/10/2026

## Funcionalidades

Tema claro/escuro com preferência do sistema e escolha persistida. Assistente com coleta contextual de consórcio Porto Seguro / Porto Bank e cotação de saúde, consentimento, validação, revisão/correção, protocolo confirmado pelo banco, reenvio sem duplicação, sessão temporária e WhatsApp.

Por decisão do proprietário, a IA fica **desativada por enquanto**. O atendimento guiado e as orientações gerais continuam funcionando; o backend só chama o provedor quando `AI_GATEWAY_ENABLED=true`. A tentativa de ativação encontrou HTTP 403, saldo zero no AI Gateway e exigência de verificação de cartão. Não houve compra de créditos nem cadastro de cartão pelo agente. A integração preparada ainda precisa de validação real após futura ativação.

## Código e páginas

As seis páginas e a página 404 recebem o tema e o assistente. A implementação está em `public/theme.js`, `public/chat.js`, `public/chat-flow.js`, `src/chat-widget.js`, `src/chat-api.js` e `api/`. `src/pages.js`, `src/components.js` e `public/styles.css` integram a interface. Os scripts de build preservam o servidor Node/SQLite e a publicação estática do Pages.

## Banco

Supabase dedicado: `pumofujrevwzbjdmqmrl`, São Paulo. Tabelas: `chat_sessions`, `chat_messages`, `simulation_requests`, `insurers`, `product_knowledge`, `chat_rate_limits`. RLS e ausência deliberada de acesso direto por anon/authenticated; escrita apenas pelo servidor e RPCs restritas. Limite distribuído, sessões assinadas e transação idempotente. Retenção autorizada: mensagens 7 dias; pedidos/sessões 50 dias, limpeza diária às 03:17 de São Paulo.

## Verificação

18 testes automatizados passaram, incluindo validação dos dois produtos, sessão, CORS, consentimento, erros, limite de chamadas, idempotência e regressão dos formulários SQLite. Build e exportação estática foram verificados. Na produção, os dois produtos geraram protocolos reais; reenviar o mesmo UUID retornou o mesmo protocolo. A existência foi confirmada no Supabase e somente os dois pedidos fictícios foram removidos após o teste.

O navegador confirmou abertura do assistente em tela de celular, consentimento e início da coleta de saúde, tema claro/escuro e persistência da escolha após recarga. A revisão visual completa de todas as etapas e larguras ainda não foi concluída.

## Publicação e operação

Produção: https://vitoriasanta.vercel.app/ . GitHub Pages: https://direinatorl.github.io/vitoria-santa/ . O domínio antigo redireciona ao atual; a lista de origens e a exportação Pages foram atualizadas. Cada alteração é enviada a `main`, disparando os builds vinculados. Segredos ficam somente na Vercel; a chave Supabase cadastrada com o nome `SUPABASE_Secret_KEY` é aceita pelo backend, sem leitura ou divulgação do valor.

Os pedidos ficam no Supabase para acompanhamento administrativo. Não há notificação automática, CRM ou entrega por API do WhatsApp. É necessário um responsável pelo atendimento. Não foram inventadas operadoras, preços ou tabelas comerciais; disponibilidade e condições dependem de confirmação humana.

As retomadas automáticas solicitadas apenas até as 19h foram removidas ao término desse prazo. O trabalho posterior foi realizado por solicitação direta do proprietário.
