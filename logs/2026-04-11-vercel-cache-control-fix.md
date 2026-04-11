# 2026-04-11 - Vercel cache control fix

## Problema

- O GitHub e os deployments da Vercel estavam atualizando normalmente.
- O dominio principal podia continuar servindo HTML antigo em cache no edge, dando a impressao de que o deploy nao entrou.

## Diagnostico

- O projeto estava gerando deployments de producao a cada commit relevante.
- O dominio principal respondia com headers de cache do edge da Vercel e `Age` alto.
- O site e single-page, entao o ponto critico e o cache do HTML da home.

## Correcao aplicada

- Criado `vercel.json` na raiz do projeto.
- A home (`/` e `/index.html`) agora envia headers para impedir reuso de HTML antigo:
  - `Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0`
  - `Pragma: no-cache`
  - `Expires: 0`
- Assets versionados de `/_astro/` mantem cache longo e imutavel.
- Midias estaticas (`/fonts`, `/models`, `/projects`, `/teams`, `/visuals`) mantem cache publico com `stale-while-revalidate`.

## Resultado esperado

- Cada novo deploy de producao deve refletir a home nova sem depender de cache antigo do edge.
- Os arquivos pesados continuam com cache forte para nao prejudicar performance.

## Observacao operacional

- Ainda vale revisar o DNS do apex do dominio fora da Vercel para deixar o fluxo mais previsivel.
- Mesmo com isso, esta configuracao reduz bastante a chance de o HTML ficar preso em cache depois de deploy.