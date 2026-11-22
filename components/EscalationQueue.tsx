"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  BellRing,
  CirclePlay,
  FileSearch,
  Link2,
  MessageSquareQuote,
  Package,
  RotateCcw,
  Sparkles,
  Timer,
  User,
  X,
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { FRUSTRATION_LABELS, SEVERITY_META, STATUS_META } from "@/lib/claims-ui";
import type { InsightResult } from "@/lib/schemas";
import type { ClaimStatus, FrustrationType, Severity } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface QueueItem {
  feedbackId: string;
  buyer: string;
  productName: string;
  creatorName: string;
  contentTitle: string;
  hours: number;
  responded: boolean;
  severity: Severity;
  type: FrustrationType;
  text: string;
  expectation?: string;
  relatedClaim?: string;
  relatedStatus?: ClaimStatus;
}

type Audience = "operacoes" | "produtor";

const ACTIONS: Record<Audience, { label: string; icon: typeof BellRing; done: string }[]> = {
  operacoes: [
    { label: "Acionar produtor", icon: BellRing, done: "Produtor acionado" },
    { label: "Reembolsar proativamente", icon: RotateCcw, done: "Reembolso proativo registrado" },
    { label: "Revisar conteúdo", icon: FileSearch, done: "Conteúdo enviado para revisão do creator" },
  ],
  produtor: [
    { label: "Responder comprador", icon: BellRing, done: "Resposta ao comprador registrada" },
    { label: "Reembolsar proativamente", icon: RotateCcw, done: "Reembolso proativo registrado" },
    { label: "Pedir revisão ao creator", icon: FileSearch, done: "Pedido de revisão enviado ao creator" },
  ],
};

const waitLabel = (c: QueueItem) => (c.responded ? `respondeu em ${c.hours}h` : `${c.hours}h sem resposta`);
const th = "py-2.5 text-left text-[11px] font-semibold tracking-[1px] text-muted-foreground uppercase";
const caption = "flex items-center gap-1.5 text-[11px] font-semibold tracking-[1.2px] text-muted-foreground uppercase";

/** Gravidade com bolinha (Alta / Média / Baixa). */
export function SeverityBadge({ severity, full = false }: { severity: Severity; full?: boolean }) {
  const m = STATUS_META[SEVERITY_META[severity].status];
  const label = SEVERITY_META[severity].label;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold", m.bg, m.text)}>
      <span className={cn("size-1.5 rounded-full", m.solid)} aria-hidden />
      {full ? label : label.replace("Gravidade ", "").replace(/^./, (c) => c.toUpperCase())}
    </span>
  );
}

