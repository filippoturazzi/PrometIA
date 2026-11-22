import "server-only";

// Respostas pré-escritas do plano B (seção 9): usadas quando o Groq falha ou estoura 15 s.

import {
  aggregateByContent,
  getContents,
  getFeedbackById,
  hasProhibitedClaim,
  hoursWithoutResponse,
  worstClaimStatus,
} from "@/lib/data";
import { DEMO_PRODUCT_ID, DEMO_REFUND_TEXT, DEMO_SCRIPT } from "@/lib/demo";
import type { CheckClaimsResult, ClassifyFeedbackResult, InsightResult, OverallRisk } from "@/lib/schemas";
import type { Claim, FrustrationType } from "@/lib/types";

const same = (a: string, b: string) =>
  a.replace(/\s+/g, " ").trim().toLowerCase() === b.replace(/\s+/g, " ").trim().toLowerCase();

const riskOf = (claims: Claim[]): OverallRisk => {
  const worst = worstClaimStatus(claims);
  return worst === "proibida" ? "alto" : worst === "exagerada" ? "medio" : "baixo";
};

/** Resultado esperado do roteiro da demo (passo 1 da seção 2). */
export const DEMO_CHECK_CLAIMS: CheckClaimsResult = {
  overallRisk: "alto",
  claims: [
    {
      text: "você vai faturar R$10 mil já no primeiro mês",
      status: "proibida",
      evidence: "Não garantimos ganhos financeiros.",
      reason: "Promete ganho financeiro garantido e com prazo, e a página diz que não garante ganhos.",
      rewrite:
        "Eu saí do CLT e hoje vivo de Reels, mas levou tempo e muita prática. O curso te dá o método; o resultado vem da sua dedicação.",
      category: "ganho_financeiro",
    },
    {
      text: "É só postar 1 vídeo por dia e o algoritmo faz o resto",
      status: "exagerada",
      evidence:
        "a maioria dos alunos começa a ver crescimento de seguidores após 3 meses de prática constante",
      reason: "Faz parecer automático, mas a página fala em 3 meses de prática constante.",
      rewrite:
        "Com constância e as técnicas do curso, a maioria dos alunos começa a crescer depois de uns 3 meses de prática.",
      category: "prazo",
    },
    {
      text: "São 6 módulos com aulas práticas de edição, do roteiro até a postagem",
      status: "sustentada",
      evidence: "6 módulos práticos: roteiro, gravação com celular, edição no CapCut, legendas, ganchos e postagem.",
      reason: "Bate com a estrutura descrita na página de vendas.",
      category: "conteudo",
    },
  ],
};

export function checkClaimsFallback(productId: string, script: string): CheckClaimsResult | null {
  if (productId === DEMO_PRODUCT_ID && same(script, DEMO_SCRIPT)) return DEMO_CHECK_CLAIMS;
  // roteiro de um conteúdo do seed → claims pré-calculadas
  const seeded = getContents({ productId }).find((c) => same(c.script, script));
  if (seeded) return { claims: seeded.claims, overallRisk: riskOf(seeded.claims) };
  return null;
}

export function classifyFeedbackFallback(
  contentId: string,
  text: string,
): ClassifyFeedbackResult | null {
  if (!same(text, DEMO_REFUND_TEXT)) return null;
  const content = getContents().find((c) => c.id === contentId);
  const claim = content?.claims.find((c) => /10 ?(mil|k)/i.test(c.text));
  return {
    type: "expectativa_desalinhada",
    severity: "alta",
    relatedClaim: claim?.text,
    summary:
      "O comprador esperava ganhar R$10 mil no primeiro mês, expectativa criada pela promessa do conteúdo de origem, mas o curso ensina edição de Reels para iniciantes e não garante ganhos.",
  };
}

const pct = (x: number) => `${(x * 100).toFixed(0)}%`;

/** Insights do creator calculados direto dos agregados (sem IA). */
export function creatorInsightFallback(creatorId: string): InsightResult | null {
  const rows = aggregateByContent({ creatorId });
  if (!rows.length) return null;
  const items: InsightResult["items"] = [];

  const withP = rows.filter((r) => hasProhibitedClaim(r.content));
  const without = rows.filter((r) => !hasProhibitedClaim(r.content));
  const rate = (list: typeof rows) => {
    const sales = list.reduce((n, r) => n + r.sales, 0);
    return sales ? list.reduce((n, r) => n + r.refunds, 0) / sales : 0;
  };

  if (withP.length && without.length) {
    const ratio = rate(without) ? rate(withP) / rate(without) : 0;
    const claim = withP[0].content.claims.find((c) => c.status === "proibida");
    items.push({
      title: `Promessas proibidas geram ${ratio.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}x mais reembolso`,
      body: `Seus conteúdos com "${claim?.text}" têm ${pct(rate(withP))} de reembolso, contra ${pct(rate(without))} nos demais. Trocar pela reescrita sugerida no Checador tende a manter as vendas que ficam.`,
    });
  }

  const best = [...rows].sort((a, b) => a.refundRate - b.refundRate)[0];
  items.push({
    title: "Seu conteúdo com menos reembolso",
    body: `"${best.content.title}" tem ${pct(best.refundRate)} de reembolso em ${best.sales} vendas. O tom dele é um bom modelo para os próximos vídeos.`,
  });

  const worst = [...rows].sort((a, b) => b.refundRate - a.refundRate)[0];
  if (worst !== best && worst.riskiestClaim && worst.riskiestClaim.status !== "sustentada") {
    items.push({
      title: "Onde ajustar primeiro",
      body: `"${worst.content.title}" lidera em reembolso (${pct(worst.refundRate)}). A frase de maior risco é "${worst.riskiestClaim.text}".`,
    });
  }
  return { items: items.slice(0, 3) };
}

const ACTIONS: Record<FrustrationType, string> = {
  expectativa_desalinhada:
    "Acionar o produtor e revisar o conteúdo do creator; se não houver resposta em 24h, reembolsar proativamente.",
  acesso_tecnico: "Oferecer suporte de acesso ao comprador e avisar o produtor.",
  qualidade_conteudo: "Acionar o produtor para responder ao comprador sobre o conteúdo.",
  entrega_logistica: "Acionar o produtor para informar o rastreio; reembolsar se não houver retorno.",
  arrependimento_pessoal: "Seguir com o reembolso dentro do prazo de garantia.",
};

/** Resumo do caso montado a partir do feedback classificado (sem IA). */
export function caseInsightFallback(feedbackId: string): InsightResult | null {
  const f = getFeedbackById(feedbackId);
  if (!f) return null;
  const hours = hoursWithoutResponse(f);
  const waiting =
    f.producerRespondedHours == null
      ? `O produtor está sem responder há ${hours}h.`
      : `O produtor levou ${hours}h para responder.`;
  return {
    items: [{ title: "Resumo do caso", body: `${f.classification.summary} ${waiting}` }],
    suggestedAction: ACTIONS[f.classification.type],
  };
}

