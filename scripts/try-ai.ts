/**
 * Teste real das 3 chamadas de IA com as entradas da demo (usa GROQ_API_KEY do .env.local).
 * Uso: npm run try-ai            (GROQ_REASONING_EFFORT e GROQ_MODEL opcionais)
 */
import { generateJSON, groqModel } from "../lib/groq";
import {
  caseInsightPrompt,
  checkClaimsPrompt,
  classifyFeedbackPrompt,
  creatorInsightPrompt,
} from "../lib/prompts";
import {
  checkClaimsSchema,
  classifyFeedbackSchema,
  cleanCheckClaims,
  cleanClassifyFeedback,
  cleanInsight,
  insightSchema,
  type CheckClaimsRaw,
  type ClassifyFeedbackRaw,
  type InsightRaw,
} from "../lib/schemas";
import { getCaseData, getContent, getCreatorInsightData, getProduct } from "../lib/data";
import {
  DEMO_CONTENT_ID,
  DEMO_CREATOR_ID,
  DEMO_FEEDBACK_ID,
  DEMO_PRODUCT_ID,
  DEMO_REFUND_TEXT,
  DEMO_SCRIPT,
} from "../lib/demo";

const only = process.argv[2]; // "1" | "2" | "3" para rodar só uma

async function timed<T>(label: string, fn: () => Promise<T>) {
  const t = Date.now();
  try {
    const out = await fn();
    console.log(`\n=== ${label} (${((Date.now() - t) / 1000).toFixed(1)}s)`);
    console.log(JSON.stringify(out, null, 2));
  } catch (err) {
    console.log(`\n=== ${label} FALHOU (${((Date.now() - t) / 1000).toFixed(1)}s):`, err instanceof Error ? err.message : err);
  }
}

async function main() {
  console.log(`modelo: ${groqModel()} · reasoning_effort: ${process.env.GROQ_REASONING_EFFORT ?? "medium"}`);
  const product = getProduct(DEMO_PRODUCT_ID)!;

  if (!only || only === "1")
    await timed("IA 1 — check-claims (roteiro da demo)", async () =>
      cleanCheckClaims(
        await generateJSON<CheckClaimsRaw>(checkClaimsPrompt(product, DEMO_SCRIPT), checkClaimsSchema, "check_claims"),
      ),
    );

  if (!only || only === "2")
    await timed("IA 2 — classify-feedback (reembolso da demo)", async () =>
      cleanClassifyFeedback(
        await generateJSON<ClassifyFeedbackRaw>(
          classifyFeedbackPrompt(product, getContent(DEMO_CONTENT_ID)!.claims, DEMO_REFUND_TEXT),
          classifyFeedbackSchema,
          "classify_feedback",
        ),
      ),
    );

  if (!only || only === "3") {
    await timed("IA 3 — insight case (fb_demo)", async () =>
      cleanInsight(await generateJSON<InsightRaw>(caseInsightPrompt(getCaseData(DEMO_FEEDBACK_ID)), insightSchema, "insight")),
    );
    await timed("IA 3 — insight creator (Ana)", async () =>
      cleanInsight(
        await generateJSON<InsightRaw>(creatorInsightPrompt(getCreatorInsightData(DEMO_CREATOR_ID)), insightSchema, "insight"),
      ),
    );
  }
}

main();
