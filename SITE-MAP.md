# 🗺️ MAPA COMPLETO DO SITE — ATYZ MODDER

> **Última atualização**: 8 de abril de 2026
> **URL**: https://atyzmodder.com
> **Repositório**: Portfolio pessoal de Atyla Smith (Atyz)
> **Descrição**: Portfólio de designer e desenvolvedor focado em Minecraft Bedrock — add-ons, texturas, modelagem 3D e direção visual.

---

## 📐 STACK TECNOLÓGICA

| Camada         | Tecnologia          | Versão    | Papel                                         |
|----------------|---------------------|-----------|-----------------------------------------------|
| Framework      | Astro               | ^6.1.4    | SSG (Static Site Generator)                   |
| Linguagem      | TypeScript          | ^5.9.3    | Tipagem e scripts                             |
| CSS Framework  | Tailwind CSS        | ^4.2.2    | Utility-first via `@tailwindcss/vite`         |
| Animação       | GSAP                | ^3.14.2   | ScrollTrigger, timelines, reveals, tilt 3D    |
| Scroll suave   | Lenis               | ^1.3.21   | Smooth scroll (desktop only)                  |
| 3D Rendering   | Three.js            | ^0.183.2  | Viewer de modelos GLTF, OrbitControls, SSAO   |
| Typing effect  | Typed.js            | ^3.0.0    | Efeito de digitação no Hero                   |
| Contagem       | CountUp.js          | ^2.10.0   | Animação numérica na seção Stats              |
| Partículas     | tsParticles (slim)  | ^3.9.1    | Partículas flutuantes no Hero                 |
| Carrossel      | Swiper              | ^12.1.3   | (disponível — carousel usa loop customizado)  |
| Ícones         | Pixel Icon Library  | ^1.0.6    | Ícones pixel-art HackerNoon (font-face)       |
| SEO            | @astrojs/sitemap    | ^3.7.2    | Gera sitemap.xml automaticamente              |
| Type checking  | @astrojs/check      | ^0.9.8    | Verificação de tipos Astro                    |

### Comandos

```bash
npm run dev       # Servidor local (Astro dev)
npm run build     # astro check && astro build
npm run preview   # Preview do build
```

### Config (astro.config.mjs)
- `site`: https://atyzmodder.com
- Integrations: `sitemap()`
- Vite plugin: `tailwindcss()`

### TypeScript
- Extends: `astro/tsconfigs/strict`

---

## 🏗️ ESTRUTURA DE ARQUIVOS

