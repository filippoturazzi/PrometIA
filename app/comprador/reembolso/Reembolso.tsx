"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  Clapperboard,
  Eye,
  GitBranch,
  HandHelping,
  Hourglass,
  LifeBuoy,
  LoaderCircle,
  PlayCircle,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Target,
} from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { StatusBadge } from "@/components/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FRUSTRATION_LABELS, matchClaim } from "@/lib/claims-ui";
import type { ClassifyFeedbackResult } from "@/lib/schemas";
import type { ClaimStatus, Severity } from "@/lib/types";
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

const CHANNEL: Record<string, string> = { tiktok: "TikTok", instagram: "Instagram", youtube: "YouTube" };

// gravidade no cabeçalho escuro do painel
const SEVERITY_DARK: Record<Severity, { label: string; bg: string; fg: string; dot: string }> = {
  alta: { label: "Gravidade alta", bg: "bg-[#FF6B5A26]", fg: "text-[#FF9A8C]", dot: "bg-[#FF6B5A]" },
  media: { label: "Gravidade média", bg: "bg-[#FDB55A26]", fg: "text-[#FFC97A]", dot: "bg-[#FFC97A]" },
  baixa: { label: "Gravidade baixa", bg: "bg-[#4CC38A26]", fg: "text-[#7FDCAE]", dot: "bg-[#7FDCAE]" },
};

const brl = (v: number, cents = true) =>
  v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  });

