// Reduz um print no navegador antes do envio (limite de corpo da função e do modelo de visão).

/** Redimensiona para caber em maxW × maxH (mantendo a proporção) e devolve uma data URL JPEG. */
export async function resizeImage(file: File, maxW = 1280, maxH = 2400, quality = 0.85): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxW / bitmap.width, maxH / bitmap.height);
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas indisponível");
  // fundo branco: PNG com transparência não vira preto no JPEG
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", quality);
}

/** Lê um arquivo do próprio site como data URL, sem reprocessar (prints de exemplo: bytes estáveis para o cache). */
export async function fetchAsDataUrl(path: string): Promise<string> {
  const blob = await (await fetch(path)).blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
