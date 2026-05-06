# Continuacao - Aura Exotica / Nexus Imports

Data: 2026-05-06
Deploy verificado: https://nexus-imports-perfumes-arabes.vercel.app/

## Contexto rapido

O projeto e um site estatico de catalogo premium para perfumes arabes/nicho, com conversao via WhatsApp. A stack atual e HTML, CSS e Vanilla JS. O workspace nao esta em um repositorio Git.

Diretorio local:

`C:\Users\jedua\OneDrive\Ambiente de Trabalho\Nexus Imports - Perfumes Importados`

## Estado atual

- O deploy publicado respondeu HTTP 200 na home.
- O CSS e JS publicados tambem responderam HTTP 200 quando verificados individualmente.
- A verificacao externa dentro do sandbox falhou inicialmente por restricao de rede; com permissao escalada, a home respondeu 200.
- O usuario achou o site ainda fraco em animacoes, design e alinhamento de imagens.

## Ajustes feitos nesta janela

- Corrigi caracteres quebrados em arquivos HTML/JS/CSS.
- Segunda rodada de melhoria solicitada pelo usuario:
  - Reduzi o impacto visual dos filtros do catalogo com um drawer `Refinar busca`.
  - Adicionei conteudo editorial para SEO na home, catalogo e produto.
  - Reforcei enquadramento de imagens para evitar produtos estourados: `object-fit: contain`, `max-width`, `max-height`, palco visual e sombra.
  - Removi escala tipografica por viewport width no CSS e passei a controlar tamanhos por `rem` e breakpoints.
  - Ajustei o catalogo para uma leitura mais premium, com grid mais respirado e cards menos genericos.
- Melhorei o visual do `style.css`:
  - Fundo com profundidade usando radiais leves e grid sutil.
  - Header mais translucido.
  - Hero com cards de destaque mais premium.
  - Imagens dos produtos com `object-fit: contain`, palco radial e sombra, evitando cortes e desalinhamento.
  - Cards de produto com altura mais consistente, grid interno e CTA alinhado no fim.
  - Animacoes de entrada para cards e hero.
  - Hover mais suave em produtos, filtros e imagens.
  - Suporte a `prefers-reduced-motion`.
- Ajustei `script.js` para aplicar delay de animacao nos cards renderizados dinamicamente.
- Troquei o simbolo quebrado do botao de favorito em `produto.html` por `+`.

## Rodada atual - reposicionamento premium e confianca

Pedido do usuario: ser franco sobre se o site venderia e, a partir disso, elevar a Aura Exotica para uma marca nova que transmite confianca, credibilidade e elegancia.

Diagnostico aplicado:

- O site tinha produto e estetica, mas ainda parecia pouco confiavel para compra imediata.
- Faltavam sinais comerciais fortes: processo de compra, garantia de originalidade, clareza de atendimento, prazo/pagamento/entrega e narrativa de marca nova.
- Removi linguagem interna ou fraca como `SEO & educacao` e reduzi exposicao do telefone falso visivel.

Alteracoes feitas:

- `index.html`
  - Hero reposicionado para "Aura Exotica - Perfumes Arabes & Nicho".
  - Substitui metricas frageis por compromissos reais: originais, curadoria e compra assistida.
  - Adicionei `trust-strip` com autenticidade, transparencia, orientacao e pos-venda.
  - Adicionei secao "Por que confiar" explicando que a marca esta comecando e vai ganhar reputacao com clareza.
  - Reescrevi narrativa da home para passar marca nova, mas seria.
- `catalogo.html`
  - Adicionei badges de garantia no hero.
  - Adicionei bloco compacto de confianca antes/depois da compra.
  - Ajustei copy para fechamento seguro pelo WhatsApp.
- `produto.html`
  - Adicionei bloco compacto de confianca na pagina de produto.
  - CTA fixo continua para compra pelo WhatsApp.
- `sobre.html`
  - Reescrevi a historia da marca assumindo que a Aura esta no inicio, mas com ambicao de referencia.
  - Adicionei manifesto: premium e ser preciso, orientar bem e nao empurrar compra.
- `contato.html`
  - Reescrevi contato e FAQ para explicar compra assistida, disponibilidade, prazo, pagamento e entrega.
  - Removi telefone falso visivel, mantendo "Canal oficial Aura Exotica".
- `blog.html`
  - Troquei linguagem interna por "Biblioteca Aura" e guias de compra segura.
- `script.js`
  - Cards agora exibem "Original lacrado | compra assistida".
  - Mensagem do WhatsApp pede confirmacao de prazo, pagamento e entrega.
  - Ficha de produto agora renderiza `product-assurance` com originalidade, compra segura e orientacao Aura.
- `style.css`
  - Estilos novos para `trust-strip`, `assurance-grid`, `assurance-card`, `compact-trust`, `brand-manifesto`, `page-hero-badges`, `card-trust` e `product-assurance`.
  - Ajustes visuais para CTA, responsivo e hierarquia premium.

