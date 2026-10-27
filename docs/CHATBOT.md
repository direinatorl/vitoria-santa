# Assistente Virtual Vitória Santa

## Arquitetura

O servidor `server.js` e `/api/leads` continuam usando SQLite. O build Node em `dist/` preserva esse comportamento. O GitHub Pages continua publicando os HTMLs da raiz. A Vercel serve uma exportação estática própria (`vercel-public/`) e somente as novas funções `/api/chat` e `/api/requests`; SQLite não é colocado em armazenamento efêmero de funções.

O assistente mantém coleta determinística e validação compartilhada em `public/chat-flow.js`. Dúvidas livres são enviadas somente pelo backend ao endpoint compatível de Chat Completions do Vercel AI Gateway. A IA não escreve pedidos nem calcula preços. A confirmação comercial sempre depende da equipe. Nenhuma operadora de saúde foi cadastrada por suposição.

## Variáveis no servidor

| Variável | Finalidade |
|---|---|
| `SUPABASE_URL` | URL do projeto dedicado `pumofujrevwzbjdmqmrl` |
| `SUPABASE_SECRET_KEY` | Chave secreta Supabase; aceita chave moderna ou service role legada |
| `CHAT_SESSION_SECRET` | Segredo aleatório de pelo menos 32 caracteres para assinar sessões e derivar identificadores de abuso |
| `CHAT_ALLOWED_ORIGINS` | Origens exatas separadas por vírgula; produção: `https://direinatorl.github.io,https://vitoria-santa.vercel.app` |
| `AI_GATEWAY_MODEL` | Identificador disponível no catálogo atual do Gateway |
| `AI_GATEWAY_API_KEY` | Necessária fora da Vercel; na Vercel pode ser usado `VERCEL_OIDC_TOKEN` automático |
| `CHAT_API_URL` | Origem pública da API incorporada no HTML; única configuração de chat que pode chegar ao navegador |
| `SITE_URL` | Origem canônica da aplicação Vercel/Node |

Defina segredos como variáveis sensíveis somente nos ambientes apropriados. Não copie segredos para HTML, arquivos estáticos, mensagens, GitHub ou logs. O Supabase MCP fornece apenas chaves públicas; uma chave privada precisa ser configurada pelo responsável no painel seguro caso não exista uma integração de segredos autorizada.

Na Vercel, use Framework **Other**, Node 24, build `node scripts/build-vercel.mjs`, saída `vercel-public` e comando de instalação vazio. `vercel.json` contém a configuração. As páginas Vercel oferecem o atendimento estático e o chatbot; os formulários SQLite continuam no servidor Node original.

Para GitHub Pages, execute `node scripts/export-pages.mjs` depois de configurar `CHAT_API_URL` com a origem real e confirmada da API. A publicação não deve apontar para um domínio de terceiros ou ambiente não verificado. Se a API estiver vazia ou indisponível, o assistente não afirma ter salvo dados e oferece WhatsApp.

## Segurança e persistência

- RLS em seis tabelas, sem concessões a `anon`/`authenticated`. A ausência de políticas de acesso público é deliberada (deny-by-default).
- As funções RPC têm `SECURITY INVOKER`, `search_path` vazio e execução somente por `service_role`.
- Sessões HMAC com validade de 30 minutos; nenhum endpoint público lista conversas/pedidos.
- Limite atômico de 40 chamadas por IP derivado/janela de 15 minutos no Postgres, compartilhado entre instâncias. CORS é uma defesa do navegador e não substitui esse controle. Em tráfego adversarial, complemente com WAF/Turnstile antes de ampliar capacidade.
- Validação de esquema, tamanho, produto, telefone, UF, números e quantidade de idades no servidor. Campos desconhecidos não são persistidos.
- Pedido e atualização de sessão na mesma transação, com UUID de idempotência e detecção de conflito.
- Mensagens livres passam por filtro conservador antes da IA; filtros não garantem detectar toda informação sensível. Não informe dados pessoais na conversa livre.
- Nome e contato estruturados não são enviados ao modelo. Conteúdo mostrado no navegador usa `textContent`.
- Sem logs de corpo, segredos, respostas do banco ou conteúdo pessoal.

## Retenção e direitos

O proprietário autorizou **7 dias** para mensagens e **50 dias** para pedidos/sessões. A tarefa `vitoria-chat-retention`, via `pg_cron`, executa diariamente às 06:17 UTC (03:17 em São Paulo). A exclusão de uma sessão remove suas mensagens e pedidos por FK com cascade.

Para um pedido de exclusão: receber protocolo pelo canal institucional, confirmar titularidade sem solicitar documentos públicos, localizar a sessão com acesso administrativo e executar a exclusão apenas após autorização e análise de eventual obrigação legal. Não expor um endpoint anônimo de consulta por telefone/protocolo. Revisar o tratamento de backups conforme a política da organização.

## Operadoras e conhecimento

`insurers`: inserir apenas operadoras confirmadas pela corretora, marcando `active=true` e `verified_at` após validação. `product_knowledge`: conteúdo com fonte oficial e revisão humana; somente `approved=true` entra no contexto. Consórcios permanecem exclusivos Porto Seguro / Porto Bank. Não há tabela comercial validada, portanto os fluxos geram solicitações humanas, sem preços ou promessa de contemplação.

## Verificação

`node --test`, `node scripts/check.mjs`, `node scripts/build.mjs`, `node scripts/smoke.mjs`, `node scripts/export-pages.mjs --check`, `node scripts/build-vercel.mjs`.

Os testes automatizados cobrem regressão SQLite, formulários e rotas, validação dos dois fluxos, assinatura/expiração de sessão, CORS, limites, erro de persistência, reenvio, conflito e IA indisponível. Os testes SQL usam transação com rollback para não deixar contatos sintéticos em produção. Testes reais de API/IA dependem das variáveis privadas e do deploy publicado.
