export type AccentTone = 'amber' | 'coral' | 'violet' | 'cyan';

export const siteMeta = {
  title: 'Atyz Modder',
  shortTitle: 'Atyz Modder',
  description:
    'Portfólio de Atyz — design gráfico, modelagem 3D, texturas e direção visual para Minecraft Bedrock. Add-ons, showcases e experiências digitais únicas.',
  url: 'https://seu-dominio-aqui.com',
  ogImage: '/social-card.svg',
  keywords: [
    'Atyz',
    'Atyla Smith',
    'Minecraft Bedrock',
    'add-ons',
    'texturas',
    'modelagem 3D',
    'modding',
    'designer',
    'developer',
  ],
} as const;

export const navigation = [
  { href: '#about', label: 'Sobre' },
  { href: '#projects', label: 'Projetos' },
  { href: '#models', label: 'Modelos' },
  { href: '#contact', label: 'Contato' },
] as const;

export const heroData = {
  tag: 'Designer & Developer',
  name: 'Atyz',
  subtitle: 'Criando experiências digitais únicas para o universo Minecraft Bedrock com criatividade e técnica.',
} as const;

export const storyParagraphs = [
  'Sou designer e desenvolvedor apaixonado por criar experiências digitais que conectam pessoas e projetos dentro do universo Minecraft.',
  'Com anos de experiência em design gráfico, modelagem 3D e desenvolvimento, sempre busco a perfeição em cada add-on, textura e modelo que produzo.',
  'Minha abordagem combina criatividade visual com funcionalidade técnica, resultando em soluções que não só impressionam visualmente, mas também entregam resultados excepcionais dentro do ecossistema Bedrock.',
] as const;

export const skills = [
  'Graphic Design',
  'Modeling 3D',
  'Illustration',
  "PBR Artist",
  "Visual Direction",
  'Add-on Dev',
  'Texture Art',
] as const;

export const stats = [
  { value: 4, suffix: '+', label: 'Anos de Experiência' },
  { value: 20, suffix: '+', label: 'Projetos Entregues' },
  { value: 500, suffix: 'K+', label: 'Downloads' },
  { value: 12, suffix: '+', label: 'Modelos Criados' },
] as const;

export const services = [
  {
    icon: 'texture',
    title: 'Texture Art',
    description:
      'Criação de texturas com leitura limpa, profundidade e direção visual consistente para Minecraft Bedrock.',
  },
  {
    icon: 'materials',
    title: 'PBR / Material Work',
    description:
      'Construção de materiais com atenção a relevo, resposta de luz e acabamento visual mais sofisticado.',
  },
  {
    icon: 'lighting',
    title: 'Lighting / Vibrant Visuals',
    description:
      'Ajuste de iluminação e atmosfera para valorizar cenários, renders e apresentação de add-ons.',
  },
  {
    icon: 'direction',
    title: 'Add-on Visual Direction',
    description:
      'Definição da linguagem visual do projeto, das peças de showcase ao refinamento final da identidade.',
  },
  {
    icon: 'assets',
    title: 'Minecraft Bedrock Visual Assets',
    description:
      'Produção de renders, showcases, ícones, key arts e materiais de apoio para apresentação profissional.',
  },
  {
    icon: 'interface',
    title: 'Interface Visual / Branding',
    description:
      'Direção visual para marcas, estúdios e add-ons com foco em coesão, clareza e presença premium.',
  },
] as const;

export const projects = [
  {
    title: 'Hydra',
    role: 'Add-on de batalha',
    description:
      'Um incrível add-on de batalha com um Boss Hydra, novas armaduras, ferramentas, itens e blocos exclusivos para Minecraft Bedrock.',
    tags: ['Modeling', 'Development', 'Direction'],
    accent: 'amber' as AccentTone,
    image: '/projects/hydra.png',
    link: '#',
  },
  {
    title: 'Shinobi Craft',
    role: 'Add-on temático',
    description:
      'Um emocionante add-on inspirado em Naruto para Minecraft Bedrock, com personagens, jutsus e mecânicas únicas.',
    tags: ['Modeling', 'Development', 'Direction'],
    accent: 'coral' as AccentTone,
    image: '/projects/shinobi.png',
    link: '#',
  },
  {
    title: 'Rio de Janeiro',
    role: 'Mapa completo',
    description:
      'Rio de Janeiro é o mapa definitivo da cidade! Explore Copacabana, Cristo Redentor, Favelas e muito mais. Mobilie sua casa, vários esportes: futebol, vôlei e mais, comida típica brasileira, interface de smartphone, efeitos visuais de realismo, veículos brasileiros 50+, trem, paraquedas, animais, 80 skins megapack e MUITO mais!',
    tags: ['Map', 'VibrantVisuals', 'Design'],
    accent: 'cyan' as AccentTone,
    image: '/projects/rio.png',
    link: 'https://youtu.be/qsZQsCNx8y8?si=_rBCRi9LuQQlPgpU',
  },
];

export const modelCategories = ['All', 'Characters', 'Blocks', 'Mobs'] as const;