Validacao desta rodada:

- `node --check script.js` passou.
- Servidor local temporario retornou HTTP 200 para:
  - `/index.html`
  - `/catalogo.html`
  - `/produto.html?id=armaf-club-de-nuit-intense-man`
  - `/sobre.html`
  - `/contato.html`
  - `/blog.html`
  - `/data/products.json`
- Busca por `99999-9999`, `SEO &`, `Nexus Imports` e `mojibake` em HTML/JS/CSS/sitemap/robots nao retornou ocorrencias.

Pendencias importantes para a marca vender de verdade:

- Substituir `5511999999999` pelo WhatsApp real em `script.js` e nos links HTML.
- Definir dominio final e atualizar canonical, Open Graph, JSON-LD, `sitemap.xml` e `robots.txt`.
- Inserir dados reais de confianca quando existirem: CNPJ, cidade/UF, politica de troca/devolucao, prazo medio, formas de pagamento, Instagram e provas sociais reais.
- Evitar depoimentos ficticios; adicionar somente quando houver clientes reais.

## Correcao - produtos nao carregando do JSON

Pedido do usuario: "outro ponto nao esta vindo os produtos do json".

Diagnostico:

- `data/products.json` estava com BOM no inicio do arquivo.
- O teste direto com `JSON.parse` falhava com `Unexpected token`.
- Depois da regravacao, os primeiros bytes do arquivo passaram a ser `5B 0D 0A`, ou seja, comeca direto em `[` sem BOM.

Alteracoes feitas:

- Regravei `data/products.json` como UTF-8 sem BOM.
- Ajustei `script.js`:
  - `fetchJson()` agora le a resposta como texto, remove BOM se algum dia voltar e faz `JSON.parse`.
  - Adicionei `extractProducts()` para aceitar tanto array direto quanto objetos no formato `{ products: [...] }` ou `{ items: [...] }`.
- Adicionei `local-server.cjs` para testar localmente por HTTP, porque abrir `catalogo.html` direto como arquivo pode bloquear `fetch()` no navegador.
- Adicionei `.vercelignore` para impedir `local-server.cjs` de entrar no deploy.

Validacao:

- `JSON.parse` local em `data/products.json` passou.
- `node --check script.js` passou.
- Servidor local em `http://127.0.0.1:4173/` respondeu:
  - `/data/products.json` HTTP 200
  - `/catalogo.html` HTTP 200
- `ConvertFrom-Json` via HTTP local confirmou:
  - `128` produtos
  - primeiro produto: `armaf-club-de-nuit-intense-man`
  - marca: `Armaf`

Observacao importante:

- Para os produtos carregarem no navegador, abrir pelo endereco `http://127.0.0.1:4173/catalogo.html`.
- Abrir o arquivo direto pelo Explorer, como `file:///.../catalogo.html`, pode impedir o `fetch("data/products.json")`.

## Arquivos alterados

- `index.html`
- `catalogo.html`
- `style.css`
- `script.js`
- `produto.html`
- Varios arquivos HTML/JS/CSS foram regravados em UTF-8 com limpeza mecanica de caracteres quebrados.

## Validacao feita

- `node --check script.js` passou.
- Servidor local temporario retornou 200 para:
  - `/index.html`
  - `/catalogo.html`
  - `/produto.html?id=armaf-club-de-nuit-intense-man`
  - `/data/products.json`
- O deploy remoto respondeu:
  - `/` com HTTP 200
  - `/style.css` com HTTP 200
  - `/script.js` com HTTP 200
- O browser integrado nao abriu porque o Node do sistema esta em `v20.14.0`, mas o plugin pede `>= v22.22.0`.

## Proximos passos recomendados

1. Rodar uma verificacao local completa:
   ```powershell
   cd "C:\Users\jedua\OneDrive\Ambiente de Trabalho\Nexus Imports - Perfumes Importados"
   python -m http.server 4173
   ```
   Abrir `http://127.0.0.1:4173/index.html`.

2. Conferir visualmente:
   - Home desktop e mobile.
   - Grid do catalogo.
   - Pagina de produto.
   - Se as imagens aparecem centralizadas e sem corte.
   - Se os cards nao ficam com CTAs em alturas diferentes.

3. Melhorias que ainda valem a pena:
   - Trocar imagens remotas por assets locais WebP otimizados.
   - Ajustar nome/brand final entre Aura Exotica e Nexus Imports.
   - Atualizar `canonical`, `sitemap.xml` e JSON-LD para o dominio real da Vercel ou dominio final.
   - Rodar Lighthouse mobile.
   - Fazer deploy na Vercel depois da aprovacao visual.

## Comandos uteis

```powershell
Select-String -Path *.html,*.js,*.css,robots.txt,sitemap.xml -Pattern 'mojibake'
& 'C:\Users\jedua\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --check script.js
```
