import "server-only";

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import savedCache from "@/data/ai-cache.json";
import { describeAIError } from "@/lib/api";

// Cache e plano B da demo (seção 9 do SPEC).
// 1. chave existe em data/ai-cache.json (ou na memória) → devolve com delay de 600–900 ms;
// 2. senão chama o Groq; deu certo → guarda em memória (em dev, também grava no arquivo);
// 3. falhou ou passou de 15 s → fallback pré-escrito (source "fallback" → toast "modo demonstração").

export type AISource = "cache" | "live" | "fallback";

export interface AIResponse<T> {
  data: T;
  source: AISource;
  /** só no fallback: por que a IA ao vivo não respondeu (ex.: "Limite de uso da IA atingido") */
  notice?: string;
}

interface CacheEntry {
  route: string;
  input: unknown;
  output: unknown;
  savedAt: string;
}

const CACHE_FILE = join(process.cwd(), "data", "ai-cache.json");
const memory = new Map<string, CacheEntry>(
  Object.entries(savedCache as Record<string, CacheEntry>),
);

/** Normaliza a entrada: espaços colapsados, minúsculas e chaves ordenadas. */
function normalize(value: unknown): unknown {
  if (typeof value === "string") return value.replace(/\s+/g, " ").trim().toLowerCase();
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((k) => [k, normalize((value as Record<string, unknown>)[k])]),
    );
  }
  return value;
}

export function cacheKey(route: string, input: unknown) {
  return createHash("sha256")
    .update(`${route}\n${JSON.stringify(normalize(input))}`)
    .digest("hex")
    .slice(0, 16);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Gravações em fila para não corromper o arquivo com escritas simultâneas.
let writeQueue = Promise.resolve();
function persist(key: string, entry: CacheEntry) {
  writeQueue = writeQueue
    .then(async () => {
      let current: Record<string, CacheEntry> = {};
      try {
        current = JSON.parse(await readFile(CACHE_FILE, "utf8"));
      } catch {
        // arquivo ausente ou inválido: recomeça
      }
      current[key] = entry;
      await writeFile(CACHE_FILE, JSON.stringify(current, null, 2) + "\n");
    })
    .catch((err) => console.error("[ai-cache] falha ao gravar", err));
  return writeQueue;
}

interface Options<T> {
  route: string;
  input: unknown;
  /** chamada real à IA (já com timeout) */
  call: () => Promise<T>;
  /** resposta pré-escrita; null quando não há plano B para essa entrada */
  fallback?: () => T | null;
}

export async function withAICache<T>({ route, input, call, fallback }: Options<T>): Promise<AIResponse<T>> {
  const key = cacheKey(route, input);

  const hit = memory.get(key);
  if (hit) {
    await sleep(600 + Math.random() * 300);
    return { data: hit.output as T, source: "cache" };
  }

  try {
    const data = await call();
    const entry: CacheEntry = { route, input, output: data, savedAt: new Date().toISOString() };
    memory.set(key, entry);
    if (process.env.NODE_ENV === "development") await persist(key, entry);
    return { data, source: "live" };
  } catch (err) {
    console.error(`[ai] ${route} falhou:`, err instanceof Error ? err.message : err);
    const fb = fallback?.();
    if (fb) return { data: fb, source: "fallback", notice: describeAIError(err).title };
    throw err;
  }
}
