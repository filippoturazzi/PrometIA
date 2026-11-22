import "server-only";

import Groq from "groq-sdk";

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
 * Modelo reserva: no plano gratuito o limite diário de tokens (TPD) é por modelo,
 * então quando o principal esgota a cota do dia a chamada tenta este. "" desliga.
 */
export const groqFallbackModel = () => process.env.GROQ_FALLBACK_MODEL ?? "openai/gpt-oss-120b";

// "medium": com "low" o gpt-oss-20b gerou JSON fora do schema e omitiu promessas sustentadas nos testes.
function reasoningEffort(): ReasoningEffort {
  const v = process.env.GROQ_REASONING_EFFORT;
  return v === "low" || v === "high" ? v : "medium";
}

/**
 * Chama o Groq com Structured Outputs estritos e devolve o JSON já parseado.
 * `name`: identificador do schema (a-z, 0-9, _ ou -).
 */
export async function generateJSON<T>(
  prompt: string,
  schema: Record<string, unknown>,
  name: string,
  timeoutMs = AI_TIMEOUT_MS,
): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  let model = groqModel();
  const attempt = async () => {
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw new Error(`Groq passou de ${timeoutMs} ms`);
    const res = await getClient().chat.completions.create(
      {
        model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_schema", json_schema: { name, schema, strict: true } },
        temperature: 0.2,
        reasoning_effort: reasoningEffort(),
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
      const fallback = groqFallbackModel();
      if (isDailyLimitError(err) && fallback && model !== fallback) {
        console.warn(`[groq] cota diária de ${model} esgotada; usando ${fallback}`);
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

/** 429 por cota diária (tokens ou requisições por dia), que não volta em segundos. */
function isDailyLimitError(err: unknown) {
  return err instanceof Groq.APIError && err.status === 429 && /per day|\(TPD\)|\(RPD\)/i.test(err.message);
}
