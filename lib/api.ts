import "server-only";

import Groq from "groq-sdk";
import { AITimeoutError, isDailyLimitError, isRateLimitError } from "@/lib/groq";

/** Resposta de erro padronizada das rotas de IA (mensagem já em pt-BR para a tela). */
export function errorResponse(message: string, status: number, detail?: string) {
  return Response.json(detail ? { error: message, detail } : { error: message }, { status });
}

/** Erro da IA traduzido para quem está testando a demo: título curto + explicação. */
export interface AIErrorInfo {
  title: string;
  detail: string;
  status: number;
}

const DEMO_TIP = "Os exemplos prontos da demo continuam funcionando.";

/** Segundos sugeridos pelo Groq no cabeçalho retry-after (quando houver). */
function retryAfterSeconds(err: InstanceType<typeof Groq.APIError>) {
  const raw = err.headers?.get?.("retry-after");
  const n = raw ? Math.ceil(Number(raw)) : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function describeAIError(err: unknown): AIErrorInfo {
  if (isDailyLimitError(err)) {
    return {
      title: "Cota diária da IA esgotada",
      detail: `Esta demo usa o plano gratuito do Groq, e as análises liberadas para hoje acabaram. A cota renova em algumas horas. ${DEMO_TIP}`,
      status: 429,
    };
  }
  if (isRateLimitError(err)) {
    const secs = retryAfterSeconds(err as InstanceType<typeof Groq.APIError>);
    const wait = secs && secs <= 120 ? `cerca de ${secs} segundos` : "cerca de 1 minuto";
    return {
      title: "Limite de uso da IA atingido",
      detail: `Esta demo usa o plano gratuito do Groq, que libera poucas análises por minuto. Aguarde ${wait} e tente de novo. ${DEMO_TIP}`,
      status: 429,
    };
  }
  if (err instanceof AITimeoutError || err instanceof Groq.APIConnectionTimeoutError) {
    return {
      title: "A IA demorou demais para responder",
      detail: "O Groq passou de 15 segundos sem resposta. Tente de novo em instantes.",
      status: 504,
    };
  }
  if (
    (err instanceof Error && /GROQ_API_KEY/.test(err.message)) ||
    (err instanceof Groq.APIError && (err.status === 401 || err.status === 403))
  ) {
    return {
      title: "IA não configurada neste ambiente",
      detail: `A chave da API do Groq está ausente ou inválida no servidor. ${DEMO_TIP}`,
      status: 503,
    };
  }
  if (err instanceof Groq.APIError && err.status === 400) {
    return {
      title: "A IA não conseguiu gerar a análise",
      detail: "O modelo devolveu uma resposta fora do formato esperado. Tente de novo.",
      status: 502,
    };
  }
  return {
    title: "Serviço de IA indisponível",
    detail: "O Groq, provedor da IA desta demo, não respondeu agora. Tente de novo em alguns segundos.",
    status: 503,
  };
}

/** Resposta de erro para falhas da IA sem fallback. */
export function aiErrorResponse(err: unknown) {
  const { title, detail, status } = describeAIError(err);
  return errorResponse(title, status, detail);
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