const sectionLabel = "flex items-center gap-2 text-[11px] font-semibold tracking-[1.4px] text-muted-foreground uppercase";

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

  const related = result?.relatedClaim ? matchClaim(order.claims, result.relatedClaim) : undefined;
  const stage = step === "form" || step === "loading" ? 1 : step === "done" ? 3 : 2;
  const analysed = step !== "form" && step !== "loading";

  return (
    <div className="grid items-start gap-12 lg:grid-cols-[380px_minmax(0,1fr)]">
      {/* Celular: o que o comprador vê */}
      <div className="flex flex-col gap-4">
        <p className={cn(sectionLabel, "justify-center")}>
          <Smartphone className="size-3.5" aria-hidden /> O que o comprador vê
          <span className="rounded-full bg-status-warn-bg px-2 py-0.5 text-[10px] tracking-normal text-status-warn normal-case">
            Simulação
          </span>
        </p>
        <PhoneFrame id="phone-frame">
          <div id="phone-reembolso" className="flex min-h-full flex-1 flex-col text-[13px] text-ink">
            <div className="flex items-center gap-3 px-5 pt-3 pb-4">
              <ArrowLeft className="size-5" aria-hidden />
              <div className="flex flex-col">
                <span className="text-[15px] font-semibold">Solicitar reembolso</span>
                <span className="text-[11px] text-muted-foreground">Pedido #{order.number}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-paper px-5 py-3.5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-navy">
                <Clapperboard className="size-[18px] text-lime" aria-hidden />
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-[13px] font-semibold">{order.productName}</span>
                <span className="text-[11px] text-muted-foreground">
                  {order.producer} · {order.purchasedAt}
                </span>
              </div>
              <span className="text-[15px] font-semibold">{brl(order.price, false)}</span>
            </div>

            <div className="flex flex-1 flex-col gap-4 px-5 pt-5 pb-5">
              <div className="flex gap-1" aria-label={`Etapa ${stage} de 3`}>
                {[1, 2, 3].map((n) => (
                  <span key={n} className={cn("h-[3px] flex-1 rounded-full", n <= stage ? "bg-navy" : "bg-line")} />
                ))}
              </div>

              {(step === "form" || step === "loading") && (
                <>
                  <StageTitle n={1} title="Conte o que aconteceu" />
                  <p className="flex gap-2 rounded-lg bg-status-ok-bg px-3 py-2.5 text-[12px] text-status-ok">
                    <ShieldCheck className="mt-px size-4 shrink-0" aria-hidden />
                    Você está no prazo de garantia de 7 dias. O reembolso é um direito seu.
                  </p>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-semibold" htmlFor="motivo">
                      Motivo
                    </label>
                    <Select
                      items={REASONS.map((r) => ({ value: r, label: r }))}
                      value={reason}
                      onValueChange={(v) => v && setReason(v)}
                    >
                      <SelectTrigger
                        id="motivo"
                        className="w-full rounded-lg border-line bg-white px-3 py-2.5 text-[13px] data-[size=default]:h-auto"
                        disabled={step === "loading"}
                      >
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

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-semibold" htmlFor="relato">
                      O que você esperava e o que recebeu?
                    </label>
                    <Textarea
                      id="relato"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      maxLength={2000}
                      disabled={step === "loading"}
                      placeholder="Conte com suas palavras. Isso nos ajuda a melhorar."
                      className="min-h-24 resize-none rounded-lg border-line bg-white px-3 py-2.5 text-[13px] leading-[19px]"
                    />
                    <button
                      id="btn-texto-exemplo"
                      type="button"
                      className="self-start text-[12px] font-medium text-navy underline underline-offset-2"
                      onClick={() => {
                        setReason(REASONS[0]);
                        setText(exampleText);
                      }}
                    >
                      Preencher com o exemplo da demo
                    </button>
                  </div>

                  <div className="mt-auto pt-2">
                    <PrimaryButton
                      id="btn-continuar-reembolso"
                      onClick={submit}
                      disabled={text.trim().length < 10 || step === "loading"}
                    >
                      {step === "loading" && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
                      {step === "loading" ? "Analisando…" : "Continuar"}
                    </PrimaryButton>
                  </div>
                </>
              )}

              {step === "classified" && (
                <>
                  <StageTitle n={2} title={result?.helpOffer ? "Podemos resolver agora" : "Entendemos seu caso"} />
                  {result?.summary && (
                    <div className="flex flex-col gap-1 rounded-lg bg-paper px-3.5 py-3">
                      <span className="text-[11px] text-muted-foreground">Resumo do seu relato</span>
                      <span className="text-[13px] leading-[19px]">{result.summary}</span>
                    </div>
                  )}

                  {result?.helpOffer ? (
                    <div className="flex flex-col gap-2.5 rounded-xl border-[1.5px] border-navy p-3.5">
                      <p className="flex items-center gap-2 text-[13px] font-semibold">
                        <LifeBuoy className="size-4" aria-hidden />
                        {result.type === "acesso_tecnico" ? "Parece um problema de acesso" : "Talvez a gente resolva agora"}
                      </p>
                      <p className="text-[12px] leading-[18px] text-muted-foreground">{result.helpOffer}</p>
                      <button
                        type="button"
                        onClick={() => setStep("help")}
                        className="rounded-lg bg-navy py-2.5 text-[13px] font-semibold text-white hover:bg-navy/90"
                      >
                        Quero essa ajuda
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="text-[13px] leading-5 text-muted-foreground">
                        Obrigado por contar. Isso chega ao produtor e ao creator para melhorar a divulgação.
                      </p>
                      <p className="flex gap-2 text-[12px] text-status-ok">
                        <ShieldCheck className="mt-px size-4 shrink-0" aria-hidden />
                        Dentro da garantia de 7 dias — o reembolso é seu direito.
                      </p>
                    </>
                  )}

                  <div className="mt-auto flex flex-col gap-3 pt-2">
                    {result?.helpOffer ? (
                      <SecondaryButton id="btn-continuar-reembolso" onClick={() => setStep("done")}>
                        Prefiro continuar com o reembolso
                      </SecondaryButton>
                    ) : (
                      <PrimaryButton id="btn-continuar-reembolso" onClick={() => setStep("done")}>
                        Continuar com o reembolso
                      </PrimaryButton>
                    )}
                    <button
                      type="button"
                      onClick={reset}
                      className="text-center text-[12px] text-muted-foreground hover:text-ink"
                    >
                      Voltar e editar o relato
                    </button>
                  </div>
                </>
              )}

              {step === "help" && (
                <>
                  <StageTitle n={2} title="Combinado!" />
                  <div className="flex flex-col items-center gap-2 rounded-xl bg-paper p-5 text-center">
                    <HandHelping className="size-8 text-navy" aria-hidden />
                    <p className="text-[13px] leading-5 text-muted-foreground">
                      O suporte vai entrar em contato em até 24h. Se não resolver, seu reembolso continua garantido.
                    </p>
                  </div>
                  <div className="mt-auto pt-2">
                    <SecondaryButton id="btn-continuar-reembolso" onClick={() => setStep("done")}>
                      Prefiro continuar com o reembolso
                    </SecondaryButton>
                  </div>
                </>
              )}

              {step === "done" && (
                <>
                  <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                    <span className="flex size-14 items-center justify-center rounded-full bg-status-ok-bg">
                      <Check className="size-7 text-status-ok" aria-hidden />
                    </span>
                    <p className="font-heading text-[20px] font-semibold">Reembolso solicitado</p>
                    <p className="text-[13px] leading-5 text-muted-foreground">
                      {brl(order.price)} voltam pelo mesmo meio de pagamento da compra. Você recebe a confirmação por
                      e-mail.
                    </p>
                    <dl className="mt-2 w-full rounded-lg bg-paper px-3.5 text-[12px]">
                      <div className="flex justify-between border-b border-line py-2.5">
                        <dt className="text-muted-foreground">Pedido recebido</dt>
                        <dd className="font-semibold">Hoje</dd>
                      </div>
                      <div className="flex justify-between py-2.5">
                        <dt className="text-muted-foreground">Estorno no cartão</dt>
                        <dd className="font-semibold">até 5 dias úteis</dd>
                      </div>
                    </dl>
                  </div>
                  <SecondaryButton onClick={reset}>Voltar para Minhas compras</SecondaryButton>
                </>
              )}
            </div>
          </div>
        </PhoneFrame>
      </div>

      {/* Painel lateral: o que a YouShop vê */}
      <aside aria-label="O que a YouShop vê" aria-live="polite" className="flex min-w-0 flex-col gap-4">
        <p className={sectionLabel}>
          <Eye className="size-3.5" aria-hidden /> O que a YouShop vê · Painel interno
        </p>
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-navy-deep px-6 py-[18px]">
            <div className="flex flex-col gap-0.5">
              <p className="font-heading text-[16px] font-semibold text-white">Pedido de reembolso #{order.number}</p>
              <p className="text-[12px] text-white/60">O comprador não vê nada deste painel.</p>
            </div>
            {analysed && result && (
              <span
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-2.5 py-[5px] text-[12px] font-semibold",
                  SEVERITY_DARK[result.severity].bg,
                  SEVERITY_DARK[result.severity].fg,
                )}
              >
                <span className={cn("size-[7px] rounded-full", SEVERITY_DARK[result.severity].dot)} />
                {SEVERITY_DARK[result.severity].label}
              </span>
            )}
          </div>

          <dl>
            <Row label="Conteúdo de origem">
              <span className="flex items-start gap-2">
                <PlayCircle className="mt-0.5 size-4 shrink-0 text-ink" aria-hidden />
                <span className="flex min-w-0 flex-col gap-1">
                  <span>
                    <strong className="font-semibold">“{order.contentTitle}”</strong>
                    <span className="font-normal text-muted-foreground">
                      {" "}
                      · {order.creatorName} · {CHANNEL[order.contentChannel] ?? order.contentChannel}
                    </span>
                  </span>
                  <code className="truncate font-mono text-[12px] font-normal text-muted-foreground">{order.link}</code>
                </span>
              </span>
            </Row>

            {expectation && (
              <Row label="Expectativa na compra">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-2.5 py-1 text-[13px]">
                  <Target className="size-3.5" aria-hidden /> {expectation}
                </span>
              </Row>
            )}

            {step === "form" && (
              <div className="flex items-center justify-center gap-2.5 px-6 py-5 text-[14px] text-muted-foreground">
                <Hourglass className="size-4" aria-hidden /> Aguardando o relato do comprador…
              </div>
            )}

            {step === "loading" && (
              <div className="flex animate-pulse flex-col gap-3 px-6 py-5" aria-label="Analisando">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex gap-5">
                    <span className="h-3.5 w-[170px] rounded bg-[#EEF1F5]" />
                    <span className="h-3.5 flex-1 rounded bg-[#EEF1F5]" />
                  </div>
                ))}
              </div>
            )}

            {analysed && !result && (
              <p className="px-6 py-5 text-[14px] text-muted-foreground">
                A análise automática não ficou disponível desta vez. O pedido segue normalmente para a fila.
              </p>
            )}

            {analysed && result && (
              <>
                <Row label="Tipo de frustração">{FRUSTRATION_LABELS[result.type]}</Row>
                <Row label="Promessa relacionada">
                  {result.relatedClaim ? (
                    <span className="flex flex-wrap items-center gap-2 font-normal">
                      <em>“{related?.text ?? result.relatedClaim}”</em>
                      {related && (
                        <StatusBadge status={related.status} size="sm" className="px-2 py-0.5 text-[11px]" />
                      )}
                    </span>
                  ) : (
                    <em className="font-normal text-muted-foreground">Nenhuma promessa do conteúdo ligada a este caso.</em>
                  )}
                </Row>
                <Row label="Resumo da IA">
                  <span className="flex gap-2 font-normal">
                    <Sparkles className="mt-0.5 size-3.5 shrink-0 text-navy" aria-hidden />
                    {result.summary}
                  </span>
                </Row>
                {result.helpOffer && (
                  <Row label="Ajuda oferecida">
                    <span className="font-normal">{result.helpOffer}</span>
                  </Row>
                )}
              </>
            )}
          </dl>
        </div>
        <p className="flex items-center gap-2 px-1 text-[13px] text-muted-foreground">
          <GitBranch className="size-3.5" aria-hidden />
          Este caso alimenta o painel do produtor e o aprendizado do creator {order.creatorName}.
        </p>
      </aside>
    </div>
  );
}

function StageTitle({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold tracking-[1.2px] text-muted-foreground uppercase">Etapa {n} de 3</span>
      <span className="font-heading text-[20px] font-semibold">{title}</span>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 border-b border-line px-6 py-4 last:border-b-0 sm:flex-row sm:gap-5">
      <dt className="w-[170px] shrink-0 text-[11px] leading-[19px] font-semibold tracking-[0.8px] text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="min-w-0 flex-1 text-[14px] leading-[21px] font-semibold text-ink">{children}</dd>
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
  id,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-lime py-3.5 text-[14px] font-semibold text-navy-deep transition-colors hover:bg-lime/85 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children, onClick, id }: { children: React.ReactNode; onClick: () => void; id?: string }) {
  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      className="w-full rounded-[10px] border border-line bg-white py-3.5 text-[13px] font-semibold text-ink transition-colors hover:bg-paper"
    >
      {children}
    </button>
  );
}
