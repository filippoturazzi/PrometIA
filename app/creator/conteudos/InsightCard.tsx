"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { InsightResult } from "@/lib/schemas";

type State = { status: "loading" } | { status: "ok"; data: InsightResult } | { status: "error"; message: string };

// lembra os insights já carregados nesta aba (trocar de creator e voltar não chama a IA de novo)
const loaded = new Map<string, InsightResult>();

/** Card "Insights do PrometIA" (IA 3, scope=creator). Remontado por `key` a cada creator. */
export function InsightCard({ creatorId, creatorName }: { creatorId: string; creatorName: string }) {
  const [state, setState] = useState<State>(() => {
    const cached = loaded.get(creatorId);
    return cached ? { status: "ok", data: cached } : { status: "loading" };
  });

  useEffect(() => {
    if (loaded.has(creatorId)) return;
    let cancelled = false;
    fetch("/api/insight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope: "creator", id: creatorId }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setState({ status: "error", message: data.error ?? "Os insights não ficaram disponíveis agora." });
          return;
        }
        loaded.set(creatorId, data);
        setState({ status: "ok", data });
        if (data.source === "fallback") {
          toast("Modo demonstração", { description: "A IA demorou a responder; mostrando insights calculados dos dados." });
        }
      })
      .catch(() => !cancelled && setState({ status: "error", message: "Sem conexão com o servidor." }));
    return () => {
      cancelled = true;
    };
  }, [creatorId]);

  return (
    <section
      id="card-insights"
      aria-labelledby="insights-titulo"
      aria-live="polite"
      className="rounded-xl border border-primary/50 bg-card p-5 shadow-sm"
    >
      <h2 id="insights-titulo" className="flex items-center gap-2 text-lg">
        <Sparkles className="size-5 text-secondary" aria-hidden /> Insights do PrometIA
      </h2>
      <p className="text-sm text-muted-foreground">Gerados por IA a partir das vendas e reembolsos de {creatorName}</p>

      {state.status === "loading" && (
        <div className="mt-4 space-y-4" aria-label="Gerando insights">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      )}

      {state.status === "error" && <p className="mt-4 text-sm text-muted-foreground">{state.message}</p>}

      {state.status === "ok" && (
        <ol className="mt-4 space-y-4">
          {state.data.items.map((it, i) => (
            <li key={it.title} className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {i + 1}
              </span>
              <div>
                <p className="font-semibold text-secondary">{it.title}</p>
                <p className="text-sm text-muted-foreground">{it.body}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