```
Portfolio/
├── astro.config.mjs           # Config principal Astro
├── package.json               # Dependências e scripts
├── tsconfig.json              # TypeScript strict mode
├── SITE-MAP.md                # ← Este arquivo
│
├── public/                    # Assets estáticos (servidos na raiz)
│   ├── favicon.svg
│   ├── robots.txt
│   ├── social-card.svg        # OG image para redes sociais
│   ├── fonts/pixel-icons/     # iconfont.eot/.woff/.woff2
│   ├── models/                # Modelos 3D + thumbnails
│   │   ├── *.geo.gltf         # Geometrias GLTF (hydra, titan, gamabunta, charmander)
│   │   ├── hydra.geo.json     # Geometria JSON alternativa
│   │   ├── hydra.animation.json
│   │   ├── *.png / *.gif      # Thumbnails dos modelos
│   ├── projects/              # Imagens de projetos (hydra.png, shinobi.png, rio.png)
│   ├── teams/                 # Avatares das equipes (a30x1.jpg, kubic.png, nindon.png)
│   └── visuals/               # Galeria Vibrant Visuals (1.png até 7.png)
│
├── src/
│   ├── data/site.ts           # ★ DADOS CENTRAIS (todo conteúdo editável do site)
│   ├── env.d.ts               # Tipos globais Astro
│   │
│   ├── layouts/
│   │   └── BaseLayout.astro   # Layout HTML base (head, meta, scripts, geo-bg)
│   │
│   ├── pages/
│   │   └── index.astro        # Página única — monta todas as seções
│   │
│   ├── components/            # 15 componentes Astro
│   │   ├── LoadingScreen.astro
│   │   ├── Header.astro
│   │   ├── HeroSection.astro
│   │   ├── StorySection.astro
│   │   ├── StatsSection.astro
│   │   ├── FeaturedProjectsSection.astro
│   │   ├── TeamsSection.astro
│   │   ├── ModelCarousel.astro
│   │   ├── VibrantVisualsSection.astro
│   │   ├── ContactSection.astro
│   │   ├── Footer.astro
│   │   ├── SectionHeading.astro
│   │   ├── ProjectCard.astro
│   │   ├── PlaceholderFrame.astro
│   │   └── Icon.astro
│   │
│   ├── scripts/               # Scripts TypeScript client-side
│   │   ├── perf-tier.ts       # Detecção de performance (antes de tudo)
│   │   ├── animations.ts      # GSAP ScrollTrigger reveals globais
│   │   ├── countup-stats.ts   # CountUp.js para números
│   │   ├── custom-cursor.ts   # Cursor dual (dot + ring) RGB dinâmico
│   │   ├── hero-particles.ts  # tsParticles no hero
│   │   ├── hero-typed.ts      # Typed.js digitação
│   │   └── microinteractions.ts # Magnetic buttons, 3D tilt, icon glow
│   │
│   ├── lib/                   # Módulos utilitários
│   │   ├── bedrock-renderer.ts # Viewer Three.js (GLTF, SSAO, OrbitControls)
│   │   └── geo-background.ts  # Background geométrico animado (3 layers)
│   │
│   └── styles/
│       ├── global.css         # CSS global (reset, componentes, animações, responsivo)
│       └── tokens.css         # Design tokens (cores, tipografia, espaçamento, sombras)
│
└── logs/                      # Histórico de alterações
    ├── 2026-04-06-portfolio-site.md
    ├── 2026-04-07-contact-background-fix.md
    └── 2026-04-07-global-reveal-animations.md
```

---

## 🎨 IDENTIDADE VISUAL

### Tema
- **Modo**: Dark mode exclusivo (sem light mode)
- **Estilo**: Premium, clean, gaming-inspired dashboard
- **Fonte**: Montserrat (Google Fonts) — pesos 300 a 900

### Paleta de Cores Principal

| Token              | Valor            | Uso                                    |
|--------------------|------------------|----------------------------------------|
| `--color-primary`  | `#e7c34f`        | Ouro — cor principal, CTAs, destaques  |
| `--color-secondary`| `#FFB366`        | Âmbar — acentos secundários            |
| `--color-accent`   | `#FF8A80`        | Coral — acentos terciários             |
| `--color-cyan`     | `rgb(80,200,220)`| Cyan — projetos, stats                 |
| `--color-violet`   | `rgb(160,120,255)`| Violeta — teams, destaques alternativos|

### Backgrounds

| Token              | Valor     | Uso                       |
|--------------------|-----------|---------------------------|
| `--color-bg`       | `#0f1318` | Fundo principal (escuro)  |
| `--color-bg-soft`  | `#141a21` | Fundo suave               |
| `--color-bg-card`  | `#181e26` | Cards                     |
| `--color-bg-footer`| `#080a0e` | Footer                    |

### Texto

| Token            | Valor     | Uso                |
|------------------|-----------|--------------------|
| `--color-text`   | `#f3f1ea` | Texto principal    |
| `--color-muted`  | `#8a94a6` | Texto secundário   |
| `--color-sand`   | `#efe1b5` | Texto destaque warm|

### Tipografia

| Nível      | Tamanho                          | Peso |
|------------|----------------------------------|------|
| Hero title | `clamp(4rem, 15vw, 12rem)`      | 900  |
| H1         | `clamp(2rem, 5vw, 3.2rem)`      | 700  |
| H2         | `1.5rem`                         | 700  |
| H3         | `1.15rem`                        | 700  |
| Body       | `0.95rem`                        | 400  |
| Small      | `0.82rem`                        | 400  |
| XS         | `0.72rem`                        | 400  |

