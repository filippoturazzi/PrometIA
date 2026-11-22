import "server-only";

import Groq from "groq-sdk";

/** Resposta de erro padronizada das rotas de IA (mensagem já em pt-BR para a tela). */
export function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

/** Mensagem amigável para falhas da IA sem fallback. */
export function aiErrorResponse(err: unknown) {
  if (err instanceof Groq.APIError && err.status === 429) {
    return errorResponse(
      "Muitas checagens em sequência. Aguarde cerca de um minuto e tente de novo.",
      429,
    );
  }
  return errorResponse("A IA não respondeu agora. Tente de novo em alguns segundos.", 503);
}

export async function readJSONBody(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await req.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
