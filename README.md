# Vitória Santa — consórcios e planos de saúde

Primeira versão funcional, criada diretamente neste repositório. Interface em português, renderização HTML no servidor, CSS responsivo e JavaScript nativo. Back-end Node.js 24 e SQLite integrado ao Node: nenhuma dependência externa para instalar e nenhum serviço externo necessário para registrar os pedidos.

## Executar

Requer **Node.js 24 ou superior**.

```powershell
node --env-file-if-exists=.env server.js
```

Abra http://localhost:3000. Não é necessário executar `npm install`. Se o npm estiver disponível, `npm start` e `npm run dev` também podem ser usados. O modo de desenvolvimento direto é `node --watch --env-file-if-exists=.env server.js`.

Para personalizar, copie `.env.example` para `.env`. O arquivo `.env` não deve ser versionado.

| Variável | Padrão | Finalidade |
| --- | --- | --- |
| `PORT` | `3000` | Porta HTTP |
| `HOST` | `127.0.0.1` | Interface de escuta; use `0.0.0.0` em contêiner quando necessário |
| `SITE_URL` | `http://localhost:3000` | Origem exata, sem barra final, usada por formulários, canonical, sitemap e compartilhamento |
| `DATABASE_PATH` | `./data/contacts.sqlite` | Banco privado persistente |

**Acesse a aplicação pela mesma origem de `SITE_URL`.** Por exemplo, para usar `http://127.0.0.1:3000`, configure esse endereço; caso contrário, o servidor bloqueará o envio por origem divergente.

## O que foi implementado

- Início, consórcios, planos de saúde, institucional/contato, privacidade e página 404.
- Logotipo original, fotografia ilustrativa local, cores derivadas da identidade e layouts para desktop e celular.
- Menu móvel acessível, foco visível, navegação por teclado e FAQs com `details` nativo.
- Formulários de três serviços com consentimento obrigatório, mensagens por campo, carregamento e confirmação somente após gravação real.
- `POST /api/leads`: validação, normalização, SQLite, consentimento versionado, organização por serviço/data, SQL parametrizado, honeypot, limite de corpo de 16 KiB, restrição de origem e até 8 tentativas por IP em 15 minutos.
- Idempotência por identificador de envio: repetir o mesmo pedido retorna o mesmo protocolo. Reutilizar o identificador com outro conteúdo retorna 409. Um novo envio intencional após sucesso gera outro identificador.
- WhatsApp por links `wa.me` com mensagens por contexto. Nenhuma mensagem é enviada automaticamente.
- Metadados por página, Open Graph, URLs legíveis, `robots.txt`, sitemap, CSP e outros cabeçalhos de segurança. Sem rastreadores nem dependências de CDN.

## Estrutura

```text
server.js             HTTP, rotas, arquivos públicos, segurança e endpoint
src/config.js         contatos oficiais e mensagens do WhatsApp
src/pages.js          páginas e componentes HTML compartilhados
src/leads.js          validação e persistência SQLite
public/styles.css     estilos e pontos de adaptação responsiva
public/app.js         menu e envio dos formulários
public/assets/        logotipo, foto ilustrativa e favicon
test/site.test.js     testes de integração e regras de negócio
docs/PUBLICACAO.md    operação, fontes e confirmações pendentes
```

## Testes e verificação

```powershell
node --test
node --check server.js
node --check src/pages.js
node --check src/leads.js
node --check public/app.js
```

Os testes iniciam um servidor isolado na porta 3097 e usam bancos temporários, removidos ao final. Não utilizam o banco de atendimento. Cobrem páginas, links internos, assets, 404, validação, consentimento, spam, persistência dos três serviços, idempotência, conflitos, SQL parametrizado, proteção de origem, tipo de conteúdo, limite de envios e links de WhatsApp. É necessário permitir conexões de loopback para os testes HTTP.

Não há etapa de compilação: o código é executado diretamente pelo Node. `npm run check` executa a verificação de sintaxe quando npm estiver disponível.

## Dados e operação

O banco fica em `data/`, ignorado pelo Git e sem rota pública. O servidor não oferece consulta pública de leads nem painel administrativo. A equipe deve ter um procedimento de consulta autenticada no servidor com ferramenta SQLite. Não publique ou exporte dados pessoais para a pasta `public/` ou para o repositório.

A confirmação do formulário significa **registro no banco**, não envio de e-mail ou recebimento pela equipe. A versão não inclui notificações, CRM, API do WhatsApp, pagamentos, área do cliente ou simulador financeiro. Antes de abrir o site a clientes, defina quem acompanha os pedidos e como serão atendidos.

Consulte [o guia de publicação](docs/PUBLICACAO.md) para persistência, backup, privacidade, infraestrutura e dados comerciais a confirmar. O projeto foi salvo localmente; nenhum push ou deploy está implícito nesta entrega.
