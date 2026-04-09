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
