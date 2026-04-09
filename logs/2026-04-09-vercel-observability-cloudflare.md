# 2026-04-09 — Vercel Observability + Cloudflare Playbook

## Objetivo

- Integrar observabilidade nativa da Vercel no site Astro.
- Definir uma configuração prática de Cloudflare na frente da Vercel para melhorar cache e entrega sem mexer na lógica do app.

## Alterações no repositório

### Dependências

Arquivos afetados:
- package.json
- package-lock.json

Pacotes usados:
- @vercel/analytics
- @vercel/speed-insights

### Integração no layout raiz

Arquivo afetado:
- src/layouts/BaseLayout.astro

Alterações:
- Importado Analytics de @vercel/analytics/astro.
- Importado SpeedInsights de @vercel/speed-insights/astro.
- Componentes adicionados no layout raiz.
- Renderização condicionada a import.meta.env.PROD para evitar ruído em desenvolvimento.

## O que ainda precisa ser feito no painel da Vercel

Essas partes não são controladas pelo código:

1. No projeto da Vercel, abrir Analytics e clicar em Enable.
2. No projeto da Vercel, abrir Speed Insights e clicar em Enable.
3. Após o próximo deploy, validar no navegador:
   - Analytics cria tráfego em rotas de insights da Vercel.
   - Speed Insights injeta o script próprio da Vercel no head.

## Configuração prática de Cloudflare na frente da Vercel

### DNS

- Proxy laranja ativo apenas no domínio público do site.
- Origem apontando para o domínio da Vercel.

### SSL/TLS

- Mode: Full (strict)
- Always Use HTTPS: ligado
- Automatic HTTPS Rewrites: ligado
- HTTP/3: ligado
- Brotli: ligado

### Cache Rules recomendadas

#### Regra 1 — cache agressivo para assets versionados do build

Expressão sugerida:
- URI Path starts with /_astro/

Ação:
- Cache eligibility: Eligible for cache
- Edge TTL: 1 month
- Browser TTL: Respect origin ou 1 week

Motivo:
- Esses arquivos têm nome hashado e podem ficar muito tempo em cache sem risco de conteúdo velho.

#### Regra 2 — cache agressivo para mídia estática grande

Expressão sugerida:
- URI Path starts with /projects/
- OR URI Path starts with /visuals/
- OR URI Path starts with /models/
- OR URI Path starts with /fonts/

Ação:
- Cache eligibility: Eligible for cache
- Edge TTL: 1 month
- Browser TTL: 1 week a 1 month

Motivo:
- Esse site usa imagens, fontes e modelos relativamente pesados. Cloudflare ajuda bastante aqui.

#### Regra 3 — não fazer Cache Everything no HTML

Expressão sugerida:
- URI Path equals /
- OR extensão ausente para páginas HTML

Ação:
- Deixar comportamento padrão da Vercel
- Não ativar Cache Everything sem estratégia de purge por deploy

Motivo:
- Evita servir HTML desatualizado após push novo.

### Opcional — Tiered Cache

- Ligar Tiered Cache no Cloudflare.
- Bom para reduzir repetição de fetch na origem Vercel.

### Opcional — Polish/Mirage

- Só usar se as imagens continuarem muito pesadas e você quiser otimização extra no edge.
- Como o site já usa WebP para várias áreas, o ganho pode ser menor do que em sites sem compressão.

## Ferramentas externas recomendadas

### Vercel

- Analytics: tráfego real por página e origem.
- Speed Insights: Core Web Vitals reais de visitantes.
- Deployment inspector: comparar comportamento por deploy.

### Open source / gratuitas

- PageSpeed Insights
- WebPageTest
- Chrome DevTools Performance
- Unlighthouse
- Lighthouse CI local, se quiser rotina repetível

## Leituras de performance para este projeto

O que tende a melhorar mais com Cloudflare + Vercel observability:
- entrega de imagens e assets estáticos grandes;
- visibilidade real sobre LCP, CLS, INP e páginas mais pesadas;
- comparação entre deploys para saber se uma mudança melhorou ou piorou.

O que Cloudflare não resolve sozinho:
- jank de scroll;
- gargalo de canvas/3D no navegador;
- trabalho pesado de JavaScript no primeiro render.

## Comandos úteis

Deploy por git:
- git add .
- git commit -m "mensagem"
- git push origin main

Instalar observabilidade localmente:
- npm install @vercel/analytics @vercel/speed-insights

## Passo a passo exato no painel do Cloudflare

