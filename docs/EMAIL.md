# Resumos dos pedidos por e-mail

Destino fixo: **atendimento@vitoriasanta.com.br**. Provedor autorizado: **FormSubmit**. Não usa Resend, SMTP, IA ou senha do e-mail. A conta Resend instalada anteriormente não é utilizada por esta implementação.

O primeiro envio solicita ao destinatário a confirmação **Activate Form**. Sem essa confirmação, o FormSubmit recusa as notificações. Uma resposta `accepted` indica aceitação pelo serviço, não comprova entrega na caixa de entrada; verificar também spam e a própria caixa.

## Fluxo

1. O Supabase salva o pedido na transação existente.
2. O trigger `simulation_request_email` cria uma entrada em `request_email_notifications` e agenda uma chamada assíncrona à Vercel com apenas UUID, timestamp e HMAC de uso restrito àquele pedido, válido por cinco minutos. Nenhum dado de contato nem segredo reutilizável entra na fila `pg_net`.
3. `/api/request-email` valida a assinatura e faz uma reserva atômica. Repetir a chamada não gera outro e-mail.
4. A função consulta o resumo em português no banco e envia por HTTPS ao FormSubmit, exclusivamente para o endereço fixo. Não envia mensagens livres, documentos ou diagnósticos. Os dados estruturados de contato e preferências, incluindo idades quando informadas, são incluídos no resumo.
5. O resultado é registrado no banco; o cron `vitoria-email-status` reconcilia falhas de rede a cada minuto. O cliente recebe o protocolo do cadastro independentemente do resultado da notificação.

Somente novos registros disparam a notificação. Pedidos antigos não são enviados retroativamente. O reenvio idempotente do pedido não cria outro INSERT nem outro aviso.

## Operação

Consultar `request_email_notifications` no Table Editor do Supabase, filtrando `request_id` pelo protocolo. A tabela não contém cópia do contato e acompanha a retenção do pedido por chave estrangeira.

| Status | Significado |
|---|---|
| `queued` | Chamada agendada no banco |
| `processing` | Vercel reservou o envio |
| `accepted` | FormSubmit aceitou a notificação |
| `activation_required` | Destinatário ainda precisa confirmar o FormSubmit |
| `failed` | Falha conhecida de configuração, chamada ou recusa |
| `unknown` | Não foi possível confirmar o resultado; verificar a caixa antes de repetir |

Não há reenvio cego de falhas: em um timeout o serviço pode ter aceitado o e-mail, e repetir poderia duplicá-lo. Falhas ficam registradas para revisão administrativa; não apagam nem invalidam o pedido.

`docs/email-notifications.sql` contém o esquema e funções. O segredo aleatório da assinatura é provisionado fora do Git em `private.email_hook_config` (sem acesso anon/authenticated) e na variável **Sensitive / Production** `EMAIL_HOOK_SECRET` na Vercel. Para rotação, atualizar os dois lados juntos. A fila padrão do pg_net é gerenciada pelo Supabase e pode ser legível por papéis de banco; por isso a chamada transporta apenas o identificador e uma assinatura curta, não o resumo.

## Verificação

`node --test` inclui assinatura inválida/expirada, reserva contra duplicação, destinatário fixo e falhas/ativação sem falso sucesso. Os testes SQL usam transação com rollback, validam os dois produtos, permissões e fila sem dados de contato. O teste de produção deve usar um pedido identificado como teste e confirmar resultado no banco e na caixa da corretora.
