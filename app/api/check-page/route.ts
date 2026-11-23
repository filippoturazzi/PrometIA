import { runCheckPage, runPageOcr } from "@/lib/ai";
import { aiErrorResponse, errorResponse, readJSONBody, str } from "@/lib/api";
import { withAICache } from "@/lib/cache";
import { getProduct } from "@/lib/data";
import { checkPageFallback, pageOcrFallback } from "@/lib/fallbacks";
import { validateImages } from "@/lib/page-images";
import { imagesCacheInput } from "@/lib/page-ocr-cache";
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

// IA 4 — lê a página de vendas do produtor (por URL, prints ou texto) e classifica as promessas.
export async function POST(req: Request) {
  const body = await readJSONBody(req);
  if (!body) return errorResponse("Requisição inválida.", 400);
  const productId = str(body.productId);
  const url = str(body.url);
  const rawText = str(body.text);
  const hasImages = body.images !== undefined;

  const product = getProduct(productId);
  if (!product) return errorResponse("Produto não encontrado.", 404);
  if (!url && !rawText && !hasImages) return errorResponse("Informe a URL da página ou envie prints dela.", 400);

  let pageText: string;
  if (hasImages) {
    const v = validateImages(body.images);
    if (!v.ok) return errorResponse(v.error, 400);
    try {
      const ocr = await withAICache({
        route: "page-ocr",
        input: imagesCacheInput(v.images),
        call: () => runPageOcr(v.images),
        fallback: () => pageOcrFallback(v.images),
      });
      pageText = ocr.data.slice(0, MAX_TEXT_CHARS);
    } catch (err) {
      return aiErrorResponse(err);
    }
    if (pageText.length < MIN_TEXT_CHARS)
      return Response.json({ error: "Não conseguimos ler texto nesses prints.", code: "unreadable" }, { status: 422 });
  } else if (url) {
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
