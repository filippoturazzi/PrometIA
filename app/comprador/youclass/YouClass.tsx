"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Check,
  ChevronRight,
  Frown,
  Heart,
  LifeBuoy,
  Meh,
  MessageCircle,
  Play,
  Target,
  ThumbsDown,
  ThumbsUp,
  X,
  type LucideIcon,
} from "lucide-react";
import { BrowserFrame } from "@/components/BrowserFrame";
import { EXPECTATION_KEY, useSessionValue } from "@/lib/session";
import { cn } from "@/lib/utils";

interface Props {
  product: { name: string; slug: string; producer: string; modules: string[] };
}

type Answer = "positivo" | "neutro" | "negativo";

const OPTIONS: { value: Answer; icon: LucideIcon; label: string }[] = [
  { value: "positivo", icon: ThumbsUp, label: "Sim" },
  { value: "neutro", icon: Meh, label: "Mais ou menos" },
  { value: "negativo", icon: ThumbsDown, label: "Não" },
];

const REPLIES: Record<Answer, { icon: LucideIcon; bg: string; fg: string; title: string; help: boolean }> = {
  positivo: { icon: Heart, bg: "bg-status-ok-bg", fg: "text-status-ok", title: "Obrigado por contar!", help: false },
  neutro: {
    icon: MessageCircle,
    bg: "bg-status-warn-bg",
    fg: "text-status-warn",
    title: "Obrigado pela sinceridade.",
    help: true,
  },
  negativo: { icon: Frown, bg: "bg-status-bad-bg", fg: "text-status-bad", title: "Poxa, sentimos muito.", help: true },
};

