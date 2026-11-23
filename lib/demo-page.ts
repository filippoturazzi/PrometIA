// Texto da página de vendas fictícia (/paginavendas) usada na demo do Checador do Produtor.
// Mistura planejada: 5 promessas proibidas, 2 exageradas e 2 sustentadas (ver o fallback DEMO_CHECK_PAGE).
// Marca e produto do seed (NutriMax · TermoSlim); nada aqui é real.

export interface DemoPage {
  brand: string;
  product: string;
  headline: string;
  subheadline: string;
  bullets: string[];
  testimonials: { name: string; text: string }[];
  guarantee: string;
  priceFrom: string;
  priceTo: string;
  cta: string;
}

export const DEMO_PAGE: DemoPage = {
  brand: "NutriMax",
  product: "TermoSlim",
  headline: "Seque 10 kg em 15 dias sem dieta e sem passar fome",
  subheadline:
    "O termogênico que queima gordura enquanto você dorme. Aprovado por médicos e escolhido por mais de 50 mil brasileiras.",
  bullets: [
    "Fórmula com cafeína e chá verde",
    "Auxilia no foco e na disposição para os treinos",
    "Energia o dia inteiro, do café da manhã até a noite",
    "Acelera o metabolismo em até 3x",
    "Substitui a academia: emagreça sem sair do sofá",
  ],
  testimonials: [
    { name: "Juliana M.", text: "Perdi 9 kg em duas semanas sem mudar nada na alimentação!" },
    { name: "Patrícia R.", text: "Tomo 2 cápsulas por dia e a barriga sumiu. Nunca mais fui à academia." },
    { name: "Carla S.", text: "Mais disposição logo na primeira semana, sinto muito mais foco no treino." },
  ],
  guarantee: "Resultado garantido ou devolvemos o dobro do seu dinheiro.",
  priceFrom: "R$ 297",
  priceTo: "R$ 149",
  cta: "Quero secar agora",
};

/** Frase que identifica a página de exemplo no texto lido (usada pelo fallback da IA 4). */
export const DEMO_PAGE_SIGNATURE = DEMO_PAGE.headline;
