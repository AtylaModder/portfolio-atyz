# 2026-04-09 — Background Refinement Pass

## Pedido

- Manter a home como referência visual, sem mexer nela.
- Refinar o background do restante do site para acompanhar a elegância do topo.
- Diminuir a sensação de “partição” entre seções, deixando a transição do background mais contínua e suave.
- Evitar soluções simplórias como apenas amarelar o site inteiro.

## Diagnóstico

- A home já tinha uma linguagem visual mais rica por combinar:
  - split diagonal escuro/quente;
  - grid quase invisível;
  - formas geométricas com profundidade;
  - partículas e parallax do background global.
- Fora da home, várias seções tinham fundos individuais bonitos, mas mais isolados entre si.
- O maior motivo da sensação de “corte” entre blocos não era só o CSS local de cada seção: o background geométrico global mudava de humor por saltos via `IntersectionObserver`, em vez de fazer uma transição contínua entre seções.

## Arquivos alterados

- src/styles/global.css
- src/lib/geo-background.ts

## Alterações aplicadas

### 1. Linguagem visual da home espalhada pelo restante do site

Em src/styles/global.css:
- story, stats, projects, teams, models, visuals e contact ganharam fundos mais sofisticados com mistura de:
  - radiais suaves;
  - diagonais escuras/quentes;
  - grids quase invisíveis;
  - detalhes de brilho e geometria mais coerentes com a home.
- projects, models e visuals ganharam overlays diagonais e grids internos para reduzir a sensação de bloco “solto”.
- teams, que estava visualmente mais genérica, passou a ter fundo próprio mais rico e integrado.
- stats ganhou fundo mais atmosférico com geometria leve e grid sutil, para deixar de parecer apenas uma faixa funcional.
- contact foi refinada para conversar melhor com as seções anteriores e com o footer.
- footer recebeu uma camada diagonal extra para fechar melhor o fluxo visual do fim da página.

### 2. Continuidade visual entre seções

Em src/styles/global.css:
- foi adicionado um tratamento compartilhado para as seções fora da home, mantendo conteúdo acima e background abaixo de forma consistente.
- grids e painéis diagonais agora se repetem com variações entre seções, criando continuidade visual sem deixar tudo igual.
- alguns overlays passaram a reagir de forma sutil ao `--scroll-y`, reaproveitando o sistema já existente sem introduzir um novo scroll pesado.

### 3. Background geométrico global com transição realmente suave

Em src/lib/geo-background.ts:
- removida a troca discreta de mood por `IntersectionObserver`.
- o acento do canvas agora é interpolado continuamente com base na posição do centro do viewport entre as seções medidas na página.
- resultado esperado:
  - menos degraus de cor/opacidade;
  - menos sensação de “uma seção acabou, outra começou”;
  - mais coerência entre o background global e os fundos locais.

## Resultado esperado

- Restante do site visualmente mais próximo da home em riqueza e acabamento.
- Fundo mais contínuo entre story, stats, projects, teams, models, visuals e contact.
- Menos cortes visuais secos entre seções.
- Melhor sensação de profundidade e unidade sem voltar a pesar a navegação.

## Validação

- `npm run build` executado com sucesso após as alterações.
- Resultado:
  - 0 erros
  - 0 warnings
  - 5 hints já conhecidos do projeto

## Hints remanescentes

- `Sites antigo/portfolioantigo1/js/script.js` → variável `e` não utilizada.
- `Sites antigo/portfolioantigo2/js/script.js` → variável `sectionHeight` não utilizada.
- `src/layouts/BaseLayout.astro` → hint conhecido do Astro sobre JSON-LD inline.
- `src/lib/bedrock-renderer.ts` → `THREE.Clock` continua com aviso de depreciação.
- Vite ainda avisa sobre chunk grande no bundle lazy-loaded do viewer 3D.