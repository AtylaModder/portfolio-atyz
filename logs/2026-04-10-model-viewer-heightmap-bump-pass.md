# 2026-04-10 — Ajuste de Contraste da Luz e Recuo do Height Map para Bump

## Pedido

- A luz premium ainda parecia pálida e com luz demais apontada para o modelo.
- O normal map gerado a partir do height map não estava dando sensação de relevo/concavidade; parecia só iluminar partes da textura.

## Diagnóstico

- O rig ainda tinha contribuição frontal demais no key/fill, o que reduzia sombra útil e achatava a leitura.
- O normal map derivado do height map criava resposta de luz estranha para esse tipo de textura pixelada e UV de modelo Blockbench.

## Alterações aplicadas

### 1. Menos luz frontal no modo premium

- o key light foi puxado para um ângulo menos frontal;
- o fill foi reduzido e saiu mais do eixo da câmera;
- o rim e a sombra de contato ganharam mais peso relativo;
- ambient/hemi foram reduzidas para devolver profundidade.

### 2. Height map voltou para relevo por bump invertido

- o sidecar externo continua sendo carregado corretamente;
- o normal map gerado foi removido do fluxo;
- o relevo voltou a usar `bumpMap` com escala invertida, o que fica mais próximo da lógica pedida de preto para fora e branco para concavo.

## Validação

- `get_errors` no renderer: sem erros.
- `npm run build`: concluído com sucesso.

## Observação

- Se a Hydra ainda ficar suave demais, o próximo ajuste objetivo é subir ou descer `heightMapStrength` no `site.ts` agora que o renderer voltou para bump direto.