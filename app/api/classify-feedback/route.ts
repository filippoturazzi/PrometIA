import { runClassifyFeedback } from "@/lib/ai";
import { aiErrorResponse, errorResponse, readJSONBody, str } from "@/lib/api";
import { withAICache } from "@/lib/cache";
import { getContent, getProduct } from "@/lib/data";
import { classifyFeedbackFallback } from "@/lib/fallbacks";

const MIN_CHARS = 10;
const MAX_CHARS = 2000;

// IA 2 — classifica o pedido de reembolso e o liga à promessa do conteúdo de origem.
export async function POST(req: Request) {
  const body = await readJSONBody(req);
  if (!body) return errorResponse("Requisição inválida.", 400);
  const productId = str(body.productId);
  const contentId = str(body.contentId);
  const text = str(body.text);
  const reason = str(body.reason) || undefined;

  const product = getProduct(productId);
  const content = getContent(contentId);
  if (!product || !content || content.productId !== productId) {
    return errorResponse("Pedido não encontrado.", 404);
  }
  if (text.length < MIN_CHARS) return errorResponse("Conte um pouco mais sobre o que aconteceu.", 400);
  if (text.length > MAX_CHARS) return errorResponse(`O texto pode ter até ${MAX_CHARS} caracteres.`, 400);

  try {
    const res = await withAICache({
      route: "classify-feedback",
      input: { productId, contentId, text, reason },
      call: () => runClassifyFeedback(product, content, text, reason),
      fallback: () => classifyFeedbackFallback(contentId, text),
    });
    return Response.json({ ...res.data, source: res.source });
  } catch (err) {
    return aiErrorResponse(err);
  }
}
