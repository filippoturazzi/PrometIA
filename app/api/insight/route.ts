import { runCaseInsight, runCreatorInsight } from "@/lib/ai";
import { aiErrorResponse, errorResponse, readJSONBody, str } from "@/lib/api";
import { withAICache } from "@/lib/cache";
import { getCaseData, getCreatorInsightData } from "@/lib/data";
import { caseInsightFallback, creatorInsightFallback } from "@/lib/fallbacks";

// IA 3 — insights para o creator (scope=creator) ou resumo do caso para Operações (scope=case).
export async function POST(req: Request) {
  const body = await readJSONBody(req);
  if (!body) return errorResponse("Requisição inválida.", 400);
  const scope = str(body.scope);
  const id = str(body.id);

  if (scope !== "creator" && scope !== "case") return errorResponse("Escopo inválido.", 400);

  // os agregados são montados no servidor; o cliente só manda o id
  const data = scope === "creator" ? getCreatorInsightData(id) : getCaseData(id);
  if (!data) return errorResponse(scope === "creator" ? "Creator não encontrado." : "Caso não encontrado.", 404);

  try {
    const res = await withAICache({
      route: "insight",
      input: { scope, id },
      call: () => (scope === "creator" ? runCreatorInsight(data) : runCaseInsight(data)),
      fallback: () => (scope === "creator" ? creatorInsightFallback(id) : caseInsightFallback(id)),
    });
    return Response.json({ ...res.data, source: res.source });
  } catch (err) {
    return aiErrorResponse(err);
  }
}
