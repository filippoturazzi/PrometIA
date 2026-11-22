"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, ChevronRight, Circle, LifeBuoy, PlayCircle, X } from "lucide-react";
import { SimulationBadge } from "@/components/SimulationBadge";
import { EXPECTATION_KEY, useSessionValue } from "@/lib/session";
import { cn } from "@/lib/utils";

interface Props {
  product: { name: string; producer: string; modules: string[] };
}

type Answer = "positivo" | "neutro" | "negativo";

const OPTIONS: { value: Answer; emoji: string; label: string }[] = [
  { value: "positivo", emoji: "👍", label: "Sim" },
  { value: "neutro", emoji: "😐", label: "Mais ou menos" },
  { value: "negativo", emoji: "👎", label: "Não" },
];

export function YouClass({ product }: Props) {
  const expectation = useSessionValue(EXPECTATION_KEY);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const done = 1; // aulas concluídas no mock

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card shadow-lg">
      {/* barra da área de membros */}
      <div className="flex items-center justify-between gap-3 border-b bg-neutral-50 px-5 py-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Área de membros</p>
          <p className="truncate font-semibold text-secondary">{product.name}</p>
        </div>
        <SimulationBadge />
      </div>

      <div className="grid min-h-[460px] md:grid-cols-[260px_minmax(0,1fr)]">
        {/* módulos */}
        <nav aria-label="Módulos" className="border-b bg-white p-4 md:border-r md:border-b-0">
          <p className="text-xs font-medium tracking-wide text-secondary/70 uppercase">
            Seu progresso · {done}/{product.modules.length}
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
            <div className="h-full rounded-full bg-primary" style={{ width: `${(done / product.modules.length) * 100}%` }} />
          </div>
          <ol className="mt-4 space-y-1">
            {product.modules.map((m, i) => (
              <li
                key={m}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2 py-2 text-sm",
                  i === done ? "bg-primary/10 font-medium text-secondary" : "text-muted-foreground",
                )}
              >
                {i < done ? (
                  <CheckCircle2 className="size-4 shrink-0 text-status-ok" aria-label="Concluído" />
                ) : i === done ? (
                  <PlayCircle className="size-4 shrink-0 text-secondary" aria-label="Em andamento" />
                ) : (
                  <Circle className="size-4 shrink-0" aria-hidden />
                )}
                {m}
              </li>
            ))}
          </ol>
        </nav>

        {/* aula atual */}
        <div className="p-5">
          <div className="bg-hero flex aspect-video max-h-72 w-full items-center justify-center rounded-xl">
            <PlayCircle className="size-16 text-white/80" aria-hidden />
          </div>
          <p className="mt-4 text-lg font-semibold text-secondary">{product.modules[done]}</p>
          <p className="text-sm text-muted-foreground">Aula 1 · 12 min · por {product.producer}</p>
          {expectation && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs text-secondary">
              Sua expectativa na compra: <strong>{expectation}</strong>
            </p>
          )}
        </div>
      </div>

      {/* card flutuante de check-in */}
      {!dismissed && (
        <div
          id="card-checkin"
          role="dialog"
          aria-label="Check-in"
          className="absolute right-4 bottom-4 w-[min(320px,calc(100%-2rem))] rounded-xl border bg-white p-4 shadow-2xl"
        >
          <button
            type="button"
            aria-label="Fechar"
            onClick={() => setDismissed(true)}
            className="absolute top-2 right-2 rounded p-1 text-muted-foreground hover:bg-muted"
          >
            <X className="size-4" />
          </button>

          {!answer && (
            <>
              <p className="pr-6 font-semibold text-secondary">Está sendo o que você esperava?</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setAnswer(o.value)}
                    className="flex flex-col items-center gap-1 rounded-lg border py-2 text-xs text-muted-foreground transition-colors hover:border-primary hover:bg-primary/10"
                  >
                    <span className="text-2xl" aria-hidden>
                      {o.emoji}
                    </span>
                    {o.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {answer === "positivo" && (
            <p className="pr-6 text-sm">
              <strong className="text-secondary">Que bom! 🎉</strong> Bons estudos. A gente pergunta de novo mais pra frente.
            </p>
          )}

          {(answer === "neutro" || answer === "negativo") && (
            <div className="space-y-3 pr-2 text-sm">
              <p>
                <strong className="text-secondary">
                  {answer === "negativo" ? "Poxa, sentimos muito." : "Obrigado por contar."}
                </strong>{" "}
                Sua resposta chega ao produtor para melhorar o curso.
              </p>
              <Link
                id="link-ajuda-reembolso"
                href="/comprador/reembolso"
                className="flex items-center justify-between gap-2 rounded-lg border border-primary/50 bg-highlight px-3 py-2 font-medium text-secondary hover:bg-primary/15"
              >
                <span className="flex items-center gap-2">
                  <LifeBuoy className="size-4" aria-hidden />
                  Precisa de ajuda ou quer solicitar reembolso?
                </span>
                <ChevronRight className="size-4" aria-hidden />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
