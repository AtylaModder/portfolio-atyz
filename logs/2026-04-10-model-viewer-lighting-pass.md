# 2026-04-10 — Premium Lighting Pass no Viewer 3D

## Pedido

- Melhorar a iluminação dos previews 3D para algo mais próximo de Nomad Sculpt e Sketchfab.
- Reforçar profundidade com oclusão de ambiente e luz mais dinâmica.
- Fazer modelos com `render.emissive` brilharem melhor, principalmente nas partes transparentes/emissivas.
- Adicionar uma opção simples dentro do preview para desligar a iluminação mais pesada em aparelhos fracos.

## Diagnóstico

- O viewer já tinha base sólida com OrbitControls, SSAO e config por modelo, mas ainda estava com um setup mais neutro e “flat”.
- O emissive existente era funcional, porém sem halo bonito nem separação visual suficiente para materiais transparentes.
- Faltava um controle de runtime para alternar entre uma apresentação mais bonita e um modo mais leve sem reabrir o modelo.

## Arquivos alterados

- src/lib/bedrock-renderer.ts
- src/components/ModelCarousel.astro
- src/styles/global.css
- SITE-MAP.md

## Alterações aplicadas

### 1. Renderer premium no viewer 3D

No `src/lib/bedrock-renderer.ts` o viewer passou a ter dois modos de iluminação:

- `enhanced`: modo premium;
- `basic`: modo leve.

No modo premium foram adicionados:

- IBL de estúdio com `RoomEnvironment` + PMREM;
- rig de luz reativo à câmera com key, fill, rim, kick e bottom light;
- sombra de contato suave abaixo do modelo;
- tone mapping `ACESFilmicToneMapping`;
- SSAO mais forte e bloom pós-processado.

No modo leve o viewer reduz custo visualmente sem quebrar leitura do modelo:

- volta para `NoToneMapping`;
- desliga pós-processamento;
- achata mais a luz;
- mantém textura nítida e leitura segura em hardware mais fraco.

### 2. Glow emissive mais bonito para alpha/transparência

O fluxo de `render.emissive` foi mantido, mas ficou mais forte no modo premium:

- o viewer continua reaproveitando a textura base como `emissiveMap` quando necessário;
- materiais com alpha/transparência recebem um boost emissive maior;
- o bloom do pós-processamento realça melhor essas partes, criando um brilho mais próximo da linguagem visual da seção Vibrant Visuals.

Resultado prático:

- modelos já marcados com `render.emissive` ficam mais vivos sem precisar mudar a estrutura do `site.ts`;
- o glow aparece melhor nas áreas translúcidas e emissivas.

### 3. Toggle simples dentro do preview

No `src/components/ModelCarousel.astro` foi adicionado um controle visível no lightbox 3D:

- botão “Luz premium”; 
- alternância em runtime entre `enhanced` e `basic`;
- persistência via `localStorage`;
- fallback automático para iniciar em `basic` no mobile/low-end.

Isso permite:

- usar a apresentação mais bonita no desktop;
- desligar rapidamente a parte pesada em aparelhos fracos;
- manter a preferência entre aberturas do viewer.

### 4. Lightbox 3D com atmosfera mais premium

No `src/styles/global.css` o lightbox 3D recebeu refinamento visual para acompanhar o novo renderer:

- glow de fundo com cores do projeto;
- canvas com vidro escuro, borda suave e brilho externo;
- painel compacto do toggle de iluminação;
- aparência mais coerente com o acabamento do restante do site.

### 5. Documentação atualizada

O `SITE-MAP.md` foi atualizado para refletir:

- iluminação premium com IBL;
- SSAO + bloom emissive;
- toggle entre luz premium e modo leve;
- fallback por tier de performance.

## Validação

### Build antes do ajuste final do timer

- `npm run build` executado com sucesso.
- Resultado: `0 errors`.

### Ajuste final aplicado depois

- o uso deprecated de `THREE.Clock` no viewer foi removido;
- o render loop passou a usar `performance.now()`.

### Revalidação

- `npm run build` completou com sucesso após a troca para `performance.now()`.
- `astro check` voltou com `0 errors`, `0 warnings` e sem o hint antigo do `THREE.Clock`.
- Permaneceram apenas hints já conhecidos e fora do escopo desta rodada:
  - `Sites antigo/portfolioantigo1/js/script.js` → parâmetro não usado;
  - `Sites antigo/portfolioantigo2/js/script.js` → variável não usada;
  - `src/layouts/BaseLayout.astro` → hint do script JSON-LD inline.

## Observações

- Não foi necessário alterar `src/data/site.ts`; o ganho visual já acontece com o renderer novo.
- Se depois você quiser mais controle fino por modelo, o caminho natural é ajustar `render.emissiveIntensity` item por item.