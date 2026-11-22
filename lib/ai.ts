import "server-only";

// As chamadas de IA com o pós-processamento que as telas esperam.
// Usadas pelos Route Handlers e pelo scripts/eval-demo.ts (o teste roda o mesmo código da tela).

import { matchClaim } from "@/lib/claims-ui";
import { generateJSON } from "@/lib/groq";
import { checkClaimsPrompt, classifyFeedbackPrompt } from "@/lib/prompts";
import {
  checkClaimsSchema,
  classifyFeedbackSchema,
  cleanCheckClaims,
  cleanClassifyFeedback,
  type CheckClaimsRaw,
  type CheckClaimsResult,
  type ClassifyFeedbackRaw,
  type ClassifyFeedbackResult,
} from "@/lib/schemas";
import type { Content, Product } from "@/lib/types";

export async function runCheckClaims(product: Product, script: string): Promise<CheckClaimsResult> {
  return cleanCheckClaims(
    await generateJSON<CheckClaimsRaw>(checkClaimsPrompt(product, script), checkClaimsSchema, "check_claims"),
  );
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