export function YouClass({ product }: Props) {
  const expectation = useSessionValue(EXPECTATION_KEY);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const done = 1; // aulas concluídas no mock
  const total = product.modules.length;
  const title = (m: string) => m.replace(/^M\d+\s+/, "");

  return (
    <BrowserFrame url={`youclass.youshop.co/${product.slug}/m${done + 1}`}>
      <div className="grid md:grid-cols-[300px_minmax(0,1fr)]">
        {/* módulos */}
        <nav aria-label="Módulos" className="flex flex-col gap-6 border-b border-line px-6 py-7 md:border-r md:border-b-0">
          <div className="flex flex-col gap-1">
            <span className="text-[12px] text-muted-foreground">Área de membros</span>
            <span className="font-heading text-[18px] font-semibold text-ink">{product.name}</span>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-[12px]">
              <span className="font-medium text-muted-foreground">Seu progresso</span>
              <span className="font-semibold text-ink">
                {done} de {total}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-[3px] bg-[#EEF1F5]" aria-hidden>
              <div className="h-full rounded-[3px] bg-status-ok" style={{ width: `${(done / total) * 100}%` }} />
            </div>
          </div>
          <ol className="flex flex-col gap-0.5">
            {product.modules.map((m, i) => (
              <li
                key={m}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] leading-5",
                  i === done ? "bg-[#EEF2F8] font-semibold text-ink" : i < done ? "text-ink" : "text-muted-foreground",
                )}
              >
                {i < done ? (
                  <span className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-status-ok">
                    <Check className="size-3 text-white" strokeWidth={3} aria-label="Concluído" />
                  </span>
                ) : i === done ? (
                  <span className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-navy">
                    <Play className="size-2.5 fill-white text-white" aria-label="Em andamento" />
                  </span>
                ) : (
                  <span className="flex size-[22px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-[#C5CEDA] text-[11px] font-semibold text-muted-foreground">
                    {i + 1}
                  </span>
                )}
                {title(m)}
              </li>
            ))}
          </ol>
        </nav>

        {/* aula atual */}
        <div className="flex min-w-0 flex-col gap-7 p-7">
          <div className="flex aspect-video max-h-[420px] w-full flex-col overflow-hidden rounded-xl bg-navy-deep">
            <div className="flex flex-1 items-center justify-center">
              <span className="flex size-[72px] items-center justify-center rounded-full bg-white">
                <Play className="ml-1 size-7 fill-navy-deep text-navy-deep" aria-hidden />
              </span>
            </div>
            <div className="flex items-center gap-3.5 px-5 py-3.5 text-[12px] text-white/70" aria-hidden>
              0:00
              <span className="h-1 flex-1 rounded-[2px] bg-white/20" />
              12:00
            </div>
          </div>

          <div className="flex flex-col gap-8 xl:flex-row xl:items-start">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <span className="text-[11px] font-semibold tracking-[1.4px] text-muted-foreground uppercase">
                Módulo {done + 1} · Aula 1
              </span>
              <p className="font-heading text-[24px] font-semibold text-ink">{title(product.modules[done] ?? "")}</p>
              <p className="text-[14px] text-muted-foreground">12 min · por {product.producer}</p>
              {expectation && (
                <p className="flex flex-wrap items-center gap-2 pt-2 text-[13px] text-muted-foreground">
                  <Target className="size-4 text-navy" aria-hidden />
                  Sua expectativa na compra: <strong className="font-semibold text-ink">{expectation}</strong>
                </p>
              )}
            </div>

            {!dismissed && (
              <div
                id="card-checkin"
                role="dialog"
                aria-label="Check-in"
                className="flex w-full flex-col gap-4 rounded-xl border border-line bg-white p-5 shadow-[0_8px_24px_rgb(20_40_74/0.12)] xl:w-[380px] xl:shrink-0"
              >
                {!answer ? (
                  <>
                    <div className="flex justify-between gap-3">
                      <div className="flex flex-col gap-1">
                        <p className="text-[15px] font-semibold text-ink">Está sendo o que você esperava?</p>
                        <p className="text-[12px] text-muted-foreground">Sua resposta vai direto para o produtor.</p>
                      </div>
                      <button
                        type="button"
                        aria-label="Fechar"
                        onClick={() => setDismissed(true)}
                        className="self-start rounded p-0.5 text-muted-foreground hover:bg-paper"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {OPTIONS.map((o) => (
                        <button
                          key={o.value}
                          type="button"
                          onClick={() => setAnswer(o.value)}
                          className="flex flex-col items-center gap-2 rounded-[10px] border border-line px-2 py-3.5 text-[13px] font-medium text-ink transition-colors hover:border-navy/40 hover:bg-paper"
                        >
                          <o.icon className="size-5 text-navy" aria-hidden />
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <Reply answer={answer} onClose={() => setDismissed(true)} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

function Reply({ answer, onClose }: { answer: Answer; onClose: () => void }) {
  const r = REPLIES[answer];
  return (
    <>
      <div className="flex gap-3">
        <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", r.bg)}>
          <r.icon className={cn("size-4", r.fg)} aria-hidden />
        </span>
        <div className="flex flex-1 flex-col gap-1">
          <p className="text-[15px] font-semibold text-ink">{r.title}</p>
          <p className="text-[13px] leading-5 text-muted-foreground">
            Sua resposta chega ao produtor para melhorar o curso.
          </p>
        </div>
        <button
          type="button"
          aria-label="Fechar"
          onClick={onClose}
          className="self-start rounded p-0.5 text-muted-foreground hover:bg-paper"
        >
          <X className="size-4" />
        </button>
      </div>
      {r.help && (
        <Link
          id="link-ajuda-reembolso"
          href="/comprador/reembolso"
          className="flex items-center gap-2.5 rounded-lg bg-paper px-3.5 py-3 text-[13px] font-semibold text-navy hover:bg-[#EEF2F8]"
        >
          <LifeBuoy className="size-4 shrink-0" aria-hidden />
          <span className="flex-1">Precisa de ajuda ou quer solicitar reembolso?</span>
          <ChevronRight className="size-4 shrink-0" aria-hidden />
        </Link>
      )}
    </>
  );
}
