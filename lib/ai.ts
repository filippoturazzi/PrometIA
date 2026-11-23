import "server-only";

// As chamadas de IA com o pós-processamento que as telas esperam.
// Usadas pelos Route Handlers e pelo scripts/eval-demo.ts (o teste roda o mesmo código da tela).

import { matchClaim } from "@/lib/claims-ui";
import { generateJSON, groqPageModel, groqVisionModel } from "@/lib/groq";
import { ocrTextOrNull } from "@/lib/page-images";
import { PAGE_OCR_PROMPT, caseInsightPrompt, checkClaimsPrompt, checkPagePrompt, classifyFeedbackPrompt, creatorInsightPrompt } from "@/lib/prompts";
import {
  checkClaimsSchema,
  checkPageSchema,
  pageOcrSchema,
  type PageOcrRaw,
  cleanCheckPage,
  type CheckPageRaw,
  type CheckPageResult,
  classifyFeedbackSchema,
  cleanCheckClaims,
  cleanClassifyFeedback,
  type CheckClaimsRaw,
  type CheckClaimsResult,
  type ClassifyFeedbackRaw,
  type ClassifyFeedbackResult,
  cleanInsight,
  insightSchema,
  type InsightRaw,
  type InsightResult,
} from "@/lib/schemas";
import type { Content, Product } from "@/lib/types";

export async function runCheckClaims(product: Product, script: string): Promise<CheckClaimsResult> {
  return cleanCheckClaims(
    await generateJSON<CheckClaimsRaw>(checkClaimsPrompt(product, script), checkClaimsSchema, "check_claims"),
  );
}

export async function runCheckPage(product: Product, pageText: string): Promise<CheckPageResult> {
  return cleanCheckPage(
    await generateJSON<CheckPageRaw>(
      checkPagePrompt(product, pageText),
      checkPageSchema,
      "check_page",
      { model: groqPageModel() },
    ),
  );
}

/** Transcreve os prints da página. Devolve "" quando não há texto suficiente (a rota responde 422). */
export async function runPageOcr(images: string[]): Promise<string> {
  const raw = await generateJSON<PageOcrRaw>(
    [
      { type: "text", text: PAGE_OCR_PROMPT },
      ...images.map((url) => ({ type: "image_url" as const, image_url: { url } })),
    ],
    pageOcrSchema,
    "page_ocr",
    { model: groqVisionModel(), fallbackModel: null, reasoning: false },
  );
  return ocrTextOrNull(raw.text) ?? "";
}

export async function runClassifyFeedback(
  product: Product,
  content: Content,
  text: string,
  reason?: string,
): Promise<ClassifyFeedbackResult> {
  const result = cleanClassifyFeedback(
    await generateJSON<ClassifyFeedbackRaw>(
      classifyFeedbackPrompt(product, content.claims, text, reason),
      classifyFeedbackSchema,
      "classify_feedback",
    ),
  );
  // só vale promessa real do conteúdo de origem, e só para expectativa desalinhada
  const claim =
    result.type === "expectativa_desalinhada" && result.relatedClaim
      ? matchClaim(content.claims, result.relatedClaim)
      : undefined;
  // quando a promessa não bateu (ou é arrependimento), o caminho é o reembolso: nada de "ajuda" no lugar dele
  const refundOnly = result.type === "expectativa_desalinhada" || result.type === "arrependimento_pessoal";
  return { ...result, relatedClaim: claim?.text, helpOffer: refundOnly ? undefined : result.helpOffer };
}

export async function runCreatorInsight(data: unknown): Promise<InsightResult> {
  const r = cleanInsight(await generateJSON<InsightRaw>(creatorInsightPrompt(data), insightSchema, "insight"));
  return { items: r.items.slice(0, 3) };
}

export async function runCaseInsight(data: unknown): Promise<InsightResult> {
  const r = cleanInsight(await generateJSON<InsightRaw>(caseInsightPrompt(data), insightSchema, "insight"));
  return { items: r.items.slice(0, 2), suggestedAction: r.suggestedAction };
}
