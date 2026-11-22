"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, BellRing, Clock, FileSearch, RotateCcw, Sparkles } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

export function EscalationQueue({ cases, audience }: { cases: QueueItem[]; audience: Audience }) {
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

  if (!cases.length) {
    return (
      <p className="rounded-xl border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        Nenhum caso precisando de atenção agora.
      </p>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Comprador</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Creator · conteúdo</TableHead>
              <TableHead>Produtor</TableHead>
              <TableHead>Gravidade</TableHead>
              <TableHead className="text-right">
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cases.map((c) => (
              <TableRow key={c.feedbackId}>
                <TableCell className="font-medium text-secondary">{c.buyer}</TableCell>
                <TableCell>{c.productName}</TableCell>
                <TableCell className="max-w-56">
                  <span className="block">{c.creatorName}</span>
                  <span className="block truncate text-xs text-muted-foreground">“{c.contentTitle}”</span>
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 tabular-nums",
                      !c.responded && "font-semibold text-status-bad",
                    )}
                  >
                    <Clock className="size-3.5" aria-hidden />
                    {waitLabel(c)}
                  </span>
                </TableCell>
                <TableCell>
                  <StatusBadge
                    status={SEVERITY_META[c.severity].status}
                    label={SEVERITY_META[c.severity].label.replace("Gravidade ", "")}
                    size="sm"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" onClick={() => openCase(c)}>
                    Ver caso
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open !== null} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-secondary">
                  <AlertTriangle className="size-4 text-status-bad" aria-hidden />
                  Caso de {open.buyer}
                </DialogTitle>
                <DialogDescription>
                  {open.productName} · {open.creatorName}, “{open.contentTitle}” · {waitLabel(open)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 text-sm">
                <blockquote className="rounded-lg bg-muted/60 p-3">
                  <span className="block text-xs font-medium tracking-wide text-secondary/70 uppercase">
                    O que o comprador escreveu
                  </span>
                  <span className="italic">“{open.text}”</span>
                </blockquote>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-secondary">{FRUSTRATION_LABELS[open.type]}</span>
                  <StatusBadge status={SEVERITY_META[open.severity].status} label={SEVERITY_META[open.severity].label} size="sm" />
                </div>

                {open.relatedClaim && (
                  <div>
                    <span className="block text-xs font-medium tracking-wide text-secondary/70 uppercase">
                      Promessa do conteúdo ligada ao caso
                    </span>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <mark
                        className={cn(
                          "rounded px-1 text-foreground",
                          open.relatedStatus ? STATUS_META[open.relatedStatus].mark : "bg-muted",
                        )}
                      >
                        “{open.relatedClaim}”
                      </mark>
                      {open.relatedStatus && <StatusBadge status={open.relatedStatus} size="sm" />}
                    </div>
                  </div>
                )}

                <div className="rounded-lg border border-primary/40 bg-highlight p-3">
                  <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-secondary uppercase">
                    <Sparkles className="size-3.5" aria-hidden /> Resumo do PrometIA
                  </span>
                  {loading && (
                    <div className="mt-2 space-y-2" aria-label="Resumindo o caso">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  )}
                  {failed && !loading && (
                    <p className="mt-2 text-muted-foreground">O resumo automático não ficou disponível. Os dados do caso estão acima.</p>
                  )}
                  {insight && (
                    <div className="mt-2 space-y-2">
                      {insight.items.map((it) => (
                        <p key={it.title}>
                          <strong className="text-secondary">{it.title}.</strong> {it.body}
                        </p>
                      ))}
                      {insight.suggestedAction && (
                        <p className="rounded-md bg-white/70 p-2">
                          <span className="font-semibold text-secondary">Ação sugerida: </span>
                          {insight.suggestedAction}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="flex-wrap gap-2 sm:justify-start">
                {ACTIONS[audience].map((a, i) => (
                  <Button
                    key={a.label}
                    variant={i === 0 ? "default" : "outline"}
                    onClick={() => toast.success(a.done, { description: "Simulação: nenhuma mensagem real foi enviada." })}
                  >
                    <a.icon className="size-4" /> {a.label}
                  </Button>
                ))}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