### Easing Functions
- `--ease-out-expo`: `cubic-bezier(0.16, 1, 0.3, 1)`
- `--ease-out-quart`: `cubic-bezier(0.25, 1, 0.5, 1)`
- `--ease-out-smooth`: `cubic-bezier(0.22, 1, 0.36, 1)`

### Border Radius
- De `2px` (xs) até `32px` (7xl), `999px` (pill), `50%` (full)

### Sombras
- Card: `0 12px 40px rgba(0,0,0,0.32)` + inner border highlight
- Card hover: `0 28px 64px rgba(0,0,0,0.45)` + glow gold
- Lightbox: `0 40px 80px rgba(0,0,0,0.5)`

---

## 📄 SEÇÕES DA PÁGINA (em ordem)

A página é single-page com scroll. Ordem de renderização:

### 1. Loading Screen
- **Componente**: `LoadingScreen.astro`
- Splash com logo (diamond rotacionado + brand "ATYZ")
- 6 partículas coloridas com animação `loader-particle-float`
- Spin contínuo no diamond: `loader-spin` (45° → 405°, 1.8s)
- Aguarda `document.fonts.ready` + imagens do hero
- Delay mínimo: 800ms, máximo: 4s
- Logo voa suavemente para a posição do header (GSAP flyto)
- Transição: opacity 0 → `display: none`

### 2. Header (fixo)
- **Componente**: `Header.astro`
- Logo: quadrado rotacionado 45° com gradiente ouro + texto "ATYZ"
- Navegação: Sobre | Projetos | Modelos | Vibrant Visuals
- CTA: botão "Contato"
- **Estado scrolled** (scroll > 80px): backdrop-blur 16px, border highlight
- Mobile: nav escondida (< 768px)

### 3. Hero Section
- **Componente**: `HeroSection.astro`
- **Altura**: 100vh
- Tag badge: "Designer & Developer"
- Título gigante: "Atyz" (clamp 4rem → 12rem)
- Subtítulo com **Typed.js**: roda ["Modder", "Texture Maker", "PBR Artist", "Bedrock Developer"]
  - typeSpeed: 60ms, backSpeed: 35ms, backDelay: 2s, loop infinito
- 2 botões CTA (primário gold + outline)
- Scroll indicator pulsante
- 7 formas geométricas flutuantes com parallax (data-parallax 0.2-0.6)
- Grid overlay semi-transparente
- Gradiente diagonal (polígono clipped 35% width)
- **Partículas** (tsParticles): 35 no desktop, 15 mobile, 0 low-end
  - 5 cores: gold, amber, coral, cyan, violet
  - Forma: circle, 1.5-2.5px, opacity 0.15-0.4
- **Entrada GSAP**: timeline sequencial (tag → title → subtitle → cta → scroll)

### 4. Story Section (Sobre)
- **Componente**: `StorySection.astro`
- **ID**: `#about`
- Grid 2 colunas (desktop)
- **Esquerda**: eyebrow "About Me" + título com gradient text + placeholder frame (portrait)
- **Direita**: 3 parágrafos sobre Atyz + 7 skill tags:
  - Graphic Design, Modeling 3D, Illustration, PBR Artist, Visual Direction, Add-on Dev, Texture Art
- Background: radial gradients sutis + floating diamond

### 5. Stats Section
- **Componente**: `StatsSection.astro`
- Grid: 2 cols mobile → 4 cols desktop
- 4 estatísticas com **CountUp.js** (animação ao entrar na viewport 80%):
  1. **4+** Anos de Experiência
  2. **20+** Projetos Entregues
  3. **500K+** Downloads
  4. **12+** Modelos Criados
- Duration: 2.5s, easeOutExpo, separador "."