### Ordem recomendada

1. Confirmar DNS proxied para o domínio do site.
2. Ajustar SSL/TLS.
3. Ligar HTTP/3 e Brotli.
4. Criar as Cache Rules na ordem abaixo.
5. Testar headers de cache no navegador.

### 1. DNS

No Cloudflare:

1. Abrir o domínio.
2. Ir em DNS.
3. Encontrar o registro que aponta para a Vercel.
4. Garantir que o proxy esteja ligado:
   - nuvem laranja ligada
5. Não trocar o alvo DNS que a Vercel te passou.

### 2. SSL/TLS

No Cloudflare:

1. Ir em SSL/TLS > Overview
2. Em SSL/TLS encryption mode, selecionar:
   - Full (strict)

Depois:

1. Ir em SSL/TLS > Edge Certificates
2. Ligar:
   - Always Use HTTPS
   - Automatic HTTPS Rewrites

### 3. Rede e compressão

No Cloudflare:

1. Ir em Network
2. Ligar:
   - HTTP/3

Depois:

1. Ir em Speed > Optimization
2. Ligar:
   - Brotli

Não recomendo mexer agora em Rocket Loader.
Deixar Rocket Loader desligado.

### 4. Cache Rules

Ir em Rules > Cache Rules

Criar exatamente nesta ordem:

#### Regra 1 — proteger HTML da home

Nome sugerido:
- Bypass home HTML

Se o editor de regra estiver em modo Expression, colar:

  (http.request.uri.path eq "/" or http.request.uri.path eq "/index.html")

Ações:
- Cache eligibility: Bypass cache

Salvar.

#### Regra 2 — cache agressivo do build hashado

Nome sugerido:
- Cache astro build assets

Expressão:

  starts_with(http.request.uri.path, "/_astro/")

Ações:
- Cache eligibility: Eligible for cache
- Edge TTL: Ignore cache-control header and use this TTL
- Edge TTL value: 1 month
- Browser TTL: Respect existing headers

Salvar.

#### Regra 3 — cache de mídia de projetos e galeria

Nome sugerido:
- Cache media assets

Expressão:

  starts_with(http.request.uri.path, "/projects/") or starts_with(http.request.uri.path, "/visuals/") or starts_with(http.request.uri.path, "/models/")

Ações:
- Cache eligibility: Eligible for cache
- Edge TTL: Ignore cache-control header and use this TTL
- Edge TTL value: 7 days
- Browser TTL: 1 day

Salvar.

#### Regra 4 — cache de fontes

Nome sugerido:
- Cache fonts

Expressão:

  starts_with(http.request.uri.path, "/fonts/")

Ações:
- Cache eligibility: Eligible for cache
- Edge TTL: Ignore cache-control header and use this TTL
- Edge TTL value: 1 month
- Browser TTL: 7 days

Salvar.

### 5. Tiered Cache

No Cloudflare:

1. Ir em Caching
2. Procurar por Tiered Cache
3. Ligar

Se aparecer Smart Tiered Cache, pode ligar também.

### 6. O que não ligar agora

Deixar desligado por enquanto:

- Rocket Loader
- Mirage
- Auto Minify de JavaScript, se você já está confiando no build do Vite

Pode testar depois, mas não é minha primeira escolha para este projeto.

### 7. Como validar se funcionou

No navegador:

1. Abrir o site publicado.
2. Abrir DevTools > Network.
3. Recarregar a página.
4. Clicar em um arquivo de:
   - /_astro/
   - /projects/
   - /visuals/
5. Verificar os response headers.

Você quer ver algo assim:

- cf-cache-status: HIT

Na primeira visita pode aparecer MISS.
Depois de alguns reloads, o esperado é começar a aparecer HIT nos assets estáticos.

### 8. Regra de ouro para este site

- HTML da home: sem cache forçado no Cloudflare.
- /_astro/: cache longo.
- Imagens, modelos e fontes: cache médio ou longo.
- Se trocar um arquivo mantendo o mesmo nome em public, faça purge desse arquivo no Cloudflare.

### 9. Purge quando trocar asset sem mudar nome

No Cloudflare:

1. Ir em Caching > Configuration
2. Abrir Purge Cache
3. Escolher Custom Purge
4. Informar a URL exata do arquivo alterado

Exemplo:
- https://atyzmodder.com/projects/hydra.webp

Se trocar muitos arquivos de uma vez e não quiser pensar muito, usar Purge Everything.
Mas isso só quando necessário.
