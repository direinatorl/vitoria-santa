# Vitória Santa — consórcios e planos de saúde

Site funcional, criado diretamente neste repositório e revisado para apresentação a clientes. Interface em português, renderização HTML no servidor, CSS responsivo e JavaScript nativo. Back-end Node.js 24 e SQLite integrado ao Node: nenhuma dependência externa para instalar e nenhum serviço externo necessário para registrar os pedidos.

## Executar

Requer **Node.js 24 ou superior**.

```powershell
node --env-file-if-exists=.env server.js
```

Abra http://localhost:3000. Não é necessário executar `npm install`. Se o npm estiver disponível, `npm start` e `npm run dev` também podem ser usados. O modo de desenvolvimento direto é `node --watch --env-file-if-exists=.env server.js`.

## Site no GitHub Pages

Endereço da publicação existente: **https://direinatorl.github.io/vitoria-santa/**.

O Pages estava exibindo o README. Agora há páginas HTML prontas na raiz, geradas da mesma interface do servidor, com navegação, imagens locais, FAQs e atendimento por WhatsApp, telefone e e-mail. **Na hospedagem Pages não há formulário de coleta nem gravação no SQLite.** Nenhum envio é simulado: as chamadas abrem o canal de atendimento real. A aplicação Node continua com os formulários funcionais e persistentes para um ambiente com back-end.

Depois de alterar conteúdo, componentes ou versões de assets, regenere as páginas e inclua o resultado no commit:

```powershell
node scripts/export-pages.mjs
node scripts/export-pages.mjs --check
```

O exportador usa `https://direinatorl.github.io/vitoria-santa` e pode receber `PAGES_URL` para outro endereço. Ele prepara `index.html`, as pastas das páginas, `404.html`, sitemap, robots e `.nojekyll`; não cria provedor nem muda a configuração da conta. Os links de estilos e imagens consideram o subdiretório do repositório. A publicação existente do GitHub Pages acompanha os pushes da branch `main`.

Para personalizar, copie `.env.example` para `.env`. O arquivo `.env` não deve ser versionado.

| Variável | Padrão | Finalidade |
| --- | --- | --- |
| `PORT` | `3000` | Porta HTTP |
| `HOST` | `127.0.0.1` | Interface de escuta; use `0.0.0.0` em contêiner quando necessário |
| `SITE_URL` | `http://localhost:3000` | Origem exata, sem barra final, usada por formulários, canonical, sitemap e compartilhamento |
| `DATABASE_PATH` | `./data/contacts.sqlite` | Banco privado persistente |

Em desenvolvimento, `localhost`, `127.0.0.1` e `[::1]` na mesma porta são aceitos como origem dos formulários. O servidor padrão escuta em `127.0.0.1`: se o navegador não abrir `localhost`, acesse **http://127.0.0.1:3000**. Em produção, a origem HTTPS deve coincidir exatamente com `SITE_URL`.

## O que foi implementado

- Início, consórcios, planos de saúde, empresa, contato, privacidade e página 404.
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
src/pages.js          páginas e metadados por rota
src/components.js     cabeçalho, rodapé, fotos, ícones, FAQ e CTAs
src/forms.js          formulários reutilizáveis com rótulos e erros acessíveis
src/content.js        perguntas e respostas por serviço
src/leads.js          validação e persistência SQLite
public/styles.css     estilos e pontos de adaptação responsiva
public/app.js         menu e envio dos formulários
public/assets/        logotipo, foto ilustrativa e favicon
test/                 testes de integração, HTTP e regras de negócio
scripts/              verificação, build e teste do artefato de produção
docs/PUBLICACAO.md    operação, fontes e confirmações pendentes
```

## Testes e verificação

```powershell
node --test
node scripts/check.mjs
node scripts/build.mjs
node scripts/smoke.mjs
```

Os 13 testes verificam também a exportação do Pages e a separação entre atendimento por WhatsApp e formulários persistentes. Iniciam servidores isolados nas portas 3097 e 3098 e usam bancos temporários, removidos ao final. Não utilizam o banco de atendimento. Cobrem páginas, links internos, assets, 404, validação, consentimento, spam, persistência dos três serviços, idempotência, conflitos, SQL parametrizado, proteção de origem, tipo de conteúdo, tamanho do corpo, JSON malformado, aliases locais, URLs canônicas, limite de envios e links de WhatsApp. É necessário permitir conexões de loopback para os testes HTTP.

O código é executado diretamente pelo Node. O **build de produção** verifica a sintaxe e prepara `dist/` com código e assets necessários, sem banco, segredos, Git ou testes. O comando `node scripts/smoke.mjs` inicia o artefato na porta 3099, abre uma página e uma imagem e verifica envio/persistência em banco temporário. Execute o build antes do smoke. Também há scripts npm equivalentes: `check`, `build` e `smoke`.

Para iniciar o artefato final: `node --env-file-if-exists=.env dist/server.js`. O banco continua relativo ao diretório de execução, a menos que `DATABASE_PATH` seja absoluto.

O workflow `.github/workflows/verify.yml` executa testes, build e smoke a cada push em `main` e nos pull requests. Ele disponibiliza um artefato de produção no GitHub Actions e **não faz deploy**. O `Dockerfile` prepara uma opção portátil, sem vincular o projeto a um provedor; montagem de volume persistente, TLS e domínio devem ser configurados no ambiente escolhido.

## Dados e operação

O banco fica em `data/`, ignorado pelo Git e sem rota pública. O servidor não oferece consulta pública de leads nem painel administrativo. A equipe deve ter um procedimento de consulta autenticada no servidor com ferramenta SQLite. Não publique ou exporte dados pessoais para a pasta `public/` ou para o repositório.

A confirmação do formulário significa **registro no banco**, não envio de e-mail ou recebimento pela equipe. A versão não inclui notificações, CRM, API do WhatsApp, pagamentos, área do cliente ou simulador financeiro. Antes de abrir o site a clientes, defina quem acompanha os pedidos e como serão atendidos.

Consulte [o guia de publicação](docs/PUBLICACAO.md) para persistência, backup, privacidade, infraestrutura e dados comerciais a confirmar, e [o relatório de verificação](docs/VERIFICACAO.md) para os resultados executados. Enviar ao GitHub e tornar o site acessível publicamente são etapas distintas.
