# Resumos dos pedidos por e-mail

Destino fixo das notificações: **direinato13@gmail.com**, solicitado em 03/11/2026. Provedor: **Resend**, usando a integração já instalada na Vercel. Os contatos públicos da empresa continuam independentes deste destino administrativo.

Não há ativação pelo FormSubmit neste fluxo. A chave privada é `vitoriasanta_RESEND_API_KEY` (ou `RESEND_API_KEY`). O domínio remetente vem de `REQUEST_EMAIL_DOMAIN`, depois de `vitoriasanta_RESEND_EMAIL_DOMAIN`, com `resend.dev` como padrão quando ausentes. O domínio de teste só permite o destinatário da própria conta Resend; para outros destinatários é necessário verificar um domínio. Uma resposta `accepted` indica aceitação pelo serviço e não comprova entrega na caixa de entrada.

## Fluxo

1. O Supabase salva o pedido na transação existente.
2. O trigger `simulation_request_email` cria uma entrada em `request_email_notifications` e agenda uma chamada assíncrona à Vercel com apenas UUID, timestamp e HMAC de uso restrito àquele pedido, válido por cinco minutos. Nenhum dado de contato nem segredo reutilizável entra na fila `pg_net`.
3. `/api/request-email` valida a assinatura e faz uma reserva atômica. Repetir a chamada não gera outro e-mail.
4. A função consulta o resumo em português no banco e envia por HTTPS ao Resend, exclusivamente para o Gmail fixo. Não envia mensagens livres, documentos ou diagnósticos. Os dados estruturados de contato e preferências, incluindo idades quando informadas, são incluídos no resumo. A chave de idempotência no provedor usa o protocolo do pedido.
5. O resultado é registrado no banco; o cron `vitoria-email-status` reconcilia falhas de rede a cada minuto. O cliente recebe o protocolo do cadastro independentemente do resultado da notificação.

Somente novos registros disparam a notificação. Pedidos antigos não são enviados retroativamente. O reenvio idempotente do pedido não cria outro INSERT nem outro aviso.

## Operação

Consultar `request_email_notifications` no Table Editor do Supabase, filtrando `request_id` pelo protocolo. A tabela não contém cópia do contato e acompanha a retenção do pedido por chave estrangeira.

| Status | Significado |
|---|---|
| `queued` | Chamada agendada no banco |
| `processing` | Vercel reservou o envio |
| `accepted` | Resend aceitou a notificação |
| `activation_required` | Status legado do FormSubmit |
| `failed` | Falha conhecida de configuração, chamada ou recusa |
| `unknown` | Não foi possível confirmar o resultado; verificar a caixa antes de repetir |

Não há reenvio cego de falhas: em um timeout o serviço pode ter aceitado o e-mail, e repetir poderia duplicá-lo. Falhas ficam registradas para revisão administrativa; não apagam nem invalidam o pedido.

`docs/email-notifications.sql` contém o esquema e funções. O segredo aleatório da assinatura é provisionado fora do Git em `private.email_hook_config` (sem acesso anon/authenticated) e na variável **Sensitive / Production** `EMAIL_HOOK_SECRET` na Vercel. Para rotação, atualizar os dois lados juntos. A fila padrão do pg_net é gerenciada pelo Supabase e pode ser legível por papéis de banco; por isso a chamada transporta apenas o identificador e uma assinatura curta, não o resumo.

## Verificação

`node --test` inclui assinatura inválida/expirada, reserva contra duplicação, destinatário fixo, idempotência no provedor e recusas HTTP/HTML sem falso sucesso. `node scripts/send-email-check.mjs` envia um único teste fictício pelo mesmo remetente, quando executado manualmente com as variáveis privadas disponíveis. Não faz parte do build normal. O teste completo deve criar um pedido identificado como teste e confirmar resultado no banco e no Gmail. Pedidos anteriores não são reenviados automaticamente e esta integração não exporta todo o banco.

### Resultado em 03/11/2026

- Produção em `https://vitoriasanta.vercel.app`, com destinatário fixo `direinato13@gmail.com`.
- `REQUEST_EMAIL_DOMAIN=resend.dev`: usa `onboarding@resend.dev`, sem criar ou vincular domínio. O domínio próprio da integração antiga foi recusado pelo Resend por falta de verificação e não é usado nesta configuração.
- Testes fictícios de consórcio (`6e2011a5-50d9-40e1-8224-9f815dd1fee3`) e saúde (`e6589e82-be52-4bb7-b039-62e3bb37631b`) chegaram a `accepted`, com HTTP 200 do Resend e HTTP 202 da função. Isso confirma banco → função → aceitação no provedor, mas não comprova leitura ou entrega na caixa de entrada.
- Um relatório dos sete pedidos que já existiam foi enviado manualmente pelo conector Gmail, conforme solicitado, com dados extraídos de `request_email_payload`. Esse relatório é separado das notificações automáticas de novos pedidos.
- Os 21 testes passaram. Os testes de envio cobrem também recusa HTTP em HTML, chave de idempotência e precedência do domínio de teste.
