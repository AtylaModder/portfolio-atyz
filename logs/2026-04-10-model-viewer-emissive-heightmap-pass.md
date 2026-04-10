# 2026-04-10 — Correção de Emissive e Sidecar de Height Map no Viewer 3D

## Pedido

- Corrigir o viewer para não tratar cores claras como se fossem emissive.
- Fazer o emissive reagir só ao alpha/transparência visível da textura, sem clarear o modelo inteiro.
- Dar um retoque visual na luz para um resultado mais neutro e próximo de render de Blender.
- Pesquisar se o GLTF exportado pelo Blockbench guarda texturas não aplicadas e, a partir disso, definir a estratégia para height map por brilho.

## Diagnóstico

- O problema principal do emissive não estava só na luz: o viewer usava a textura base inteira como emissiveMap.
- Com isso, qualquer cor clara somada ao bloom podia parecer autoluminosa.
- O threshold do bloom também estava permissivo demais, então amarelos claros e highlights comuns passavam a “estourar”.
- Para height map, era necessário confirmar se o Blockbench manteria uma textura extra sem uso no material exportado.

## Pesquisa sobre Blockbench / GLTF

Resumo do que foi verificado no código do exportador do Blockbench e do GLTFExporter:

- O exportador do Blockbench monta materiais a partir das faces exportadas e empilha `tex.getMaterial()` apenas quando a face realmente usa uma textura.
- No GLTFExporter, as imagens do glTF são serializadas a partir dos mapas ligados ao material, como `material.map`, `material.normalMap`, `material.emissiveMap`, `material.aoMap` e `material.metalnessMap`.

Conclusão prática:

- Uma textura extra que não esteja aplicada a nenhum material não é um caminho confiável para “viajar junto” no glTF exportado pelo Blockbench.
- Por isso, o height map ficou implementado como sidecar externo em `public/models`, com detecção automática e opção de caminho explícito no `site.ts`.

## Arquivos alterados

- src/lib/bedrock-renderer.ts
- src/components/ModelCarousel.astro
- src/data/site.ts
- SITE-MAP.md

## Alterações aplicadas

### 1. Emissive corrigido na raiz

No `src/lib/bedrock-renderer.ts`:

- o viewer deixou de reaproveitar a textura base inteira como emissiveMap;
- agora ele gera uma máscara emissive derivada apenas do alpha visível da textura;
- pixels opacos não recebem emissive extra;
- se o modelo não tiver área semi-transparente visível, não há glow artificial.

Resultado:

- cores claras, como amarelos e off-whites, não são mais confundidas com emissão de luz;
- modelos como Light Fruit não ficam com aparência de LED só por terem cor forte.

### 2. Bloom e iluminação recalibrados

Ainda no renderer:

- o bloom passou a existir só quando `render.emissive` estiver ativo;
- o threshold do bloom ficou mais alto para reagir a emissive real, não a cor clara comum;
- o setup premium recebeu ajuste para um perfil mais neutro;
- o tone mapping premium foi trocado para `AgXToneMapping`, que se aproxima melhor da resposta visual de Blender do que o setup anterior.

Resultado:

- a leitura do modelo ficou mais estável;
- menos “estouro” em superfícies claras;
- render premium continua bonito, mas menos artificial.

### 3. Sidecar externo de height map por brilho

Foi adicionado suporte a relevo por brilho usando `bumpMap`:

- o viewer tenta localizar automaticamente arquivos como `nome_do_modelo_height_map.png` na mesma pasta do GLTF;
- também aceita caminho explícito em `render.heightMap`;
- a força do relevo pode ser controlada com `render.heightMapStrength`;
- o relevo foi invertido para seguir a lógica pedida: preto sai para fora, branco entra como concavo.

Observação:

- se no futuro um modelo tiver múltiplas texturas ou naming diferente, o caminho explícito em `render.heightMap` é a opção mais segura.

### 4. Tipos e documentação alinhados

- `src/components/ModelCarousel.astro` recebeu os novos campos do config de render;
- `src/data/site.ts` agora documenta `heightMap` e `heightMapStrength`;
- `SITE-MAP.md` foi atualizado com o novo comportamento do emissive e do sidecar de relevo.

## Validação

- `get_errors` nos arquivos alterados: sem erros.
- `npm run build`: concluído com sucesso.
- Resultado do check/build: `0 errors`, `0 warnings` e apenas os 3 hints antigos fora do escopo.

## Observações

- O suporte de sidecar já está pronto no viewer, mas nenhum `*_height_map.png` foi adicionado nesta rodada.
- Se quiser ativar controle fino por modelo depois, o caminho natural é usar `render.heightMap`, `render.heightMapStrength` e `render.emissiveIntensity` no catálogo.