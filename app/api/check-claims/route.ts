import { runCheckClaims } from "@/lib/ai";
import { aiErrorResponse, errorResponse, readJSONBody, str } from "@/lib/api";
import { withAICache } from "@/lib/cache";
import { getProduct } from "@/lib/data";
import { checkClaimsFallback } from "@/lib/fallbacks";

const MIN_CHARS = 20;
const MAX_CHARS = 4000;

// IA 1 — extrai e classifica as promessas do roteiro contra a página do produto.
export async function POST(req: Request) {
  const body = await readJSONBody(req);
  if (!body) return errorResponse("Requisição inválida.", 400);
  const productId = str(body.productId);
  const script = str(body.script);

  const product = getProduct(productId);
  if (!product) return errorResponse("Produto não encontrado.", 404);
  if (script.length < MIN_CHARS) return errorResponse("Cole um roteiro com pelo menos uma frase completa.", 400);
  if (script.length > MAX_CHARS) return errorResponse(`O roteiro pode ter até ${MAX_CHARS} caracteres.`, 400);

  try {
    const res = await withAICache({
      route: "check-claims",
      input: { productId, script },
      call: () => runCheckClaims(product, script),
      fallback: () => checkClaimsFallback(productId, script),
    });
    return Response.json({ ...res.data, source: res.source });
  } catch (err) {
    return aiErrorResponse(err);
  }
}
