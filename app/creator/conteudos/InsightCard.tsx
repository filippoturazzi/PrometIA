"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowRight, Sparkles } from "lucide-react";
import type { InsightResult } from "@/lib/schemas";

type State = { status: "loading" } | { status: "ok"; data: InsightResult } | { status: "error"; message: string };

// lembra os insights já carregados nesta aba (trocar de creator e voltar não chama a IA de novo)
const loaded = new Map<string, InsightResult>();

/** Card "Insights do PrometIA" (IA 3, scope=creator). Remontado por `key` a cada creator. */
export function InsightCard({ creatorId }: { creatorId: string }) {
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
      className="flex flex-col rounded-[14px] border border-line bg-white p-7"
    >
      <div className="flex flex-col gap-1 pb-5">
        <h2 id="insights-titulo" className="flex items-center gap-2 text-[20px]">
          <Sparkles className="size-[18px] text-navy" aria-hidden /> Insights do PrometIA
        </h2>
        <p className="text-[13px] text-muted-foreground">Gerados por IA a partir das suas vendas e reembolsos</p>
      </div>

      {state.status === "loading" && (
        <div aria-label="Gerando insights">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex animate-pulse gap-3.5 border-t border-line py-[18px]">
              <span className="h-3.5 w-5 rounded bg-[#EEF1F5]" />
              <div className="flex flex-1 flex-col gap-2">
                <span className="h-4 w-1/2 rounded bg-[#EEF1F5]" />
                <span className="h-3.5 w-full rounded bg-[#EEF1F5]" />
                <span className="h-3.5 w-2/3 rounded bg-[#EEF1F5]" />
              </div>
            </div>
          ))}
        </div>
      )}

      {state.status === "error" && (
        <p className="border-t border-line pt-[18px] text-[13px] text-muted-foreground">{state.message}</p>
      )}

      {state.status === "ok" && (
        <ol>
          {state.data.items.map((it, i) => (
            <li key={it.title} className="flex gap-3.5 border-t border-line py-[18px] last:pb-0">
              <span className="w-5 shrink-0 font-heading text-[13px] font-semibold text-muted-foreground tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <p className="text-[15px] font-semibold text-ink">{it.title}</p>
                <p className="text-[13px] leading-5 text-muted-foreground">{it.body}</p>
                {i === 0 && (
                  <Link
                    href="/creator/checador"
                    className="flex items-center gap-1.5 pt-1.5 text-[13px] font-semibold text-navy hover:underline"
                  >
                    Abrir no checador <ArrowRight className="size-3.5" aria-hidden />
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
