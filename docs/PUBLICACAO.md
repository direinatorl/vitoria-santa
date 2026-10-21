# Publicação e operação

## Infraestrutura

Use servidor ou contêiner com Node.js 24+, volume persistente para `DATABASE_PATH`, certificado HTTPS e proxy reverso. Este aplicativo possui back-end: hospedagem somente estática, como GitHub Pages, não processa os formulários.

Configure `SITE_URL` com a origem HTTPS final. O servidor compara o cabeçalho `Origin` com esse valor. O proxy deve preservar a origem do navegador. Não use um domínio diferente para o formulário. Configure limite de corpo e tempo de requisição também no proxy. Execute como usuário sem privilégios administrativos.

Restrinja o banco e os backups ao usuário da aplicação e à equipe autorizada. Use criptografia de disco/volume e backups protegidos conforme a infraestrutura escolhida. SQLite armazena dados em arquivo sem criptografia própria nesta implementação. Não coloque o banco em `public/`. Não use armazenamento efêmero. Para backup online, prefira a API de backup do SQLite ou `VACUUM INTO` por ferramenta apropriada; uma cópia simples com o banco em uso pode ignorar o WAL. Teste a restauração antes de depender do backup.

O rate limit usa o IP do socket e memória local. Atrás de proxy, diferentes visitantes podem compartilhar o mesmo limite. Configure rate limit por IP real no proxy; o aplicativo não confia em `X-Forwarded-For` enviado pelo cliente. Múltiplas instâncias ou tráfego elevado exigem controle de abuso compartilhado e revisão do armazenamento. A primeira versão destina-se a uma instância com volume persistente.

## Recebimento e acompanhamento

Os pedidos são gravados na tabela `leads`, com serviço, data UTC, contatos, detalhes e versão do consentimento. Não existe listagem HTTP de dados. Prepare um procedimento de consulta restrita no servidor e atribua responsabilidade pelo retorno aos clientes. Uma ferramenta SQLite pode consultar os registros por `service` e `created_at`. Integração de notificações por e-mail/CRM é uma melhoria futura e não está operacional.

Defina uma política de retenção proporcional ao atendimento e implemente rotina de revisão/eliminação que também considere backups e obrigações legais. A versão não faz exclusão automática de contatos. Valide com o responsável pelo tratamento a política de privacidade, a identificação jurídica da empresa, o contato de privacidade e os procedimentos para atender direitos dos titulares antes de publicar. Não foram inventados CNPJ, registro profissional ou encarregado.

## Informações a confirmar antes de publicar

Os dados abaixo foram lidos em **21/10/2026**, em https://www.vitoriasanta.com.br. Constarem no site confirma sua publicação, mas não comprova que a empresa ainda os opera:

- Telefone: (11) 2957-8551.
- WhatsApp: (11) 99974-7932; número também presente no link `api.whatsapp.com` do site oficial.
- Endereço publicado: Rua Wadih Hatti, 285 anexo - 405, Vila Ré, São Paulo - SP, CEP 03666-010. Confirmar a redação de “anexo - 405” e disponibilidade de atendimento presencial.
- E-mail visível: atendimento@vitoriasanta.com.br. O site original contém um link de e-mail inconsistente, apontando para um endereço genérico. Esta implementação usa o endereço visível; confirmar recebimento real.
- Redes sociais vinculadas pelo site original: Instagram `segurosvitoriasanta` e Facebook `vitoriasantacorretoraseguros`. Confirmar propriedade e atualidade.
- Confirmar oferta de consórcios de imóveis/veículos, administradoras, taxas, reajustes, prazos e regras do grupo.
- Confirmar produtos de saúde disponíveis por região e perfil, inclusive individual/familiar e empresarial. Modalidades são apresentadas como interesses a verificar, sem promessa de disponibilidade.
- Confirmar cobertura, rede, elegibilidade, carências, acomodação e coparticipação na proposta específica. Não foram incluídos preços nem logotipos de parceiros.

O texto institucional foi reescrito a partir da descrição de atendimento, adequação às necessidades e suporte pós-venda do site oficial. Não foram adicionados anos de mercado, estatísticas, depoimentos ou certificações.

## Identidade e imagens

- `public/assets/logo.jpg`: logotipo obtido de https://www.vitoriasanta.com.br/images/logo.jpg para uso no projeto da própria marca.
- Paleta original observada: verde `#96c040` e azul no logotipo. A interface usa tons verdes mais escuros para legibilidade, verde claro e azul suave como apoio.
- `public/assets/familia.jpg`: fotografia ilustrativa de https://images.unsplash.com/photo-1511895426328-dc8714191300 (Unsplash), armazenada localmente. Não representa clientes nem depoimento. Confirmar adequação do material e licenciamento para o uso final.
- Favicon em SVG criado para o projeto, sem reproduzir o símbolo da marca.

## Checklist de entrada em produção

1. Confirmar os dados comerciais e jurídicos acima com a empresa.
2. Revisar a política de privacidade e definir responsáveis, retenção, acesso e backups.
3. Configurar domínio, TLS, `SITE_URL` e volume privado persistente.
4. Definir o acompanhamento dos leads, sem depender de uma notificação inexistente.
5. Executar `node --test`, conferir a navegação em desktop/celular e enviar um pedido de teste no ambiente final.
6. Verificar os registros com acesso restrito e testar restauração do banco.
7. Verificar links de WhatsApp sem enviar mensagens de teste a terceiros automaticamente.