### 6. Featured Projects
- **Componente**: `FeaturedProjectsSection.astro`
- **ID**: `#projects`
- Grid responsivo: 1 → 2 → 3 colunas
- 3 projetos (dados de `site.ts`):

| Projeto        | Tipo            | Accent  | Tags                           | Link             |
|----------------|-----------------|---------|--------------------------------|------------------|
| Hydra          | Add-on de batalha| amber  | Modeling, Development, Direction| #               |
| Shinobi Craft  | Add-on temático | coral   | Modeling, Development, Direction| #               |
| Rio de Janeiro | Mapa completo   | cyan    | Map, VibrantVisuals, Design    | YouTube link    |

- **Efeitos por card**:
  - 3D Tilt ao hover (rotateX/Y ±8°, perspective 800px)
  - Specular highlight (radial gradient 600px segue mouse)
  - Zoom de imagem (1.08x no hover)
  - Glow colorido por accent tone
  - Reveal stagger (0.08s entre cards)
  - Numeração ordinal (01, 02, 03)
  - Arrow icon com transform no hover

### 7. Teams Section
- **Componente**: `TeamsSection.astro`
- 3 parceiros/equipes:

| Equipe  | Role                       | Nota                                      | Accent  |
|---------|----------------------------|-------------------------------------------|---------|
| A30x1   | Minecraft Official Partner | Criadora do mapa Rio de Janeiro           | green   |
| Kubic   | Estúdio de Add-ons         | Criadora do Hydra — desenvolvida por mim  | yellow  |
| Nindon  | Estúdio de Add-ons         | Criadora do Shinobi Craft — desenvolvida por mim | red |

- Cards com avatar ring (gradiente da cor), nome, role, nota
- Glow colorido ao hover + accent line bottom
- Links externos (nova aba)

### 8. Model Carousel
- **Componente**: `ModelCarousel.astro`
- **ID**: `#models`
- Carrossel infinito horizontal (full-bleed)
- Velocidade: 0.45px/frame, drag & drop
- Filtros: All | Characters | Blocks | Mobs
- 7 modelos:

| Modelo         | Categoria   | Tipo       | 3D viewer? |
|----------------|-------------|------------|------------|
| Wardrobe       | blocks      | Imagem     | Não        |
| Gamabunta      | mobs        | GLTF 3D   | Sim        |
| Hydra Boss     | mobs        | GLTF 3D   | Sim        |
| Titan          | mobs        | GLTF 3D   | Sim        |
| Charmander     | mobs        | GLTF 3D   | Sim        |
| Custom Skin    | characters  | GIF        | Não        |
| Base Character | characters  | GIF        | Não        |

- Cards: aspect 3/4, shine overlay, badge "3D", hover translateY(-12px) + scale(1.03)
- **Lightbox de imagem**: overlay fullscreen
- **Lightbox 3D** (Three.js):
  - OrbitControls interativo
  - Camera presets por modelo (angle, height, zoom, ortho)
  - Studio lighting (5 luzes: ambient, hemisphere, key, fill, rim)
  - SSAO post-processing
  - Nearest-neighbor filtering (preserva pixel art)
  - Hints visuais (drag, pan, zoom icons)

### 9. Vibrant Visuals Gallery
- **Componente**: `VibrantVisualsSection.astro`
- **ID**: `#visuals`
- Galeria masonry (auto-fill minmax 300px → 3 cols)
- Filtros: All | Blocks | Entities | Items | Lighting
- 7 imagens (public/visuals/1.png a 7.png)
- Cards: aspect 16/9, overlay gradient, zoom icon, category label + title + caption
- Shine effect, border glow hover
- Lightbox fullscreen com backdrop blur

### 10. Contact Section
- **Componente**: `ContactSection.astro`
- 3 orbes de fundo com animação drift (parallax responsivo, 16-20s)
- 3 cards de contato (Email, Telefone, Localização) com glow hover
- Badge "Disponível para projetos" (ponto verde piscante)
- Formulário: nome, email, mensagem — floating labels
- Sidebar de redes sociais (Instagram, LinkedIn, Behance, GitHub)

