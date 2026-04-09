# 2026-04-09 — Performance Optimization Pass

## Pedido

- Investigar a lentidão geral do site.
- Otimizar o máximo possível sem descaracterizar o visual e os efeitos atuais.
- Verificar se o gargalo vinha de smooth scroll, 3D, partículas ou renderização fora de viewport.

## Diagnóstico

- O principal problema não era o Lenis em si.
- O custo maior estava concentrado em três frentes:
  - bibliotecas pesadas carregadas cedo demais no caminho crítico do primeiro render;
  - loops contínuos de requestAnimationFrame rodando mesmo quando não havia benefício visível;
  - trabalho muito caro por frame no footer, gerando máscara animada via canvas + data URL repetidamente.
- O baseline de build mostrava que o problema mais óbvio de bundle era o carregamento do viewer 3D no chunk do carrossel:
  - ModelCarousel: 646.4 KB
  - BaseLayout: 235.1 KB
- A auditoria de assets também mostrou imagens grandes fora do pipeline de otimização:
  - public/projects/shinobi.png → 5.57 MB
  - public/projects/hydra.png → 3.10 MB
  - public/visuals/2.png a 6.png → ~2.3 MB a 3.03 MB cada

## Arquivos alterados

- src/layouts/BaseLayout.astro
- src/components/ModelCarousel.astro
- src/lib/bedrock-renderer.ts
- src/lib/geo-background.ts
- src/components/Footer.astro
- src/scripts/hero-particles.ts
- src/scripts/custom-cursor.ts

## Otimizações aplicadas

### 1. Code splitting real no caminho crítico

Em src/layouts/BaseLayout.astro:
- Typed.js saiu do bundle inicial e passou para import dinâmico no momento da animação do hero.
- tsParticles saiu do bundle inicial e passou para import dinâmico apenas quando necessário.
- O ticker do Lenis passou a ser removido corretamente antes de reinit, evitando acúmulo silencioso.
- O loader deixou de esperar imagens abaixo da dobra e agora considera apenas fontes + imagens explicitamente críticas.

Em src/components/ModelCarousel.astro:
- Three.js e o renderer 3D saíram do bundle inicial do carrossel.
- O viewer agora é importado só quando o lightbox 3D é aberto.

### 2. Menos renderização contínua sem benefício visual

Em src/components/ModelCarousel.astro:
- O loop de requestAnimationFrame do carrossel agora só roda quando necessário:
  - seção visível e auto-scroll ativo;
  - drag ativo;
  - inércia após drag.
- O loop é pausado quando a aba fica oculta.
- A quantidade mínima de conjuntos duplicados no track caiu de 5 para 3, reduzindo DOM e imagens repetidas.
- As thumbnails do carrossel receberam decoding assíncrono e fetchpriority baixo.

Em src/lib/geo-background.ts:
- O background geométrico ganhou DPR adaptativo por tier de performance.
- O render foi limitado a FPS mais baixos conforme o dispositivo:
  - desktop: ~30 FPS
  - mobile: ~24 FPS
  - low-end: ~20 FPS
- O loop pausa quando a aba não está visível.
- Em reduced motion, o fundo passa a renderizar de forma estática, com redraw apenas quando necessário.

Em src/scripts/custom-cursor.ts:
- Adicionada guarda para evitar listeners globais duplicados em reinicializações.

### 3. Footer muito mais barato

Em src/components/Footer.astro:
- A máscara deixou de ser gerada em resolução cheia do footer.
- O canvas passou a trabalhar em grade de baixa resolução, escalada depois como mask.
- O efeito foi limitado a 12 FPS.
- Em low-end ou reduced motion, o footer usa máscara estática em vez de animação contínua.
- O loop também pausa quando a aba fica oculta.
- O uso de propriedades de máscara foi trocado para style.setProperty, removendo a dependência da API deprecated usada antes.

### 4. Viewer 3D adaptativo

Em src/lib/bedrock-renderer.ts:
- Pixel ratio do renderer agora é adaptativo por tier.
- Pós-processamento SSAO e sombras são preservados no desktop, mas desligados em mobile e low-end.
- Isso mantém a qualidade no cenário principal e reduz custo quando o hardware é mais fraco.

### 5. Partículas do hero mais leves e protegidas contra reinicialização duplicada

Em src/scripts/hero-particles.ts:
- Guardas para evitar inicializações simultâneas.
- Observer singleton para não duplicar controle de viewport.
- fpsLimit reduzido de 60 para 45.
- detectRetina ficou mais conservador.

