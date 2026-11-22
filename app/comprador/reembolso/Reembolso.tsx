"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  HandHelping,
  Loader2,
  MessageSquareHeart,
  PlayCircle,
  ShieldCheck,
} from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { SimulationBadge } from "@/components/SimulationBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { FRUSTRATION_LABELS, SEVERITY_META, STATUS_META, matchClaim } from "@/lib/claims-ui";
import type { ClassifyFeedbackResult } from "@/lib/schemas";
import type { ClaimStatus } from "@/lib/types";
import { EXPECTATION_KEY, useSessionValue } from "@/lib/session";
import { cn } from "@/lib/utils";

interface Order {
  number: string;
  productId: string;
  productName: string;
  producer: string;
  price: number;
  purchasedAt: string;
  contentId: string;
  contentTitle: string;
  contentChannel: string;
  creatorName: string;
  link: string;
  claims: { text: string; status: ClaimStatus }[];
  /** expectativa registrada na venda da demo */
  expectation: string | null;
}

type Step = "form" | "loading" | "classified" | "help" | "done";

const REASONS = [
  "Não era o que eu esperava",
  "Não consigo acessar o conteúdo",
  "Qualidade do conteúdo",
  "Me arrependi da compra",
  "Outro motivo",
];

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function Reembolso({ order, exampleText }: { order: Order; exampleText: string }) {
  const [step, setStep] = useState<Step>("form");
  const [reason, setReason] = useState(REASONS[0]);
  const [text, setText] = useState("");
  const [result, setResult] = useState<ClassifyFeedbackResult | null>(null);
  // a marcada na página de obrigado (se o comprador passou por ela) ou a da venda da demo
  const expectation = useSessionValue(EXPECTATION_KEY) ?? order.expectation;

  async function submit() {
    setStep("loading");
    setResult(null);
    try {
      const res = await fetch("/api/classify-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: order.productId, contentId: order.contentId, text, reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Não foi possível analisar agora.");
      } else {
        setResult(data);
        if (data.source === "fallback") {
          toast("Modo demonstração", { description: "A IA demorou a responder; mostrando uma análise salva." });
        }
      }
    } catch {
      toast.error("Sem conexão com o servidor.");
    }
    // com ou sem análise, o comprador segue podendo pedir o reembolso
    setStep("classified");
  }

  function reset() {
    setStep("form");
    setResult(null);
  }

  const relatedStatus = result?.relatedClaim
    ? matchClaim(order.claims, result.relatedClaim)?.status
    : undefined;

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[400px_minmax(0,1fr)]">
      {/* Celular: o que o comprador vê */}
      <div className="space-y-2">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <SimulationBadge /> O que o comprador vê
        </div>
        <PhoneFrame>
          <div id="phone-reembolso" className="flex min-h-full flex-col text-[13px] text-neutral-800">
            <div className="sticky top-0 z-10 border-b bg-white px-4 py-3">
              <div className="flex items-center gap-2">
                <ArrowLeft className="size-4" aria-hidden />
                <span className="font-semibold">Solicitar reembolso</span>
              </div>
              <p className="mt-0.5 pl-6 text-[11px] text-neutral-500">
                Minhas Compras › Pedido #{order.number} › Reembolso
              </p>
            </div>

            <div className="flex-1 space-y-4 bg-neutral-50 p-4">
              <OrderCard order={order} />

              {(step === "form" || step === "loading") && (
                <div className="space-y-4">
                  <p className="flex gap-2 rounded-lg bg-status-ok-bg p-3 text-[12px] text-neutral-700">
                    <ShieldCheck className="size-4 shrink-0 text-status-ok" aria-hidden />
                    Você está dentro do prazo de garantia de 7 dias. O reembolso é um direito seu.
                  </p>

                  <div className="space-y-1.5">
                    <label className="font-medium" htmlFor="motivo">
                      Motivo
                    </label>
                    <Select
                      items={REASONS.map((r) => ({ value: r, label: r }))}
                      value={reason}
                      onValueChange={(v) => v && setReason(v)}
                    >
                      <SelectTrigger id="motivo" className="w-full bg-white" disabled={step === "loading"}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {REASONS.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-medium" htmlFor="relato">
                        O que você esperava e o que recebeu?
                      </label>
                    </div>
                    <Textarea
                      id="relato"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      maxLength={2000}
                      disabled={step === "loading"}
                      placeholder="Conte com suas palavras. Isso nos ajuda a melhorar."
                      className="min-h-28 bg-white text-[13px]"
                    />
                    <button
                      id="btn-texto-exemplo"
                      type="button"
                      className="text-[12px] font-medium text-secondary underline underline-offset-2"
                      onClick={() => {
                        setReason(REASONS[0]);
                        setText(exampleText);
                      }}
                    >
                      Preencher com o exemplo da demo
                    </button>
                  </div>

                  <RefundButton
                    onClick={submit}
                    disabled={text.trim().length < 10 || step === "loading"}
                    loading={step === "loading"}
                  />
                </div>
              )}

              {step === "classified" && (
                <div className="space-y-3">
                  <div className="rounded-xl border bg-white p-4 shadow-sm">
                    <p className="flex items-center gap-2 font-semibold text-secondary">
                      <MessageSquareHeart className="size-4" aria-hidden /> Entendemos seu caso
                    </p>
                    {result?.summary && (
                      <p className="mt-2 rounded-lg bg-neutral-50 p-2.5 text-neutral-600">
                        <span className="block text-[11px] font-medium text-neutral-500">Resumo do seu relato</span>
                        {result.summary}
                      </p>
                    )}
                    <p className="mt-2 text-neutral-600">
                      Obrigado por contar. Isso chega ao produtor e ao creator para melhorar a divulgação.
                    </p>
                  </div>

                  {result?.helpOffer && (
                    <div className="rounded-xl border border-primary/50 bg-white p-4">
                      <p className="flex items-center gap-2 font-semibold text-secondary">
                        <HandHelping className="size-4" aria-hidden /> Podemos resolver agora
                      </p>
                      <p className="mt-2 text-neutral-600">{result.helpOffer}</p>
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-3 h-10 w-full text-[13px]"
                        onClick={() => setStep("help")}
                      >
                        Quero essa ajuda
                      </Button>
                    </div>
                  )}

                  <RefundButton onClick={() => setStep("done")} />
                  <button type="button" onClick={reset} className="w-full text-center text-[12px] text-neutral-500 underline">
                    Voltar e editar o relato
                  </button>
                </div>
              )}

              {step === "help" && (
                <div className="space-y-3">
                  <div className="rounded-xl border bg-white p-4 text-center shadow-sm">
                    <HandHelping className="mx-auto size-8 text-secondary" aria-hidden />
                    <p className="mt-2 font-semibold text-secondary">Combinado!</p>
                    <p className="mt-1 text-neutral-600">
                      O suporte vai entrar em contato em até 24h. Se não resolver, seu reembolso continua garantido.
                    </p>
                  </div>
                  <RefundButton onClick={() => setStep("done")} />
                </div>
              )}

              {step === "done" && (
                <div className="rounded-xl border bg-white p-5 text-center shadow-sm">
                  <CheckCircle2 className="mx-auto size-10 text-status-ok" aria-hidden />
                  <p className="mt-2 text-base font-semibold text-secondary">Reembolso solicitado</p>
                  <p className="mt-1 text-neutral-600">
                    {brl(order.price)} voltam pelo mesmo meio de pagamento da compra. Você recebe a confirmação por
                    e-mail.
                  </p>
                  <button type="button" onClick={reset} className="mt-4 text-[12px] text-neutral-500 underline">
                    Recomeçar a simulação
                  </button>
                </div>
              )}
            </div>
          </div>
        </PhoneFrame>
      </div>

      {/* Painel lateral: o que a YouShop vê */}
      <aside aria-label="O que a YouShop vê" aria-live="polite" className="space-y-4 lg:pt-7">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg">
            <Eye className="size-5" aria-hidden /> O que a YouShop vê
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Painel interno. O comprador não vê nada disto.
          </p>

          <dl className="mt-4 space-y-4 text-sm">
            <div>
              <dt className="text-xs font-medium tracking-wide text-secondary/70 uppercase">Conteúdo de origem</dt>
              <dd className="mt-1 flex items-start gap-2">
                <PlayCircle className="mt-0.5 size-4 shrink-0 text-secondary" aria-hidden />
                <span>
                  <strong className="text-secondary">“{order.contentTitle}”</strong> · {order.creatorName} ·{" "}
                  <span className="capitalize">{order.contentChannel}</span>
                  <code className="mt-1 block text-xs text-muted-foreground">{order.link}</code>
                </span>
              </dd>
            </div>

            {expectation && (
              <div>
                <dt className="text-xs font-medium tracking-wide text-secondary/70 uppercase">Expectativa marcada na compra</dt>
                <dd className="mt-1">
                  <span className="rounded-full bg-primary/15 px-2.5 py-0.5 font-medium text-secondary">{expectation}</span>
                </dd>
              </div>
            )}

            {step === "form" && (
              <p className="rounded-lg border border-dashed bg-muted/30 p-4 text-center text-muted-foreground">
                Aguardando o relato do comprador…
              </p>
            )}

            {step === "loading" && (
              <div className="space-y-3" aria-label="Analisando">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-16 w-full" />
              </div>
            )}

            {step !== "form" && step !== "loading" && !result && (
              <p className="rounded-lg bg-muted/40 p-4 text-muted-foreground">
                A análise automática não ficou disponível desta vez. O pedido segue normalmente para a fila.
              </p>
            )}

            {step !== "form" && step !== "loading" && result && (
              <>
                <div className="flex flex-wrap gap-6">
                  <div>
                    <dt className="text-xs font-medium tracking-wide text-secondary/70 uppercase">Tipo de frustração</dt>
                    <dd className="mt-1 font-semibold text-secondary">{FRUSTRATION_LABELS[result.type]}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium tracking-wide text-secondary/70 uppercase">Gravidade</dt>
                    <dd className="mt-1">
                      <StatusBadge
                        status={SEVERITY_META[result.severity].status}
                        label={SEVERITY_META[result.severity].label}
                        size="sm"
                      />
                    </dd>
                  </div>
                </div>

                <div>
                  <dt className="text-xs font-medium tracking-wide text-secondary/70 uppercase">Promessa relacionada</dt>
                  <dd className="mt-1">
                    {result.relatedClaim ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <mark
                          className={cn(
                            "rounded px-1 text-foreground",
                            relatedStatus ? STATUS_META[relatedStatus].mark : "bg-muted",
                          )}
                        >
                          “{result.relatedClaim}”
                        </mark>
                        {relatedStatus && <StatusBadge status={relatedStatus} size="sm" />}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Nenhuma promessa do conteúdo ligada a este caso.</span>
                    )}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-medium tracking-wide text-secondary/70 uppercase">Resumo da IA</dt>
                  <dd className="mt-1">{result.summary}</dd>
                </div>

                {result.helpOffer && (
                  <div>
                    <dt className="text-xs font-medium tracking-wide text-secondary/70 uppercase">Ajuda oferecida</dt>
                    <dd className="mt-1">{result.helpOffer}</dd>
                  </div>
                )}
              </>
            )}
          </dl>
        </div>
      </aside>
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  return (
    <div className="rounded-xl border bg-white p-3 shadow-sm">
      <div className="flex gap-3">
        <div className="bg-hero flex size-14 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-primary">
          CURSO
        </div>
        <div className="min-w-0">
          <p className="font-semibold">{order.productName}</p>
          <p className="text-[12px] text-neutral-500">por {order.producer}</p>
          <p className="mt-1 font-semibold">{brl(order.price)}</p>
        </div>
      </div>
      <p className="mt-2 border-t pt-2 text-[11px] text-neutral-500">
        Pedido #{order.number} · comprado em {order.purchasedAt} · via conteúdo de {order.creatorName}
      </p>
    </div>
  );
}

function RefundButton({ onClick, disabled, loading }: { onClick: () => void; disabled?: boolean; loading?: boolean }) {
  return (
    <Button id="btn-continuar-reembolso" type="button" className="h-10 w-full text-[13px] font-semibold" onClick={onClick} disabled={disabled}>
      {loading && <Loader2 className="size-4 animate-spin" />}
      Continuar com o reembolso
    </Button>
  );
}