### 11. Footer
- **Componente**: `Footer.astro`
- Pixel dissolve mask (canvas hidden gera máscara)
- Logo + brand animados
- Links: Sobre, Projetos, Contato
- 6 ícones redes sociais
- 2 formas flutuantes (diamond + ring, animação float-slow)
- Copyright dinâmico com ano atual

---

## ⚡ SISTEMAS E FUNCIONALIDADES

### Sistema de Performance (perf-tier.ts)
Detecta as capacidades do dispositivo e ajusta o site:

| Flag               | Critério                          | Efeito                              |
|--------------------|-----------------------------------|-------------------------------------|
| `isTouch`          | `pointer: coarse`                 | Desativa cursor custom, Lenis       |
| `isReducedMotion`  | `prefers-reduced-motion`          | Pula todas animações GSAP/typed     |
| `isLowEnd`         | `hardwareConcurrency < 4`         | Sem partículas, sem micro           |
| `noBackdrop`       | Sem suporte backdrop-filter       | Fallback sem glassmorphism          |
| `isMobile`         | Touch OR width < 768px            | Partículas reduzidas (15 vs 35)     |
| FPS monitor        | avg FPS < 28 por 2s               | Adiciona `.perf-no-backdrop`        |

### Sistema de Animações (animations.ts)
GSAP + ScrollTrigger com 4 classes de reveal:
- `.reveal-up` → translateY(40px → 0)
- `.reveal-left` → translateX(-40px → 0)
- `.reveal-right` → translateX(40px → 0)
- `.reveal-scale` → scale(0.92 → 1)
- `.reveal-stagger` → filhos com 80ms delay entre si
- Duration: 0.7s, ease: `power3.out`, trigger: `top 88%`

### Background Geométrico (geo-background.ts)
- 3 canvas layers (far, mid, near) com parallax CSS
- 11 shapes totais (4 far + 4 mid + 3 near)
- 6 tipos de forma: diamond, hexagon, triangle, ring, dot, line
- **Mood por seção** — cor muda suavemente ao scrollar:

| Seção    | Cor RGB           | Opacidade |
|----------|-------------------|-----------|
| Hero     | 231, 195, 79 (ouro)| 1.0      |
| Story    | 255, 179, 102 (âmbar)| 0.9    |
| Stats    | 80, 200, 220 (cyan)| 0.85     |
| Projects | 231, 195, 79 (ouro)| 1.1      |
| Teams    | 160, 120, 255 (violet)| 0.9    |
| Models   | 80, 200, 220 (cyan)| 1.0      |
| Visuals  | 255, 138, 128 (coral)| 1.0     |
| Contact  | 231, 195, 79 (ouro)| 0.8      |

- Transição 800ms ease via CSS `@property` registered custom properties
- Mouse parallax real-time (offset por posição do mouse)
- Drift com funções sine/cosine (amplitude e frequência random)

### Cursor Customizado (custom-cursor.ts)
- **Dot**: 6px círculo, cor RGB dinâmica (sinc com geo-bg)
- **Ring**: 32px border, segue com GSAP quickTo (0.45s lag)
- **Estados**:
  - Normal: ring 32px
  - Hover (links/buttons): ring 56px, dot 30% opacity
  - 3D viewer: ring 40px quadrado
- Cor sincroniza com `--geo-accent-r/g/b` a cada 500ms
- Escondido em touch devices

### Smooth Scroll (Lenis)
- Integrado com GSAP ScrollTrigger
- lerp: 0.075, wheelMultiplier: 1
- Desativado em dispositivos touch

### Viewer 3D (bedrock-renderer.ts)
- Three.js com OrbitControls
- Suporta modelos GLTF
- Camera orthográfica ou perspectiva (configurável por modelo)
- Studio lighting: 5 luzes (ambient, hemisphere, key, fill, rim + bottom)
- SSAO post-processing
- Auto-center e auto-scale baseado no bounding box
- Nearest-neighbor texture filtering (pixel art)
- Tone mapping: NoToneMapping (preserva cores Minecraft exatas)

