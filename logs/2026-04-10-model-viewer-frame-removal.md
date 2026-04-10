# 2026-04-10 — Remoção da caixa do viewer 3D

## Pedido

- Remover a caixa visual ao redor dos modelos no lightbox 3D.
- Voltar à sensação anterior, com o modelo mais solto no overlay.

## Arquivo alterado

- src/styles/global.css

## Alterações aplicadas

- removidas as duas camadas decorativas do container do lightbox 3D (`::before` e `::after`);
- removidos fundo, borda, sombra e arredondamento do canvas do viewer;
- mantidos o overlay, os controles e o comportamento do lightbox.

## Resultado

- o modelo volta a aparecer sem a moldura retangular visível;
- o lightbox continua funcional, mas com visual mais limpo e próximo da versão anterior.

## Validação

- get_errors em src/styles/global.css: sem erros.
- npm run build: concluído com sucesso.
- Permaneceram apenas os hints antigos fora do escopo já existentes no projeto.