# 2026-04-10 — Rebalance de Iluminação, Emissive Colorido e Height Map no Viewer 3D

## Pedido

- A luz premium ficou pálida e sem vida após o ajuste anterior.
- O height map da Hydra aparentemente não estava funcionando.
- O emissive estava respeitando o alpha, mas brilhando em branco em vez de manter a cor original dos pixels.

## Diagnóstico

- O rebalance anterior da luz reduziu demais exposição, envMap e intensidades do rig, deixando o render sem presença.
- O cadastro da Hydra estava correto: o arquivo `public/models/hydra_height_map.png` existe e o model já estava com `render.heightMap` ativo.
- O relevo estava sendo aplicado como `bumpMap`, que é mais sutil; para o efeito pedido, um normal map gerado do height map é bem mais visível.
- O emissive colorido falhava porque a máscara gerada usava valores em grayscale, produzindo brilho branco.

## Arquivos alterados

- src/lib/bedrock-renderer.ts
- src/data/site.ts
- SITE-MAP.md

## Alterações aplicadas

### 1. Luz premium com mais presença

No renderer:

- o modo premium voltou para `ACESFilmicToneMapping`;
- exposure, envMap e intensidades do rig foram reforçados;
- o SSAO voltou a ter um alcance mais útil;
- o bloom emissive foi mantido restrito, mas com resposta mais bonita.

Resultado:

- o preview volta a ter contraste, cor e leitura mais viva;
- o visual continua controlado, sem reintroduzir o problema de cor clara virar emissive.

### 2. Emissive mantendo a cor original

- a máscara emissive por alpha agora copia a cor RGB dos próprios pixels da textura;
- o emissive não gera mais brilho branco por padrão nas áreas translúcidas;
- quando o emissive veio do alpha gerado pelo viewer, o material passa a emitir usando a própria cor do mapa.

Resultado:

- o glow continua preso às áreas de baixa transparência;
- a cor base dessas áreas é preservada durante a emissão.

### 3. Height map convertido para normal map dinâmico

- o sidecar `*_height_map.png` agora é convertido em normal map em tempo de carregamento;
- preto é interpretado como relevo para fora e branco como concavo, como pedido;
- se a geração do normal map falhar, o renderer ainda pode cair para o bump fallback.

Para a Hydra, além disso:

- o config foi deixado explícito em `src/data/site.ts` com `heightMap: '/models/hydra_height_map.png'`.

Resultado:

- a Hydra não depende mais da resolução automática do nome para o teste atual;
- o relevo fica muito mais perceptível do que no bumpMap simples.

## Validação

- `get_errors` nos arquivos alterados: sem erros.
- `npm run build`: concluído com sucesso.
- Resultado final: `0 errors`, `0 warnings` e só os 3 hints antigos fora do escopo.

## Observações

- Se algum modelo ficar com relevo agressivo demais, o ajuste natural é baixar `heightMapStrength` no `site.ts`.
- Se quiser, o próximo passo natural é calibrar Hydra, Shukaku e Susanoo individualmente agora que a base do renderer voltou a responder melhor.