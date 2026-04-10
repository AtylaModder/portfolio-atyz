# 2026-04-10 — Anti-pale premium lighting e reforço de cavidade no height map

## Pedido

- A iluminação premium ainda deixava o Charmander com laranja esbranquiçado.
- O height map estava funcionando, mas ficava sutil demais e aparecia só em ângulos específicos de luz.
- A leitura do relevo precisava acompanhar melhor o desenho do mapa, mais perto da sensação de Minecraft/Vibrant Visuals.

## Diagnóstico

- O modo premium ainda somava IBL, highlights e luz frontal demais para textura pixel-art saturada.
- O bump invertido sozinho dependia muito da direção da luz para aparecer.
- O renderer já estava sem erro de tipo; o problema restante era perceptivo, não estrutural.

## Arquivos alterados

- src/lib/bedrock-renderer.ts
- SITE-MAP.md
- /memories/repo/portfolio-site.md

## Alterações aplicadas

### 1. Premium menos pálido

- o modo enhanced passou a operar com NoToneMapping e exposure fixa em 1;
- envMapIntensity foi reduzido para diminuir lavagem de cor e highlight leitoso;
- roughness mínima foi elevada no premium para segurar especular branca;
- o rig foi aquecido e ficou menos frontal, preservando melhor a leitura do albedo.

Resultado:

- modelos saturados mantêm mais cor local no modo premium;
- o premium continua com profundidade e sombra de contato, mas sem empalidecer tanto a textura.

### 2. Height map com leitura mais constante

- o sidecar de height continua entrando como bump invertido;
- além disso, o renderer agora gera uma textura auxiliar de cavidade a partir do próprio height map;
- essa textura é aplicada como reforço de AO quando o material não traz um AO próprio.

Resultado:

- o relevo continua respondendo à luz, mas não some tanto fora do ângulo ideal;
- as quebras e cavidades do mapa ficam mais legíveis no viewer.

### 3. Ajuste fino do material premium

- aoMapIntensity ganhou um valor próprio para o AO derivado do height map;
- o bumpScale do relevo gerado foi aumentado no premium para ficar mais visível;
- o emissive colorido por alpha foi mantido como estava no passe anterior.

## Validação

- get_errors em src/lib/bedrock-renderer.ts: sem erros.
- npm run build: concluído com sucesso.
- O build manteve apenas hints antigos fora do escopo, em arquivos legados e no script inline do layout.

## Observações

- Charmander não tem sidecar de height map hoje; a parte de relevo desta etapa impacta modelos como a Hydra.
- Se algum modelo ficar marcado demais, o ajuste natural continua sendo heightMapStrength em src/data/site.ts.