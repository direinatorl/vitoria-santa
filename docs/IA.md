# Base inteligente do assistente — 03/11/2026

O backend oferece conexão direta com a OpenAI pela Responses API. O módulo `src/ai-provider.js` cuida de autenticação, limite de saída, tempo máximo e leitura da resposta. O modelo padrão configurável é `gpt-6-luna`, com raciocínio `none` para respostas curtas. Não há bibliotecas novas nem ferramentas com permissão de executar ações no provedor.

## Comportamento

O visitante pode digitar dúvidas desde a abertura, antes de escolher um produto. Os botões **Consórcio Porto Seguro** e **Planos de saúde** continuam disponíveis. Durante a coleta, **Tenho uma dúvida** abre a conversa e **Continuar meu pedido** retoma exatamente o campo em andamento. Também é possível perguntar na revisão ou depois de concluir um pedido.

A ação `site-question` responde sobre navegação, localização, contato, corretora e os dois produtos. Destinos conhecidos geram links locais permitidos, compatíveis com Vercel e com o subdiretório do GitHub Pages. Endereço e contatos usam a configuração do site; horários não publicados não são inventados. A IA recebe o mapa do site, as orientações dos dois produtos e o conteúdo aprovado do banco.

A conversa livre usa até oito mensagens de perguntas e respostas da aba, filtradas novamente no servidor. Dados e resumo do pedido não entram nesse histórico. Essa ação não cria sessão de produto, lead nem mensagens no banco; o limite distribuído continua ativo. O consentimento e a sessão de produto permanecem necessários para registrar pedidos. O histórico antigo de perguntas com sessão de produto mantém sua retenção existente.

As instruções orientam respostas em português, sem inventar taxas, preços, operadoras, cobertura ou contemplação. O consórcio permanece exclusivo Porto Seguro / Porto Bank. O modelo responde dúvidas; o pedido e seu protocolo continuam dependendo do fluxo estruturado e da confirmação do Supabase. As instruções reduzem erros, mas não garantem a exatidão de toda resposta: condições comerciais exigem confirmação humana.

## Ativar na Vercel

No projeto `vitoria-santa`, ambiente **Production**:

| Variável | Valor |
|---|---|
| `OPENAI_API_KEY` | Chave da conta do proprietário; tipo Secret/Sensitive |
| `OPENAI_MODEL` | `gpt-6-luna` ou modelo compatível com Responses autorizado na conta |
| `CHAT_AI_ENABLED` | `true` |

Reimplantar após salvar as variáveis. Não colocar a chave no navegador, HTML, Git, mensagens ou logs. A criação da conta, login e eventual contratação de créditos são etapas do proprietário. A conta precisa ter acesso ao modelo e quota para a chamada. A disponibilidade real deve ser testada após essa configuração.

Compatibilidade: o backend também aceita `OPEN_API_KEY`, nome cadastrado pelo proprietário na Vercel. Se os dois nomes existirem, `OPENAI_API_KEY` tem prioridade. O valor continua privado no servidor.

Sem chave ou sem ativação, o assistente continua com orientação geral e coleta guiada. Não há substituição automática e oculta por outro provedor. A integração anterior via Gateway continua disponível apenas se `AI_GATEWAY_ENABLED=true` e a conexão direta não tiver sido habilitada.

## Dados e validação

As chamadas usam `store:false` e histórico enviado explicitamente; isso desativa o armazenamento da resposta para recuperação por essa API, não equivale a uma garantia de retenção zero por toda a infraestrutura do fornecedor. O histórico local do projeto mantém a retenção já autorizada de sete dias. O filtro conservador de documentos e termos médicos e o limite distribuído continuam ativos; o filtro não detecta todos os dados pessoais possíveis.

Testes automatizados usam um provedor simulado para verificar formato da API, sequência do histórico, ausência de armazenamento da resposta, isolamento das instruções, sucesso e persistência, erros, saída incompleta e bloqueio de mensagens sensíveis. Esses testes não comprovam funcionamento da conta real. Enquanto não houver uma chave válida e um teste real bem-sucedido, a integração está **preparada, sem ativação validada**.

Referências: https://developers.openai.com/api/docs/guides/text e https://developers.openai.com/api/docs/models/gpt-6-luna .
