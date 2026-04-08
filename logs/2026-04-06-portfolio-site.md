# Log de implementação

Data: 2026-04-06
Última atualização: sessão dinâmica (scroll-driven redesign)

## Objetivo

Criar um portfólio pessoal para Atyla Smith / Atyz com experiência de navegação dinâmica, imersiva e scroll-driven — inspirado em NinjaBlock.gg, WaypointStudios.com e LeadPro.site.

## Stack

- Astro 6 (site estático)
- Tailwind CSS via @tailwindcss/vite
- **GSAP + ScrollTrigger** (animações scroll-driven)
- Swiper (instalado, carousel models usa scroll nativo)
- TypeScript com dados centralizados
- Montserrat (fonte única para display + body)

## Estrutura atual

### Páginas
- `src/pages/index.astro` — Composição: LoadingScreen → Header → Hero → Story → Stats → FeaturedProjects → Models → Contact → Footer

### Layout
- `src/layouts/BaseLayout.astro` — HTML shell, meta tags, script GSAP central com:
  - Loading screen fade-out (2.2s delay)
  - Hero entrance staggered (tag → title → subtitle → CTA)
  - Parallax em `[data-parallax]` shapes
  - Header scroll state via `#site-header`
  - Story paragraphs reveal via `[data-story-index]`
  - Stats counter animation via `[data-counter]`
  - Project reveal alternado (left/right) via `[data-project-reveal]`
  - Model cards stagger entrance
  - Contact items slide-in
  - Generic `[data-reveal]` reveal animation

### Componentes
- `LoadingScreen.astro` — Diamond spinner + "ATYZ" brand, overlay z-9999
- `Header.astro` — Fixed, transparent → solid on scroll (`.is-scrolled`), diamond mark + nav + CTA
- `HeroSection.astro` — 100vh, floating shapes (diamond/cube/ring/dots/lines) com data-parallax, grid overlay, diagonal gradient, scroll indicator
- `StorySection.astro` — Two-column, storyParagraphs + skills pills, scroll-revealed
- `StatsSection.astro` — 4-column grid, animated counters (data-counter), suffixes
- `FeaturedProjectsSection.astro` — Alternating left/right layout, data-project-reveal
- `ModelCarousel.astro` — Category filter buttons + horizontal scroll carousel + prev/next nav
- `ContactSection.astro` — Contact info cards (email/phone/location) + form
- `Footer.astro` — Diamond mark + nav links + social links + copyright

### Dados (src/data/site.ts)
- `siteMeta` — title, description, keywords, url
- `navigation` — Sobre, Projetos, Modelos, Contato
- `heroData` — tag, name "Atyz", subtitle
- `storyParagraphs` — 3 parágrafos sobre o artista
- `skills` — 8 tags (Graphic Design, Modeling 3D, Add-on Development, etc.)
- `stats` — 4 itens com value numérico (4+ anos, 20+ projetos, 500K+ downloads, 12+ modelos)
- `projects` — Hydra (amber) e Shinobi Craft (coral)
- `modelCategories` — All, Characters, Blocks, Items, Mobs
- `models` — 12 modelos com id/title/category
- `contactInfo` — email real, telefone real, location
- `socialLinks` — Instagram, LinkedIn, Behance, GitHub (URLs placeholder)

### Estilos (src/styles/global.css)
- Design tokens: --color-primary #e7c34f, --color-secondary #FFB366, --color-accent #FF8A80
- Loading screen keyframe (loader-spin)
- Header fixo com transição `.is-scrolled`
- Hero 100vh com shapes, grid overlay, scroll pulse
- Buttons `.btn--primary` e `.btn--outline`
- Story section two-column
- Stats grid 2→4 columns responsivo
- Projects alternating layout com overlap negativo
- Models horizontal carousel com scroll-snap
- Contact grid 1→2 columns
- Footer com diamond mark

## Componentes removidos (não mais utilizados)
- AboutSection.astro → substituído por StorySection
- AssetsSection.astro → removido (desnecessário)
- ProcessSection.astro → removido
- TestimonialsSection.astro → removido
- ServicesSection.astro → removido

## Decisões de implementação

- GSAP ScrollTrigger controla todas as animações scroll-driven centralmente no BaseLayout
- Body inicia com class `is-loading`, removida após loader fade-out
- `.page-wrap` inicia com opacity:0, revelado após loader
- Shapes parallax usam data-attributes para velocidade individual
- Counters usam objeto proxy `{ val }` animado por GSAP, arredondado via Math.round
- Projetos revelados com `x` offset alternado (esquerda/direita)
- Model carousel usa scroll nativo com scroll-snap (sem Swiper)
- Filtros de models usam display:none/show via JS vanilla
- Build: `npm run build` compila com 0 erros

## Pendências para publicação

- Inserir domínio real em astro.config.mjs
- Preencher links de Discord, e-mail, Instagram, Behance e GitHub
- Trocar depoimentos placeholder por falas reais
- Substituir imagens placeholder por assets finais
- Configurar envio do formulário

## Redesign visual inspirado nos sites antigos

### Objetivo

- Reduzir a sensacao de portfolio generico e aproximar a home da estrutura do portfolioantigo1
- Manter a base em Astro sem abrir imagens ou gifs dos assets antigos para evitar crash
- Reforcar leitura de designer de Minecraft Bedrock por composicao, paleta e showcase