export function EscalationQueue({
  cases,
  audience,
  title,
  subtitle,
}: {
  cases: QueueItem[];
  audience: Audience;
  title: string;
  subtitle: string;
}) {
  const [open, setOpen] = useState<QueueItem | null>(null);
  const [insight, setInsight] = useState<InsightResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  async function openCase(c: QueueItem) {
    setOpen(c);
    setInsight(null);
    setFailed(false);
    setLoading(true);
    try {
      const res = await fetch("/api/insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: "case", id: c.feedbackId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFailed(true);
        toast.error(data.error ?? "Não foi possível resumir o caso agora.");
      } else {
        setInsight(data);
        if (data.source === "fallback") {
          toast("Modo demonstração", { description: "A IA demorou a responder; mostrando um resumo salvo." });
        }
      }
    } catch {
      setFailed(true);
      toast.error("Sem conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-1 px-7 py-6">
        <div className="flex items-center gap-2.5">
          <h2 className="text-[20px]">{title}</h2>
          {cases.length > 0 && (
            <span className="rounded-full bg-status-bad px-[9px] py-0.5 text-[12px] font-bold text-white">
              {cases.length}
            </span>
          )}
        </div>
        <p className="text-[13px] text-muted-foreground">{subtitle}</p>
      </div>

      {!cases.length ? (
        <p className="border-t border-line px-7 py-8 text-center text-[14px] text-muted-foreground">
          Nenhum caso precisando de atenção agora.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr className="border-y border-line bg-paper">
                <th className={cn(th, "w-[170px] pl-7")}>Comprador</th>
                <th className={cn(th, "w-[190px] px-2.5")}>Produto</th>
                <th className={cn(th, "px-2.5")}>Creator · conteúdo</th>
                <th className={cn(th, "w-[200px] px-2.5")}>{audience === "produtor" ? "Sua resposta" : "Produtor"}</th>
                <th className={cn(th, "w-[120px] px-2.5")}>Gravidade</th>
                <th className={cn(th, "w-[124px] pr-7")}>
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <tr key={c.feedbackId} className="border-b border-line text-[14px] text-ink last:border-b-0">
                  <td className="py-4 pl-7 font-semibold">{c.buyer}</td>
                  <td className="px-2.5">{c.productName}</td>
                  <td className="max-w-0 px-2.5">
                    <span className="block">{c.creatorName}</span>
                    <span className="block truncate text-[12px] text-muted-foreground italic">“{c.contentTitle}”</span>
                  </td>
                  <td className="px-2.5">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 text-[13px] tabular-nums",
                        c.responded ? "text-muted-foreground" : "font-semibold text-status-bad",
                      )}
                    >
                      <Timer className="size-3.5" aria-hidden />
                      {waitLabel(c)}
                    </span>
                  </td>
                  <td className="px-2.5">
                    <SeverityBadge severity={c.severity} />
                  </td>
                  <td className="pr-7 text-right">
                    <button
                      type="button"
                      onClick={() => openCase(c)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg border px-3 py-[7px] text-[13px] font-semibold whitespace-nowrap transition-colors",
                        audience === "produtor"
                          ? "border-navy bg-navy text-white hover:bg-navy/90"
                          : "border-line text-navy hover:bg-paper",
                      )}
                    >
                      {audience === "produtor" ? "Responder" : "Ver caso"} <ArrowRight className="size-3.5" aria-hidden />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Sheet open={open !== null} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent>
          {open && (
            <>
              <div className="flex flex-col gap-3.5 border-b border-line px-8 py-7">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    <SeverityBadge severity={open.severity} full />
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-paper px-2.5 py-1 text-[12px] font-semibold text-ink">
                      <Timer className="size-3.5" aria-hidden />
                      {open.responded ? `Produtor respondeu em ${open.hours}h` : `Produtor sem resposta há ${open.hours}h`}
                    </span>
                  </div>
                  <SheetClose
                    aria-label="Fechar"
                    className="flex size-8 items-center justify-center rounded-lg border border-line text-ink hover:bg-paper"
                  >
                    <X className="size-4" />
                  </SheetClose>
                </div>
                <SheetTitle className="font-heading text-[26px] font-semibold tracking-[-0.4px] text-ink">
                  Caso do {open.buyer.toLowerCase().startsWith("comprador") ? open.buyer.toLowerCase() : open.buyer}
                </SheetTitle>
                <SheetDescription className="flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Package className="size-3.5" aria-hidden /> {open.productName}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <User className="size-3.5" aria-hidden /> {open.creatorName}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CirclePlay className="size-3.5" aria-hidden /> “{open.contentTitle}”
                  </span>
                </SheetDescription>
              </div>

              <div className="flex flex-1 flex-col gap-7 overflow-y-auto px-8 py-7">
                <div className="flex flex-col gap-2.5">
                  <span className={caption}>
                    <MessageSquareQuote className="size-3.5" aria-hidden /> O que o comprador escreveu
                  </span>
                  <p className="font-heading text-[19px] leading-[27px] font-medium text-ink">“{open.text.replace(/^./, (c) => c.toUpperCase())}”</p>
                </div>

                <div className="grid grid-cols-2 gap-6 border-y border-line py-5">
                  <div className="flex flex-col gap-2">
                    <span className={caption}>Tipo de frustração</span>
                    <span className="text-[15px] font-semibold text-ink">{FRUSTRATION_LABELS[open.type]}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className={caption}>Expectativa na compra</span>
                    <span className="text-[15px] font-semibold text-ink">{open.expectation ?? "Não informada"}</span>
                  </div>
                </div>

                {open.relatedClaim && (
                  <div className="flex flex-col gap-2.5">
                    <span className={caption}>
                      <Link2 className="size-3.5" aria-hidden /> Promessa do conteúdo ligada ao caso
                    </span>
                    <div className="flex items-center gap-3">
                      <em className="flex-1 text-[15px] text-ink">“{open.relatedClaim}”</em>
                      {open.relatedStatus && (
                        <StatusBadge status={open.relatedStatus} size="sm" className="px-[9px] py-[3px]" />
                      )}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-3 rounded-xl bg-paper p-5">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-[1.2px] text-navy uppercase">
                    <Sparkles className="size-3.5" aria-hidden /> Resumo do PrometIA
                  </span>
                  {loading && (
                    <div className="flex animate-pulse flex-col gap-2" aria-label="Resumindo o caso">
                      <span className="h-3.5 w-full rounded bg-[#E3E8EF]" />
                      <span className="h-3.5 w-5/6 rounded bg-[#E3E8EF]" />
                      <span className="h-3.5 w-2/3 rounded bg-[#E3E8EF]" />
                    </div>
                  )}
                  {failed && !loading && (
                    <p className="text-[14px] text-muted-foreground">
                      O resumo automático não ficou disponível. Os dados do caso estão acima.
                    </p>
                  )}
                  {insight && (
                    <>
                      {insight.items.map((it) => (
                        <p key={it.title} className="text-[14px] leading-[22px] text-ink">
                          {it.body}
                        </p>
                      ))}
                      {insight.suggestedAction && (
                        <p className="flex gap-2.5 border-t border-line pt-3 text-[14px] leading-[22px] font-semibold text-navy">
                          <ArrowRight className="mt-1 size-4 shrink-0" aria-hidden />
                          Ação sugerida: {insight.suggestedAction.replace(/^./, (c) => c.toLowerCase())}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2.5 border-t border-line bg-paper px-8 py-5">
                {(() => {
                  const [main, ...rest] = ACTIONS[audience];
                  const act = (a: (typeof rest)[number]) => () =>
                    toast.success(a.done, { description: "Simulação: nenhuma mensagem real foi enviada." });
                  return (
                    <>
                      <button
                        type="button"
                        onClick={act(main)}
                        className="flex items-center justify-center gap-2 rounded-lg bg-lime px-[18px] py-3 text-[14px] font-semibold text-navy-deep transition-colors hover:bg-lime/85"
                      >
                        <main.icon className="size-4" aria-hidden /> {main.label}
                      </button>
                      <div className="flex flex-col gap-2.5 sm:flex-row">
                        {rest.map((a) => (
                          <button
                            key={a.label}
                            type="button"
                            onClick={act(a)}
                            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-line bg-white px-3.5 py-3 text-[14px] font-medium text-ink transition-colors hover:bg-white/70"
                          >
                            <a.icon className="size-4" aria-hidden /> {a.label}
                          </button>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
