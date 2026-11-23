// Constantes compartilhadas da história da demo (seção 2 do SPEC).

/**
 * "Agora" fixo da demo. Datas do seed e o cálculo de "horas sem resposta"
 * partem daqui, para o caso da fila mostrar sempre 52h, em qualquer dia.
 */
export const DEMO_NOW = "2026-11-23T15:00:00.000Z";

/** Roteiro da seção 6.4 (botão "Usar roteiro de exemplo" no Checador). */
export const DEMO_SCRIPT =
  "Gente, eu era CLT e hoje vivo de Reels. Com o curso Renda com Reels você vai faturar R$10 mil já no primeiro mês, sério. É só postar 1 vídeo por dia e o algoritmo faz o resto. São 6 módulos com aulas práticas de edição, do roteiro até a postagem. Link na bio, corre que é por tempo limitado!";

/** Texto do pedido de reembolso do passo 2. */
export const DEMO_REFUND_TEXT =
  "comprei achando que ia ganhar 10 mil no primeiro mês, mas o curso é só edição básica";

export const DEMO_CREATOR_ID = "c_ana";
export const DEMO_PRODUCT_ID = "p_reels";
/** Conteúdo semeado da Ana (com a promessa de R$10k) que originou a compra da demo. */
export const DEMO_CONTENT_ID = "ct_001";
/** Id que o Checador atribui ao novo conteúdo checado no passo 1. */
export const DEMO_NEW_CONTENT_ID = "ct_013";
export const DEMO_FEEDBACK_ID = "fb_demo";
/** Horas sem resposta do produtor no caso da demo (passo 4). */
export const DEMO_CASE_HOURS = 52;

/** Comissão do creator sobre o preço (premissa do protótipo; o SPEC não define). */
export const COMMISSION_RATE = 0.4;

/** Limite de horas sem resposta para entrar na fila de escalonamento. */
export const ESCALATION_HOURS = 48;

/** Produto da demo do Checador do Produtor (página de vendas fictícia). */
export const DEMO_PRODUCER_PRODUCT_ID = "p_slim";
export const DEMO_SALES_PAGE_PATH = "/paginavendas";
