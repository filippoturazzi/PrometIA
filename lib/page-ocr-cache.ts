import "server-only";

import { createHash } from "node:crypto";

/**
 * Entrada do cache do OCR: só um hash do conteúdo dos prints, nunca as imagens.
 * Assim o cache (memória e data/ai-cache.json) não guarda os prints do produtor,
 * e a chave não depende da normalização de texto (que deixaria o base64 em minúsculas).
 */
export function imagesCacheInput(images: string[]): { images: string } {
  const h = createHash("sha256");
  for (const img of images) h.update(img).update("\n");
  return { images: h.digest("hex") };
}