### Microinterações (microinteractions.ts)
1. **Magnetic Buttons**: atraem dentro de 80px, força 30%
2. **3D Tilt**: rotateX/Y até ±8° em project cards, specular highlight
3. **Icon Glow**: hover scale 1.12 + box-shadow (CSS-only)

---

## 🔤 ÍCONES (Pixel Icon Library — HackerNoon)

Ícones carregados via @font-face (`iconfont.woff2`). Classe base `.hn`, variações:

| Classe                           | Uso                  |
|----------------------------------|----------------------|
| `.hn-instagram`                  | Rede social          |
| `.hn-linkedin`                   | Rede social          |
| `.hn-behance`                    | Rede social          |
| `.hn-github`                     | Rede social          |
| `.hn-message-solid`              | Email (contato)      |
| `.hn-phone-ringing-high-solid`   | Telefone (contato)   |
| `.hn-location-pin-solid`         | Localização (contato)|
| `.hn-arrow-left-solid`           | Navegação            |
| `.hn-arrow-right-solid`          | Navegação            |
| `.hn-globe-solid`                | Link externo         |
| `.hn-code-solid`                 | Dev                  |
| `.hn-eye-solid`                  | Visualizar           |
| `.hn-fire-solid`                 | Destaque             |
| `.hn-crown-solid`                | Premium              |
| `.hn-star-solid`                 | Rating               |
| `.hn-download-solid`             | Download             |
| `.hn-bolt-solid`                 | Performance          |
| `.hn-heart-solid`                | Favorito             |
| `.hn-external-link-solid`        | Link externo         |
| `.hn-user-solid`                 | Usuário              |
| `.hn-grid-solid`                 | Grid                 |
| `.hn-search-solid`               | Busca                |
| `.hn-home-solid`                 | Home                 |
| `.hn-bookmark-solid`             | Bookmark             |
| `.hn-trophy-solid`               | Troféu               |
| `.hn-clock-solid`                | Tempo                |

Além disso, 11 **ícones SVG customizados** via `Icon.astro`:
- texture, materials, lighting, direction, assets, interface, concept, study, build, refine, deliver

---

## 🎬 ANIMAÇÕES (KEYFRAMES CSS)

| Nome                     | Duração   | Uso                                      |
|--------------------------|-----------|------------------------------------------|
| `grain`                  | 8s steps  | Film grain overlay (background-position)  |
| `loader-spin`            | 1.8s      | Spin do diamond na loading screen         |
| `loader-particle-float`  | 3s        | Partículas da loading screen              |
| `scroll-pulse`           | 2s        | Indicador de scroll no hero               |
| `typed-blink`            | 0.7s      | Cursor do Typed.js                        |
| `float-slow`             | 14-22s    | Formas decorativas (diamond, ring)        |
| `contact-orb-drift-1/2/3`| 16-20s   | Orbes de fundo no contato                 |
| `pulse-dot`              | 2s        | Dot verde de disponibilidade              |
| `card-reveal`            | 0.5s      | Reveal de project cards                   |
| `team-reveal`            | 0.45s     | Reveal de team cards                      |
| `vt-fade-scale-out/in`   | 0.2-0.25s| View transitions Astro                    |

---

## 🌐 SEO & META TAGS

Configurados no `BaseLayout.astro`:

- **Charset**: UTF-8
- **Viewport**: `width=device-width, initial-scale=1`
- **Canonical URL**: href dinâmico
- **Theme color**: `#0f1318`
- **OG**: type website, locale pt_BR, image `/social-card.svg`
- **Twitter Card**: summary_large_image
- **Schema.org**: JSON-LD tipo `Person`
- **Google Search Console**: meta tag `google-site-verification`
- **Keywords**: Atyz, Atyla Smith, Minecraft Bedrock, add-ons, texturas, modelagem 3D, modding, designer, developer... (14 tags)
- **Sitemap**: Gerado automaticamente via `@astrojs/sitemap`
- **robots.txt**: Presente em `/public/robots.txt`