export const teams = [
  {
    name: 'A30x1',
    role: 'Minecraft Official Partner',
    note: 'Criadora do mapa Rio de Janeiro',
    image: '/teams/a30x1.jpg',
    accent: 'green',
    link: 'https://x.com/A30onX',
  },
  {
    name: 'Kubic',
    role: 'Estúdio de Add-ons',
    note: 'Criadora do Hydra — desenvolvida por mim',
    image: '/teams/kubic.png',
    accent: 'yellow',
    link: 'https://x.com/KubicStudios',
  },
  {
    name: 'Nindon',
    role: 'Estúdio de Add-ons',
    note: 'Criadora do Shinobi Craft — desenvolvida por mim',
    image: '/teams/nindon.png',
    accent: 'red',
    link: '',
  },
] as const;

export const models = [
  { id: 1, title: 'Wardrobe', category: 'blocks', image: '/models/wardrobe.png' },
  { id: 3, title: 'Gamabunta', category: 'mobs', image: '/models/gamabunta.png', model3d: '/models/gamabunta.geo.gltf',
    camera: { angle: 145, height: 80, zoom: 1.2, lookX: 0, lookY: -0.25, ortho: true },
  },
  { id: 3, title: 'Hydra Boss', category: 'mobs', image: '/models/hydra.png', model3d: '/models/hydra.geo.gltf',
    camera: { angle: 145, height: 80, zoom: 1.2, lookX: 0, lookY: -0.25, ortho: true },
  },
  { id: 3, title: 'Titan', category: 'mobs', image: '/models/titan.png', model3d: '/models/titan.geo.gltf',
    camera: { angle: 145, height: 80, zoom: 1.2, lookX: 0, lookY: -0.25, ortho: true },
  },
  { id: 4, title: 'Charmander', category: 'mobs', image: '/models/charmander.png', model3d: '/models/charmander.geo.gltf',
    camera: { angle: 145, height: 80, zoom: 1.2, lookX: 0, lookY: -0.25, ortho: true },
  },
  { id: 5, title: 'Custom Skin', category: 'characters', image: '/models/skin.gif' },
  { id: 6, title: 'Base Character', category: 'characters', image: '/models/base_3_4.gif' },
] as const;

/*
 * ── Como ajustar a câmera de cada modelo 3D ──────────────
 *
 *   camera: { angle, height, zoom, lookX, lookY, ortho }
 *
 *   angle  → Rotação horizontal em graus (0-360).
 *            0 = frente, 90 = lado direito, 180 = trás, 270 = lado esquerdo.
 *
 *   height → Ângulo vertical em graus (0-90).
 *            90 = nível dos olhos, 70 = levemente de cima, 30 = bem de cima.
 *
 *   zoom   → Distância da câmera. 1.0 = encaixe automático.
 *            Menor = mais perto (ex: 0.8), maior = mais longe (ex: 1.5).
 *
 *   lookX  → Deslocamento horizontal do alvo (em % da largura do modelo).
 *            0 = centro, 0.2 = desloca pra direita, -0.2 = pra esquerda.
 *
 *   lookY  → Deslocamento vertical do alvo (em % da altura do modelo).
 *            0 = centro, 0.1 = olha mais pra cima, -0.2 = olha mais pra baixo.
 *
 *   ortho  → Modo ortográfico (true/false). Igual ao Blockbench.
 *            true = sem perspectiva, false = perspectiva normal.
 */

/*
 * ── Vibrant Visuals — PBR, iluminação e shaders ──────────
 *
 *  Adicione prints na pasta public/visuals/ e cadastre aqui.
 *  Categorias: 'blocks' | 'entities' | 'items' | 'lighting' | 'all'
 *
 *  Cada item:
 *    image    → caminho da imagem (ex: '/visuals/nome.png')
 *    title    → título curto
 *    category → uma das categorias acima
 *    caption  → descrição opcional que aparece no hover
 */
export const visualCategories = ['All', 'Blocks', 'Entities', 'Items', 'Lighting'] as const;

export const visuals = [
  { image: '/visuals/1.png', title: 'Em breve', category: 'blocks', caption: 'Adicione suas prints aqui' },
  { image: '/visuals/2.png', title: 'Em breve', category: 'blocks', caption: 'Adicione suas prints aqui' },
  { image: '/visuals/3.png', title: 'Em breve', category: 'blocks', caption: 'Adicione suas prints aqui' },
  { image: '/visuals/4.png', title: 'Em breve', category: 'blocks', caption: 'Adicione suas prints aqui' },
  { image: '/visuals/5.png', title: 'Em breve', category: 'blocks', caption: 'Adicione suas prints aqui' },
  { image: '/visuals/6.png', title: 'Em breve', category: 'blocks', caption: 'Adicione suas prints aqui' },
  { image: '/visuals/7.png', title: 'Em breve', category: 'blocks', caption: 'Adicione suas prints aqui' },
] as const;

export const contactInfo = {
  email: 'contact.atylamodder@gmail.com',
  phone: '+55 (38) 99869-4156',
  location: 'Brazil, South America',
} as const;

export const socialLinks = [
  { label: 'Instagram', icon: 'instagram', url: '#' },
  { label: 'LinkedIn', icon: 'linkedin', url: '#' },
  { label: 'Behance', icon: 'behance', url: '#' },
  { label: 'GitHub', icon: 'github', url: '#' },
] as const;

export const colorPalette = {
  primary: '#e7c34f',
  secondary: '#FFB366',
  accent: '#FF8A80',
  background: '#0f1318',
  surface: '#171d24',
} as const;