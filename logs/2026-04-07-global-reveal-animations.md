# 2026-04-07 — Global Reveal Animation System (GSAP ScrollTrigger)

## Resumo
Criado sistema global de animações scroll-reveal com GSAP ScrollTrigger. Classes CSS controlam o tipo de animação; o script centralizado inicializa tudo automaticamente.

---

## Arquivo criado

### `src/scripts/animations.ts`
- Exporta `initRevealAnimations()`.
- 4 variantes de reveal via classes CSS:
  - `.reveal-up` → fade + translateY(40px → 0)
  - `.reveal-left` → fade + translateX(−40px → 0)
  - `.reveal-right` → fade + translateX(40px → 0)
  - `.reveal-scale` → fade + scale(0.92 → 1)
- `.reveal-stagger` → children animam com 0.08s de stagger; direção herdada de classe reveal no grupo.
- `data-delay="N"` → atraso manual em segundos.
- Parâmetros: `duration: 0.7`, `ease: 'power3.out'`, `start: 'top 88%'`.
- `prefers-reduced-motion: reduce` → pula animações e seta `opacity: 1` imediatamente.

---

## Arquivos modificados

### `src/layouts/BaseLayout.astro`
- **Linha ~57:** Adicionado `import { initRevealAnimations } from '../scripts/animations';`
- **Linha ~81:** Chamada `initRevealAnimations()` no callback `onComplete` do loader.
- **Linha ~89:** Chamada `initRevealAnimations()` no branch `else` (sem loader).
- **`setupScrollAnimations()`:** Removidos 5 blocos de animação scroll inline que agora são cobertos pelo sistema centralizado:
  1. Story paragraphs reveal
  2. Story skills reveal
  3. Project-reveal from sides
  4. Generic `[data-reveal]` fade-up
  5. Contact items entrance
- **Mantidos:** hero entrance (`animateHero()`), hero parallax shapes, header scroll state, stats counter animation.

### `src/components/StorySection.astro`
- `.story__left` → adicionada classe `reveal-left`
- `.story__right` → adicionada classe `reveal-up`
- `.story__skills` → adicionada classe `reveal-up` + `data-delay="0.2"`

### `src/components/StatsSection.astro`
- `.stats__grid` → adicionada classe `reveal-stagger reveal-up`

### `src/components/FeaturedProjectsSection.astro`
- `.projects-section__heading` → adicionada classe `reveal-up`
- `.projects-grid` → adicionada classe `reveal-stagger reveal-scale`

### `src/components/TeamsSection.astro`
- `.teams-section__heading` → adicionada classe `reveal-up`
- `.teams-strip` → adicionada classe `reveal-stagger reveal-up`

### `src/components/ModelCarousel.astro`
- `.models-section__header` → adicionada classe `reveal-up`

### `src/components/VibrantVisualsSection.astro`
- `.visuals-section__heading` → adicionada classe `reveal-up`
- `.visuals-section__filters` → adicionada classe `reveal-up` + `data-delay="0.15"`

### `src/components/ContactSection.astro`
- `.contact-hub__header` → adicionada classe `reveal-up`
- `.contact-cards` → adicionada classe `reveal-stagger reveal-up`
- `.contact-hub__form-wrapper` → adicionada classe `reveal-left`
- `.contact-hub__social` → adicionada classe `reveal-right`

### `src/components/Footer.astro`
- `.footer__top` → adicionada classe `reveal-up`
- `.footer__bottom` → adicionada classe `reveal-up` + `data-delay="0.15"`

### `src/components/SectionHeading.astro`
- Adicionada classe `reveal-up` ao `class:list` existente.

---

## Build
`npx astro build` — **passou sem erros** (14.34s, 1 página).
