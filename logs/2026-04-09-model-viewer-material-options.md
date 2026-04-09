# 2026-04-09 — Emissive e One-Sided por Modelo no Viewer 3D

## Pedido

- Adicionar suporte opcional a emissive no visualizador 3D.
- Adicionar suporte opcional a one-sided no visualizador 3D.
- Fazer essas opções serem definidas por item diretamente na const `models`.
- Manter controle fino, porque nem todo modelo com transparência deve brilhar e nem todo modelo deve ser one-sided.

## Diagnóstico

- Os GLTFs atuais do projeto estão chegando com `doubleSided: true` no material.
- Isso significa que havia um motivo real para expor uma chave `oneSided`, porque hoje o viewer respeita o double-sided vindo do arquivo.
- O viewer já tinha fluxo de config por modelo para câmera, então o ponto mais seguro era ampliar esse mesmo caminho para material/render.

## Arquivos alterados

- src/lib/bedrock-renderer.ts
- src/components/ModelCarousel.astro
- src/data/site.ts

## Alterações aplicadas

### 1. Novo schema de render por modelo

No viewer agora existe uma configuração opcional neste formato:

```ts
render: {
  emissive?: boolean,
  emissiveIntensity?: number,
  oneSided?: boolean,
}
```

### 2. Emissive por item

Quando `render.emissive` estiver ativo:

- o material recebe emissive branco;
- o viewer reaproveita a textura base como `emissiveMap` quando não existir uma emissive própria;
- a intensidade pode ser controlada por `emissiveIntensity`.

Resultado prático:

- apenas os modelos marcados com essa flag passam a ter esse brilho/autoluz;
- modelos transparentes que você não quiser brilhando continuam normais.

### 3. One-sided por item

Quando `render.oneSided` estiver ativo:

- o viewer força `THREE.FrontSide` no material;
- isso sobrescreve o `doubleSided: true` vindo do GLTF.

Resultado prático:

- você pode deixar alguns modelos com face dupla e outros com comportamento one-sided, conforme a necessidade de outline ou recorte.

### 4. Fluxo completo models → carousel → renderer

- `src/data/site.ts` agora documenta o novo bloco `render`.
- `src/components/ModelCarousel.astro` serializa e envia essa config do card até o lightbox 3D.
- `src/lib/bedrock-renderer.ts` aplica a config somente ao modelo aberto.

## Como usar

Exemplo dentro de um item da const `models`:

```ts
{
  title: 'Meu Model',
  category: 'mobs',
  image: '/models/meu-model.png',
  model3d: '/models/meu-model.geo.gltf',
  camera: { ... },
  render: {
    emissive: true,
    emissiveIntensity: 1.6,
    oneSided: true,
  },
}
```

## Observação importante

- O `emissive` implementado aqui é autoluz no próprio material, no estilo de detalhe brilhando/sempre visível.
- Ele não adiciona bloom pós-processado ao redor do modelo.
- Se depois você quiser halo externo mesmo, isso pode virar uma segunda etapa separada e também opcional por item.

## Validação

- A implementação foi preparada para manter o comportamento atual dos modelos existentes.
- Só haverá mudança visual nos itens em que você adicionar o bloco `render`.