### Arquivos atualizados

- src/pages/index.astro: simplificacao da home para hero, sobre, projetos, modelos, direcao visual e contato
- src/data/site.ts: navegacao nova, textos mais autorais, novas tags de assinatura, notas de direcao visual e paleta ajustada
- src/components/Header.astro: marca, navegação e CTA mais proximos da linguagem do portfolio antigo
- src/components/HeroSection.astro: hero refeita com composicao assimetrica, vitrine principal e tags de especialidade
- src/components/AboutSection.astro: secao reorganizada para apresentacao mais direta, com retrato principal, texto corrido e tags visuais
- src/components/FeaturedProjectsSection.astro: troca da grade uniforme por lista de cases em destaque
- src/components/ProjectCard.astro: layout alternado esquerda/direita inspirado no primeiro portfolio antigo
- src/components/ModelCarousel.astro: vitrine de modelos com categorias visuais e cards mais editoriais
- src/components/AssetsSection.astro: secao convertida de lista interna de pendencias para bloco publico de direcao visual
- src/components/ContactSection.astro: texto e formulario ajustados para parecer briefing inicial, nao bloco tecnico
- src/components/Footer.astro: copy atualizada para combinar com a nova direcao
- src/styles/global.css: nova base visual com tipografia Montserrat, paleta mineral quente, paines mais solidos, hero angular e suporte aos projetos alternados

### Decisoes de design

- As secoes Services, Process e Testimonials sairam da pagina principal porque empurravam a home para um formato muito corporativo
- A linguagem visual passou a usar areia, cobre e coral como base, com azul e ciano apenas em contraste e foco
- O portfolio agora depende mais de grandes vitrines e menos de muitos cards pequenos
- A secao de assets pendentes deixou de ser publica, porque isso enfraquecia a percepcao profissional do site

### Validacao

- npm run build executado com sucesso
- astro check sem erros
- Permaneceram apenas 2 hints em arquivos legados nao utilizados: Sites antigo/portfolioantigo1/js/script.js e Sites antigo/portfolioantigo2/js/script.js

---

## Sessao: Redesign da Contact Section

### Problema diagnosticado

- Todos os itens de contato (email, telefone, localizacao) e o formulario tinham `class="reveal"` + `data-reveal`
- `.reveal` inicia com `opacity: 0; transform: translateY(28px)` e depende do GSAP ScrollTrigger para adicionar animacao de entrada
- O ScrollTrigger nao estava alcancando esses elementos corretamente, deixando-os invisiveis
- Apenas os social links (que nao tinham a classe `reveal`) eram visiveis

### Redesign completo — "Contact Hub"

**Arquivos alterados:**
- `src/components/ContactSection.astro` — reescrito do zero
- `src/styles/global.css` — CSS das linhas ~1000-1140 substituido (antigo `.contact-section` → novo `.contact-hub`)

**Nova estrutura:**
1. **Background animado** — grid sutil com mask radial + 3 orbs flutuantes com blur que reagem ao mouse (parallax via GSAP)
2. **Header** — titulo em 2 linhas com acento em gradient text + divisor animado com dot brilhante
3. **Contact Cards** (3 cards em row) — Email, Telefone, Localizacao. Cada um:
   - Icone pixel em caixa com gradient, glow ao hover
   - Label, valor, acao que aparece no hover (slide up)
   - Email e telefone sao `<a>` clicaveis (mailto:/tel:)
   - Hover: translateY(-6px), box-shadow profundo, glow radial
4. **Body (form + social sidebar)** — grid 1.6fr + 1fr no desktop
   - **Form**: floating labels (sobem ao focar/preencher), linha gradient animada no foco, input glow, barra gradient no topo do wrapper
   - **Social sidebar**: botoes verticais com icone + label + seta que aparece no hover, translateX(4px)
   - **Badge de disponibilidade**: "Disponível para novos projetos" com dot verde pulsante
5. **Animacoes GSAP**: header stagger, cards stagger, form slide-left, social slide-right, orbs parallax mousemove

**Icones usados (pixel library):**
- hn-message-solid, hn-phone-ringing-high-solid, hn-location-pin-solid
- hn-instagram, hn-linkedin, hn-behance, hn-github
- hn-arrow-right-solid (novo — nos cards e botao submit)

**CSS novo adicionado (~280 linhas):**
- `.contact-hub`, `.contact-hub__bg`, `.contact-hub__grid`, `.contact-hub__orb` (1-3)
- `.contact-hub__header`, `__title`, `__title-accent`, `__divider`, `__divider-dot`
- `.contact-cards`, `.contact-card`, `__glow`, `__icon`, `__label`, `__value`, `__action`
- `.contact-hub__body`, `__form-wrapper`, `__form-header`, `__form-title`, `__form-subtitle`
- `.contact-hub__field` (floating label system), `__field-line`, `__submit`, `__submit-icon`
- `.contact-hub__social`, `__social-label`, `__social-links`, `__social-btn`, `__social-icon`, `__social-name`, `__social-arrow`
- `.contact-hub__availability`, `__status-dot`, `@keyframes pulse-dot`

### Validacao

- npm run build: sucesso, 0 erros
- Fix TypeScript: `addEventListener('mousemove', ...)` precisou de cast `as EventListener` para MouseEvent