---

## 📁 ASSETS ESTÁTICOS (public/)

### Fontes
- `fonts/pixel-icons/iconfont.eot`
- `fonts/pixel-icons/iconfont.woff`
- `fonts/pixel-icons/iconfont.woff2`

### Modelos 3D
- `models/hydra.geo.gltf` + `hydra.geo.json` + `hydra.animation.json`
- `models/titan.geo.gltf`
- `models/gamabunta.geo.gltf`
- `models/charmander.geo.gltf`

### Thumbnails de Modelos
- `models/hydra.png`, `models/titan.png`, `models/gamabunta.png`
- `models/charmander.png`, `models/wardrobe.png`, `models/dragon.png`
- `models/skin.gif`, `models/base_3_4.gif`, `models/player2.gif`

### Imagens de Projetos
- `projects/hydra.png`, `projects/shinobi.png`, `projects/rio.png`

### Avatares de Equipes
- `teams/a30x1.jpg`, `teams/kubic.png`, `teams/nindon.png`

### Galeria Vibrant Visuals
- `visuals/1.png` a `visuals/7.png`

### Outros
- `favicon.svg`
- `social-card.svg`
- `robots.txt`

---

## 📊 DADOS CENTRAIS (src/data/site.ts)

Arquivo único que alimenta todo o conteúdo do site. Tipos e exports:

```typescript
// Tipo de accent por projeto/componente
type AccentTone = 'amber' | 'coral' | 'violet' | 'cyan';

// Exports disponíveis:
siteMeta       // título, descrição, url, ogImage, keywords
navigation     // 4 links de nav (#about, #projects, #models, #visuals)
heroData       // tag, name "Atyz", subtitle
storyParagraphs // 3 parágrafos "Sobre mim"
skills         // 7 skills listadas
stats          // 4 estatísticas com value, suffix, label
services       // 6 serviços (icon, title, description)
projects       // 3 projetos (title, role, description, tags, accent, image, link)
modelCategories // ["All", "Characters", "Blocks", "Mobs"]
teams          // 3 equipes (name, role, note, image, accent, link)
models         // 7 modelos (id, title, category, image, model3d?, camera?)
```

---

## 📱 RESPONSIVIDADE

| Breakpoint | Comportamento                                             |
|------------|-----------------------------------------------------------|
| < 640px    | 1 coluna, nav escondida, gaps menores                     |
| 640-768px  | 2 colunas em stats e projects                             |
| 768px+     | Nav visível, grids completos, Story 2 colunas             |
| 1024px+    | Projects 3 colunas, Model cards maiores                   |
| 1200px+    | Containers max-width, espaçamentos maiores                |

---

## ♿ ACESSIBILIDADE

- `prefers-reduced-motion` respeitado: pula GSAP, Typed.js, partículas
- Cursor custom escondido em touch
- Semantic HTML (main, nav, section, footer)
- `aria-label` em botões e links
- Focus states preservados

---

## 📝 NOTAS PARA MODIFICAÇÕES

1. **Todo conteúdo editável** está em `src/data/site.ts` — altere textos, projetos, equipes e modelos lá.
2. **Cores e tokens visuais** estão centralizados em `src/styles/tokens.css`.
3. **CSS global e componentes** ficam em `src/styles/global.css`.
4. **Cada seção** é um componente isolado em `src/components/`.
5. **Scripts de animação** são independentes em `src/scripts/` — fácil de desativar ou modificar individualmente.
6. **O background geométrico** (geo-background.ts) é renderizado em 3 canvas e suas cores mudam conforme a seção visível.
7. **Placeholders** com `PlaceholderFrame.astro` estão presentes em alguns locais — substituir por imagens reais quando disponíveis.
8. **Build**: Rodar `npm run build` valida tipos e gera site estático.
9. **Logs de alterações** ficam na pasta `logs/` para rastreabilidade.