### 6. Imagens pesadas convertidas para WebP

Em src/data/site.ts:
- Projetos e galeria Vibrant Visuals passaram a apontar para versões .webp.

Arquivos gerados em public/projects e public/visuals:
- hydra.png: 3.10 MB → hydra.webp: 0.25 MB
- shinobi.png: 5.57 MB → shinobi.webp: 0.44 MB
- rio.png: 0.85 MB → rio.webp: 0.10 MB
- visuals/1.png: 1.81 MB → 1.webp: 0.31 MB
- visuals/2.png: 2.42 MB → 2.webp: 0.38 MB
- visuals/3.png: 2.33 MB → 3.webp: 0.32 MB
- visuals/4.png: 2.53 MB → 4.webp: 0.31 MB
- visuals/5.png: 2.34 MB → 5.webp: 0.29 MB
- visuals/6.png: 3.03 MB → 6.webp: 0.47 MB
- visuals/7.png: 1.90 MB → 7.webp: 0.30 MB

- Ganho total aproximado só nesses assets referenciados: de 25.88 MB para 3.17 MB.

## Métricas de bundle

### Antes

- ModelCarousel.astro_astro_type_script_index_0_lang.*.js → 646.4 KB
- BaseLayout.astro_astro_type_script_index_0_lang.*.js → 235.1 KB

### Depois

- BaseLayout.astro_astro_type_script_index_0_lang.*.js → 80.8 KB
- ModelCarousel.astro_astro_type_script_index_0_lang.*.js → 5.7 KB
- bedrock-renderer.*.js → 641.3 KB (agora lazy-loaded)
- hero-particles.*.js → 144.6 KB (agora lazy-loaded)
- hero-typed.*.js → 10.5 KB (agora lazy-loaded)

## Interpretação

- O custo do Three.js não sumiu, mas saiu do caminho crítico do carregamento inicial.
- O mesmo vale para tsParticles e Typed.js.
- Isso reduz parsing, compilação e execução logo no startup, que era onde o site mais sofria para “subir”.
- O payload de imagens usado nas seções de projetos e visuals caiu drasticamente, reduzindo download e custo de decodificação quando essas áreas entram em cena.

## Validação

- npm run build executado com sucesso após as alterações.
- Resultado final: 0 erros.

## Ajuste posterior no mesmo dia

### Sintoma

- A loading screen do site passou a ficar presa ou demorando demais para sair.

### Correção aplicada

Em src/layouts/BaseLayout.astro:
- O bootstrap da página deixou de depender só de astro:page-load e agora também inicializa por DOMContentLoaded/readyState.
- A espera por fontes foi limitada por um cap curto, para não segurar a tela de loading indefinidamente.
- Foi adicionado fail-safe para remover a loading screen automaticamente se algo no fluxo falhar.
- O caminho de erro agora força a abertura da página em vez de deixar o usuário preso na tela de loading.
- O tempo da transição do loader foi encurtado.

### Resultado esperado

- A tela de loading não deve mais ficar infinita.
- Mesmo se alguma fonte, evento ou readiness falhar, a página abre com fallback em poucos segundos.

### Ajuste fino seguinte

- O loader foi alongado para voltar a ter mais presença visual.
- A preparação de ScrollTrigger/reveals passou a acontecer ainda atrás da loading screen, para reduzir engasgos no primeiro quadro visível da página.
- Cursor custom, microinterações, partículas e monitoramento de FPS passaram a subir em etapas diferidas, em vez de competir todas no mesmo instante em que a página aparece.
- O morph da logo do loader foi simplificado para uma saída mais leve.

### Correção posterior do footer

- A versão em baixa resolução da máscara do pixel dissolve deixou o topo do footer borrado.
- A máscara foi ajustada para rasterização em tamanho real novamente, mantendo o FPS limitado e a pausa por visibilidade.
- Resultado esperado: bordas pixeladas nítidas outra vez, sem voltar ao custo contínuo original.

### Hints remanescentes

- Sites antigo/portfolioantigo1/js/script.js → variável e não usada.
- Sites antigo/portfolioantigo2/js/script.js → variável sectionHeight não usada.
- src/layouts/BaseLayout.astro → hint do Astro sobre script JSON-LD inline.
- src/lib/bedrock-renderer.ts → depreciação de THREE.Clock.

## Pendência recomendada para próxima rodada

- Comprimir ou substituir as imagens mais pesadas em public/projects e public/visuals.
- Esse ainda é o maior gargalo restante de payload real de rede e decodificação.