// Prints da página de vendas (IA 4 por imagem): validação da entrada e do texto lido pelo OCR.
// Sem dependências de servidor: a tela usa os mesmos limites.

/** mesmo mínimo do texto lido pela URL (MIN_TEXT_CHARS em page-scan) */
const MIN_TEXT_CHARS = 80;

export const MAX_IMAGES = 3;
/** base64 de cada imagem (~1,1 MB de arquivo) */
export const MAX_IMAGE_B64 = 1_500_000;
/** soma dos base64: abaixo do limite de corpo das funções serverless */
export const MAX_TOTAL_B64 = 4_000_000;

const DATA_URL = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/;

type Validation = { ok: true; images: string[] } | { ok: false; error: string };

export function validateImages(input: unknown): Validation {
  if (!Array.isArray(input) || input.length === 0) return { ok: false, error: "Envie pelo menos 1 print da página." };
  if (input.length > MAX_IMAGES) return { ok: false, error: `Envie no máximo ${MAX_IMAGES} prints.` };
  let total = 0;
  for (const img of input) {
    if (typeof img !== "string") return { ok: false, error: "Print inválido." };
    const b64 = img.slice(img.indexOf(",") + 1);
    if (b64.length > MAX_IMAGE_B64) return { ok: false, error: "Cada print pode ter até 1,5 MB." };
    if (!DATA_URL.test(img)) return { ok: false, error: "Os prints precisam ser imagens PNG, JPG ou WEBP." };
    total += b64.length;
  }
  if (total > MAX_TOTAL_B64) return { ok: false, error: "Os prints somam mais de 4 MB. Envie imagens menores." };
  return { ok: true, images: input as string[] };
}

/** Normaliza o texto do OCR (uma linha por bloco); null se não há texto suficiente para analisar. */
export function ocrTextOrNull(text: string): string | null {
  const t = text
    .split("\n")
    .map((l) => l.replace(/[\s ]+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
  return t.length < MIN_TEXT_CHARS ? null : t;
}
