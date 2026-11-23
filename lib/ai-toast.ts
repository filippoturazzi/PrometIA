import { toast } from "sonner";

// Avisos das chamadas de IA no cliente: erros da API do Groq (limite, cota, fora do ar)
// aparecem com título e explicação, para quem testa a demo entender o que houve.

interface AIErrorBody {
  error?: string;
  detail?: string;
}

interface AISourceBody {
  source?: string;
  notice?: string;
}

/** Toast de erro da IA (título + explicação vinda do servidor). Devolve o texto para uso inline. */
export function toastAIError(data: AIErrorBody | null | undefined, fallbackTitle: string) {
  const title = data?.error ?? fallbackTitle;
  toast.error(title, { description: data?.detail, duration: 10_000 });
  return { title, detail: data?.detail };
}

/** Quando o servidor usou a resposta salva, avisa o motivo. `what`: ex. "uma análise salva". */
export function toastDemoMode(data: AISourceBody, what: string) {
  if (data.source !== "fallback") return;
  const reason = data.notice ?? "A IA demorou a responder";
  toast("Modo demonstração", { description: `${reason}. Mostrando ${what}.`, duration: 8_000 });
}
