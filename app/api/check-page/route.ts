import { runCheckPage } from "@/lib/ai";
import { aiErrorResponse, errorResponse, readJSONBody, str } from "@/lib/api";
import { withAICache } from "@/lib/cache";
import { getProduct } from "@/lib/data";
import { checkPageFallback } from "@/lib/fallbacks";
import {
  MAX_TEXT_CHARS,
  MIN_TEXT_CHARS,
  PageScanError,
  type PageScanErrorCode,
  fetchPageText,
  parsePageUrl,
} from "@/lib/page-scan";

const UNREADABLE = "Não conseguimos ler essa página. Cole o texto dela abaixo.";
const SCAN_MESSAGES: Record<PageScanErrorCode, string> = {
  invalid_url: "Esse endereço não parece uma URL válida.",
  blocked: "Esse endereço não pode ser lido por segurança.",
  fetch_failed: UNREADABLE,
  not_html: UNREADABLE,
  too_large: UNREADABLE,
  unreadable: UNREADABLE,
};

const normalizeText = (s: string) =>
  s
    .split("\n")
    .map((l) => l.replace(/[\s ]+/g, " ").trim())
    .filter(Boolean)
    .join("\n");

// IA 4 — lê a página de vendas do produtor (por URL ou texto colado) e classifica as promessas.
export async function POST(req: Request) {
  const body = await readJSONBody(req);
  if (!body) return errorResponse("Requisição inválida.", 400);
  const productId = str(body.productId);
  const url = str(body.url);
  const rawText = str(body.text);

  const product = getProduct(productId);
  if (!product) return errorResponse("Produto não encontrado.", 404);
  if (!url && !rawText) return errorResponse("Informe a URL da página ou cole o texto dela.", 400);

  let pageText: string;
  if (url) {
    // o próprio app é liberado, para a página de exemplo funcionar em dev e em produção
    const appHost = new URL(req.url).host;
    try {
      pageText = await fetchPageText(parsePageUrl(url, appHost), { appHost });
    } catch (err) {
      if (err instanceof PageScanError) {
        return Response.json({ error: SCAN_MESSAGES[err.code], code: err.code }, { status: 422 });
      }
      throw err;
    }
  } else {
    pageText = normalizeText(rawText);
    if (pageText.length < MIN_TEXT_CHARS)
      return errorResponse("Cole um texto maior: pelo menos algumas frases da página.", 400);
    if (pageText.length > MAX_TEXT_CHARS)
      return errorResponse(`O texto pode ter até ${MAX_TEXT_CHARS} caracteres.`, 400);
  }

  try {
    const res = await withAICache({
      route: "check-page",
      input: { productId, text: pageText },
      call: () => runCheckPage(product, pageText),
      fallback: () => checkPageFallback(productId, pageText),
    });
    return Response.json({ ...res.data, pageText, source: res.source, notice: res.notice });
  } catch (err) {
    return aiErrorResponse(err);
  }
}
