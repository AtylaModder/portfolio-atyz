# 2026-04-09 — Correção do Build na Vercel por Adapter Incompatível

## Problema

- Os deploys recentes na Vercel estavam falhando durante `npm run build`.
- O stack final mencionava `miniflare`, o que indicava tentativa de usar o adapter da Cloudflare dentro do ambiente da Vercel.

## Diagnóstico

- O projeto estava configurado com `@astrojs/cloudflare` de forma fixa em `astro.config.mjs`.
- O domínio em produção está sendo servido pela Vercel.
- Quando a Vercel executa o build com o adapter da Cloudflare, o pipeline puxa dependências e comportamento de Miniflare/Workers que não pertencem ao ambiente de deploy atual.

## Correção aplicada

- Foi instalado `@astrojs/vercel`, compatível com Astro 6.
- `astro.config.mjs` agora escolhe o adapter com base no ambiente:
  - build na Vercel → `@astrojs/vercel`
  - build local / deploy via Wrangler → `@astrojs/cloudflare`

## Arquivos alterados

- package.json
- package-lock.json
- astro.config.mjs

## Resultado esperado

- A Vercel deixa de tentar empacotar o projeto como Cloudflare Worker durante o build.
- O comando `npm run build` continua funcional localmente.
- O fluxo `npm run deploy` com Wrangler continua preservado para Cloudflare.

## Observação

- Isso corrige o erro de build da Vercel.
- Ainda pode existir uma segunda questão separada de infraestrutura, caso o domínio esteja ligado a outro projeto da Vercel ou a um branch incorreto.