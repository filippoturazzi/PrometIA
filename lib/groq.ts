import "server-only";

import Groq from "groq-sdk";
import type { ChatCompletionContentPart } from "groq-sdk/resources/chat/completions";

/** Teto da seção 9: passou disso, a rota usa o fallback. */
export const AI_TIMEOUT_MS = 15_000;

type ReasoningEffort = "low" | "medium" | "high";

let client: Groq | null = null;

// Cliente criado sob demanda: o build não precisa da chave, e ela nunca sai do servidor.
function getClient() {
  if (!process.env.GROQ_API_KEY) throw new Error("GROQ_API_KEY não configurada");
  client ??= new Groq({ apiKey: process.env.GROQ_API_KEY });
  return client;
}

export const groqModel = () => process.env.GROQ_MODEL ?? "openai/gpt-oss-20b";

/**
 * Modelo da IA 4 (página de vendas): o schema é maior e o gpt-oss-20b gerou JSON inválido
 * em todas as tentativas nos testes; o 120b respondeu em 9 a 12 s.
 */
export const groqPageModel = () => process.env.GROQ_PAGE_MODEL ?? "openai/gpt-oss-120b";

/**
 * Modelo reserva: no plano gratuito os limites (por minuto e por dia) são por modelo,
 * então quando o principal bate qualquer limite (429) a chamada tenta este. "" desliga.
 */
export const groqFallbackModel = () => process.env.GROQ_FALLBACK_MODEL ?? "openai/gpt-oss-120b";

/** Modelo de visão do OCR dos prints (IA 4 por imagem). Em preview no Groq: por isso configurável. */
export const groqVisionModel = () => process.env.GROQ_VISION_MODEL ?? "qwen/qwen3.8-27b";

// "medium": com "low" o gpt-oss-20b gerou JSON fora do schema e omitiu promessas sustentadas nos testes.
function reasoningEffort(): ReasoningEffort {
  const v = process.env.GROQ_REASONING_EFFORT;
  return v === "low" || v === "high" ? v : "medium";
}

export interface GenerateOptions {
  timeoutMs?: number;
  /** modelo da primeira tentativa (padrão: groqModel()) */
  model?: string;
  /** modelo usado quando o primeiro bate limite (429); null desliga (ex.: visão, que o reserva não suporta) */
  fallbackModel?: string | null;
  /** false: não envia reasoning_effort (modelos com valores próprios, como o de visão) */
  reasoning?: boolean;
}

/**
 * Chama o Groq com Structured Outputs estritos e devolve o JSON já parseado.
 * `prompt`: texto ou partes (texto + imagens). `name`: identificador do schema (a-z, 0-9, _ ou -).
 */
export async function generateJSON<T>(
  prompt: string | ChatCompletionContentPart[],
  schema: Record<string, unknown>,
  name: string,
  opts: GenerateOptions = {},
): Promise<T> {
  const { timeoutMs = AI_TIMEOUT_MS, model: startModel = groqModel(), reasoning = true } = opts;
  const fallback = opts.fallbackModel === undefined ? groqFallbackModel() : opts.fallbackModel;
  const deadline = Date.now() + timeoutMs;
  let model = startModel;
  const attempt = async () => {
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw new AITimeoutError(timeoutMs);
    const res = await getClient().chat.completions.create(
      {
        model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_schema", json_schema: { name, schema, strict: true } },
        temperature: 0.2,
        ...(reasoning ? { reasoning_effort: reasoningEffort() } : {}),
      },
      { timeout: remaining, maxRetries: 0 },
    );
    const content = res.choices[0]?.message.content;
    if (!content) throw new Error("Resposta vazia do Groq");
    return JSON.parse(content) as T;
  };

  // O modelo às vezes gera JSON inválido ou fora do schema (400): a doc do Groq recomenda tentar de novo.
  for (let retry = 0; ; retry++) {
    try {
      return await attempt();
    } catch (err) {
      if (retry < MAX_JSON_RETRIES && isJSONGenerationError(err)) continue;
      if (isRateLimitError(err) && fallback && model !== fallback) {
        console.warn(`[groq] limite de ${model} atingido; usando ${fallback}`);
        model = fallback;
        continue;
      }
      throw err;
    }
  }
}

const MAX_JSON_RETRIES = 2;

function isJSONGenerationError(err: unknown) {
  return (
    err instanceof Groq.APIError &&
    err.status === 400 &&
    /json_validate_failed|json_generate_failed|Failed to generate JSON|does not match the expected schema/i.test(err.message)
  );
}

/** 429: limite de tokens/requisições por minuto ou por dia. */
export function isRateLimitError(err: unknown) {
  return err instanceof Groq.APIError && err.status === 429;
}

/** 429 por cota diária (tokens ou requisições por dia), que não volta em segundos. */
export function isDailyLimitError(err: unknown) {
  return isRateLimitError(err) && /per day|\(TPD\)|\(RPD\)/i.test((err as Error).message);
}

/** A chamada passou do teto de AI_TIMEOUT_MS. */
export class AITimeoutError extends Error {
  constructor(ms: number) {
    super(`Groq passou de ${ms} ms`);
    this.name = "AITimeoutError";
  }
}
