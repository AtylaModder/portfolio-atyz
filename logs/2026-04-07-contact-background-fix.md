# Log de ajuste visual e interação

Data: 2026-04-07

## Pedido

- Tornar visível o background interativo da seção de contato: grid sutil + 3 orbs flutuantes com parallax no mouse.
- Subir visualmente os elementos da seção para que não invadam a área do pixel dissolve do footer.
- Revisão posterior: remover a grade do contato por incompatibilidade com a linguagem do site e devolver contraste aos cards de email, telefone e localização.

## Diagnóstico

- O markup do background existia, mas o efeito de parallax dos orbs não estava rodando no cliente.
- A causa raiz estava em `src/components/ContactSection.astro`:
  - o script da seção dependia de `gsap` e `ScrollTrigger` como se fossem globais;
  - no Astro, o script do layout e o script do componente não compartilham esse escopo automaticamente.
- Havia também conflito potencial de `transform`:
  - os orbs usavam animação CSS no próprio elemento;
  - o parallax também tentava mover esse mesmo `transform` via GSAP.
- A sobreposição com o footer vinha de `margin-top: -200px` em `src/styles/global.css`, puxando o footer demais para cima dentro da área útil da contact section.
- Na revisão seguinte, surgiu um segundo risco de visibilidade nos cards de contato:
  - a animação GSAP dos cards usava `from(..., { opacity: 0 })`, o que pode deixar conteúdo crítico invisível durante o ciclo inicial do trigger;
  - overlays absolutos do card também precisavam de hierarquia explícita para garantir o texto sempre acima.

## Arquivos alterados

- `src/components/ContactSection.astro`
  - linhas-chave atuais:
    - fundo com `aria-hidden` em torno da linha 7;
    - estrutura interna dos orbs com `.contact-hub__orb-core` nas linhas 9 a 11;
    - inicialização GSAP local a partir da linha 127;
    - `initContactHub()` por volta da linha 129;
    - seleção dos orbs por volta da linha 183;
    - handlers `pointermove` / `pointerleave` por volta das linhas 199 a 211.
- `src/styles/global.css`
  - `.contact-hub` em torno da linha 1003;
  - pseudo-elemento `.contact-hub::before` em torno da linha 1010;
  - camada ambiente `.contact-hub__bg::before` em torno da linha 1031;
  - cards de contato em torno da linha 1193;
  - transparência do form wrapper em torno da linha 1299;
  - transparência dos botões sociais em torno da linha 1477;
  - ajuste do `.footer` em torno da linha 1566.

## Alterações aplicadas

### 1. Parallax do background corrigido na origem

- Adicionado `import gsap from 'gsap'` e `import { ScrollTrigger } from 'gsap/ScrollTrigger'` diretamente no script da `ContactSection`.
- Registrado `gsap.registerPlugin(ScrollTrigger)` localmente.
- Criada a função `initContactHub()` com guarda `data-enhanced` para evitar inicialização duplicada.
- Substituído o `mousemove` anterior por `pointermove` + `pointerleave` com `gsap.quickTo`, reduzindo criação excessiva de tweens e deixando a resposta mais suave.
- Nesta revisão final, o parallax ficou restrito aos orbs, sem grid animado.

### 2. Orbs reestruturados para não brigar com `transform`

- Cada orb agora tem um elemento interno `.contact-hub__orb-core`.
- O parallax do mouse atua no elemento pai `.contact-hub__orb`.
- O drift/flutuação visual fica no elemento interno `.contact-hub__orb-core` via keyframes dedicados.
- Isso evita conflito entre animação CSS e animação GSAP no mesmo `transform`.

### 3. Revisão visual do fundo e dos cards

- A grade da contact section foi removida do markup e da interação por não combinar com a linguagem predominante da página.
- O fundo ficou baseado apenas em atmosfera e profundidade:
  - camada ambiente suave em `.contact-hub__bg::before`;
  - 3 orbs com glow e drift leve;
  - parallax apenas nos orbs.
- Os cards de email, telefone e localização deixaram de usar aparência muito translúcida:
  - fundo quase sólido em gradiente escuro;
  - borda mais presente;
  - sombra estrutural constante;
  - labels e valores com contraste maior.
- A ação dos cards deixou de sumir completamente em estado normal, evitando leitura “lavada”.
- A pilha visual dos cards foi explicitada com `z-index`:
  - overlays decorativos ficaram na camada de fundo;
  - conteúdo textual e ícones ficaram acima, sem ambiguidade.
- A animação dos cards deixou de usar fade crítico:
  - mantido apenas deslocamento vertical leve;
  - `scrollTrigger` configurado com `once: true`;
  - resultado: os cards continuam visíveis mesmo se o trigger não entrar no timing ideal.
- Ajuste posterior de interação:
  - os textos de ação (`Enviar email`, `Ligar agora`, `Remoto & Presencial`) voltaram a ficar ocultos por padrão;
  - reaparecem apenas no `hover`, como no comportamento anterior;
  - essa reversão foi feita sem reintroduzir a invisibilidade do conteúdo principal do card.

### 4. Conteúdo afastado da área do pixel dissolve

- Aumentado o `padding-bottom` da `.contact-hub` com `clamp(...)`.
- Reduzido o overlap do footer de `-200px` para `-160px`.
- Resultado esperado: os blocos finais da seção de contato sobem visualmente e deixam mais respiro antes do dissolve do footer.

## Validação

- `npm run build` executado com sucesso.
- `npm run build` executado novamente após a correção de visibilidade dos cards, também com sucesso.
- Resultado:
  - 0 erros;
  - 0 warnings;
  - 3 hints já existentes.
- Hints remanescentes:
  - `Sites antigo/portfolioantigo1/js/script.js` — variável `e` não utilizada;
  - `Sites antigo/portfolioantigo2/js/script.js` — variável `sectionHeight` não utilizada;
  - `src/components/Footer.astro` — uso de `webkitMaskImage` marcado como deprecated, sem quebrar build.

## Resultado esperado em tela

- A seção de contato não deve mais exibir grade ao fundo.
- Os 3 orbs devem reagir ao movimento do mouse com intensidades diferentes.
- Os cards de email, telefone e localização devem ficar legíveis e destacados sem parecer transparentes demais.
- O bloco de contato não deve mais ficar “sentado” em cima da faixa de pixel dissolve do footer.