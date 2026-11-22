"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  BookOpen,
  Check,
  CircleCheck,
  Circle,
  FileText,
  Link2,
  LoaderCircle,
  Quote,
  ScanSearch,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Video,
} from "lucide-react";
import { ClaimCard, type ClaimCardData } from "@/components/ClaimCard";
import { CopyButton } from "@/components/CopyButton";
import { HighlightedScript } from "@/components/HighlightedScript";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RISK_META, STATUS_META } from "@/lib/claims-ui";
import { contentLink } from "@/lib/links";
import type { OverallRisk } from "@/lib/schemas";
import type { ClaimStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  creator: { name: string; handle: string };
  products: { id: string; name: string; slug: string }[];
  defaultProductId: string;
  exampleScript: string;
  nextContentId: string;
}

interface Result {
  claims: ClaimCardData[];
  overallRisk: OverallRisk;
  script: string;
  productId: string;
}

const MAX_CHARS = 4000;
const STATUSES = ["proibida", "exagerada", "sustentada"] as const;
const LOADING_STEPS = ["Extraindo promessas", "Conferindo com a página", "Sugerindo reescrita"];

const fieldLabel = "text-[13px] font-semibold text-ink";
const panel = "rounded-[14px] border border-line bg-white";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

function summary(counts: Record<ClaimStatus, number>, total: number) {
  const found = `${total} ${plural(total, "promessa encontrada", "promessas encontradas")}`;
  if (counts.proibida > 0)
    return `${found} · ${counts.proibida} ${plural(counts.proibida, "precisa ser removida", "precisam ser removidas")} antes de postar`;
  if (counts.exagerada > 0)
    return `${found} · ${counts.exagerada} ${plural(counts.exagerada, "pede ajuste", "pedem ajuste")} antes de postar`;
  return total > 0 ? `${found} · tudo confere com a página do produto` : found;
}

export function Checador({ creator, products, defaultProductId, exampleScript, nextContentId }: Props) {
  const [productId, setProductId] = useState(defaultProductId);
  const [script, setScript] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [link, setLink] = useState<string | null>(null);

  const product = products.find((p) => p.id === productId)!;

  // Progresso ilustrativo enquanto a IA responde.
  useEffect(() => {
    if (!loading) return;
    setLoadingStep(0);
    const timers = [setTimeout(() => setLoadingStep(1), 1200), setTimeout(() => setLoadingStep(2), 2800)];
    return () => timers.forEach(clearTimeout);
  }, [loading]);

  function reset() {
    setResult(null);
    setLink(null);
  }

  async function check() {
    setLoading(true);
    reset();
    try {
      const res = await fetch("/api/check-claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, script }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Não foi possível checar agora.");
        return;
      }
      setResult({ claims: data.claims, overallRisk: data.overallRisk, script, productId });
      if (data.source === "fallback") {
        toast("Modo demonstração", { description: "A IA demorou a responder; mostrando uma análise salva." });
      }
    } catch {
      toast.error("Sem conexão com o servidor. Tente de novo.");
    } finally {
      setLoading(false);
    }
  }

  const counts = (result?.claims ?? []).reduce<Record<ClaimStatus, number>>(
    (acc, c) => ({ ...acc, [c.status]: acc[c.status] + 1 }),
    { proibida: 0, exagerada: 0, sustentada: 0 },
  );
  const canCheck = script.trim().length >= 20 && !loading;

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[400px_minmax(0,1fr)]">
      {/* Entrada */}
      <section
        id="checador-entrada"
        aria-label="Roteiro"
        className={cn(panel, "flex flex-col gap-6 p-7 lg:sticky lg:top-40")}
      >
        <div className="flex items-center gap-3 border-b border-line pb-5">
          <span className="flex size-9 items-center justify-center rounded-full bg-navy text-[13px] font-semibold text-white">
            {initials(creator.name)}
          </span>
          <div className="flex flex-col gap-0.5">
            <span className="text-[14px] font-semibold text-ink">{creator.name}</span>
            <span className="text-[13px] text-muted-foreground">@{creator.handle}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className={fieldLabel} htmlFor="produto">
            Produto divulgado
          </label>
          <Select
            items={products.map((p) => ({ value: p.id, label: p.name }))}
            value={productId}
            onValueChange={(v) => {
              if (!v) return;
              setProductId(v);
              reset();
            }}
          >
            <SelectTrigger
              id="produto"
              className="w-full rounded-lg border-line bg-white px-3.5 py-3 text-[14px] text-ink data-[size=default]:h-auto"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <label className={fieldLabel} htmlFor="roteiro">
              Roteiro do vídeo
            </label>
            <button
              id="btn-roteiro-exemplo"
              type="button"
              className="flex items-center gap-1.5 text-[13px] font-medium text-navy hover:underline"
              onClick={() => {
                setProductId(defaultProductId);
                setScript(exampleScript);
                reset();
              }}
            >
              <FileText className="size-3.5" aria-hidden /> Usar exemplo
            </button>
          </div>
          <Textarea
            id="roteiro"
            value={script}
            onChange={(e) => setScript(e.target.value)}
            maxLength={MAX_CHARS}
            placeholder="Cole aqui o texto do seu vídeo, story ou legenda…"
            className="h-60 resize-none rounded-lg border-line bg-white p-3.5 text-[14px] leading-[22px] text-ink placeholder:text-[#94A0B2]"
          />
          <div className="flex items-start justify-between gap-2 text-[12px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Video className="size-3.5" aria-hidden /> Envio de vídeo com transcrição em breve
            </span>
            <span>
              {script.length} / {MAX_CHARS}
            </span>
          </div>
        </div>

        <button
          id="btn-checar"
          type="button"
          disabled={!canCheck}
          onClick={check}
          className="flex items-center justify-center gap-2 rounded-lg bg-lime px-5 py-3.5 text-[15px] font-semibold text-navy-deep transition-colors hover:bg-lime/85 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
          ) : (
            <ScanSearch className="size-4" aria-hidden />
          )}
          {loading ? "Checando promessas…" : "Checar promessas"}
        </button>
      </section>

      {/* Resultado */}
      <section aria-label="Resultado" aria-live="polite" className="min-w-0">
        {!loading && !result && (
          <div className={cn(panel, "flex min-h-[560px] flex-col items-center justify-center gap-7 p-12 text-center")}>
            <span className="flex size-14 items-center justify-center rounded-full bg-paper">
              <ScanSearch className="size-6 text-navy" aria-hidden />
            </span>
            <div className="flex flex-col gap-2">
              <p className="font-heading text-[22px] font-semibold text-ink">As promessas do roteiro aparecem aqui</p>
              <p className="text-[15px] text-muted-foreground">Cole um roteiro e clique em Checar promessas.</p>
            </div>
            <ul className="flex flex-wrap justify-center gap-x-8 gap-y-3 border-t border-line pt-6 text-[13px] text-muted-foreground">
              {[
                { icon: Quote, text: "Extrai cada promessa" },
                { icon: BookOpen, text: "Confere com a página" },
                { icon: Sparkles, text: "Sugere uma versão verdadeira" },
              ].map((f) => (
                <li key={f.text} className="flex items-center gap-2">
                  <f.icon className="size-4 text-navy" aria-hidden /> {f.text}
                </li>
              ))}
            </ul>
          </div>
        )}

        {loading && (
          <div className={cn(panel, "overflow-hidden")} aria-label="Carregando análise">
            <div className="flex items-center gap-3.5 border-b border-line px-8 py-6">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#EEF2F8]">
                <LoaderCircle className="size-5 animate-spin text-navy" aria-hidden />
              </span>
              <div className="flex flex-col gap-1.5">
                <p className="font-heading text-[20px] font-semibold text-ink">Analisando o roteiro…</p>
                <ul className="flex flex-wrap gap-x-[18px] gap-y-1 text-[13px]">
                  {LOADING_STEPS.map((s, i) => {
                    const Icon = i < loadingStep ? CircleCheck : i === loadingStep ? LoaderCircle : Circle;
                    return (
                      <li
                        key={s}
                        className={cn(
                          "flex items-center gap-1.5",
                          i < loadingStep && "text-ink",
                          i === loadingStep && "font-semibold text-ink",
                          i > loadingStep && "text-muted-foreground",
                        )}
                      >
                        <Icon
                          className={cn(
                            "size-3.5",
                            i < loadingStep && "text-status-ok",
                            i === loadingStep && "animate-spin text-navy",
                          )}
                          aria-hidden
                        />
                        {s}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex animate-pulse flex-col gap-3.5 border-b border-line px-8 py-7 last:border-b-0">
                <div className="flex items-center gap-3">
                  <span className="size-6 rounded-full bg-[#EEF1F5]" />
                  <span className="h-[22px] w-[90px] rounded-full bg-[#EEF1F5]" />
                  <span className="h-3.5 w-[110px] rounded-md bg-[#EEF1F5]" />
                </div>
                <span className="h-5 w-full rounded-md bg-[#EEF1F5]" />
                <span className="h-5 w-3/5 rounded-md bg-[#EEF1F5]" />
                <div className="grid grid-cols-2 gap-6">
                  {[0, 1].map((j) => (
                    <div key={j} className="flex flex-col gap-2">
                      <span className="h-2.5 w-[100px] rounded-md bg-[#EEF1F5]" />
                      <span className="h-3.5 w-full rounded-md bg-[#EEF1F5]" />
                      <span className="h-3.5 w-1/2 rounded-md bg-[#EEF1F5]" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {result && (
          <div className={cn(panel, "overflow-hidden")}>
            <ResultHeader result={result} counts={counts} />

            <div className="flex flex-col gap-3.5 border-b border-line bg-paper px-6 py-6 sm:px-8">
              <span className="text-[11px] font-semibold tracking-[1.4px] text-muted-foreground uppercase">
                Roteiro analisado
              </span>
              <HighlightedScript script={result.script} claims={result.claims} />
            </div>

            {result.claims.length === 0 ? (
              <p className="border-b border-line px-8 py-7 text-[14px] text-muted-foreground">
                Não encontramos promessas sobre o produto neste roteiro.
              </p>
            ) : (
              result.claims.map((c, i) => <ClaimCard key={`${i}-${c.text}`} claim={c} index={i} />)
            )}

            <div className="bg-navy-deep px-6 py-6 sm:px-8">
              {!link ? (
                <div className="flex flex-wrap items-center justify-between gap-6">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="font-heading text-[17px] font-semibold text-white">
                      Vai publicar? Gere um link só deste vídeo.
                    </p>
                    <p className="text-[14px] text-white/65">
                      Assim você acompanha quais vídeos vendem e quais geram reembolso.
                    </p>
                  </div>
                  <button
                    id="btn-gerar-link"
                    type="button"
                    onClick={() => setLink(contentLink(creator.handle, product.slug, nextContentId))}
                    className="flex items-center gap-2 rounded-lg bg-lime px-[18px] py-3 text-[14px] font-semibold text-navy-deep transition-colors hover:bg-lime/85"
                  >
                    <Link2 className="size-4" aria-hidden /> Gerar link do conteúdo
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3.5">
                  <p className="flex items-center gap-2 font-heading text-[17px] font-semibold text-white">
                    <CircleCheck className="size-[18px] text-lime" aria-hidden /> Link exclusivo deste conteúdo
                  </p>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <code className="min-w-0 flex-1 truncate rounded-lg border border-white/15 bg-white/[0.08] px-3.5 py-3 font-mono text-[12px] text-white">
                      {link}
                    </code>
                    <CopyButton
                      text={`https://${link}`}
                      label="Copiar link"
                      onCopied={() =>
                        toast("Link copiado", { icon: <Check className="size-4 text-lime" />, duration: 2000 })
                      }
                      className="h-auto rounded-lg border-0 bg-lime px-4 py-3 text-[14px] font-semibold text-navy-deep hover:bg-lime/85"
                    />
                  </div>
                  <p className="text-[13px] text-white/65">
                    Assim você vai saber exatamente quais vídeos vendem e quais geram reembolso.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function ResultHeader({ result, counts }: { result: Result; counts: Record<ClaimStatus, number> }) {
  const risk = RISK_META[result.overallRisk];
  const m = STATUS_META[risk.status];
  const Icon = result.overallRisk === "baixo" ? ShieldCheck : ShieldAlert;

  return (
    <div className="flex flex-col gap-5 border-b border-line px-6 py-7 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-full", m.bg)}>
            <Icon className={cn("size-5", m.text)} aria-hidden />
          </span>
          <div className="flex flex-col gap-0.5">
            <p className="font-heading text-[22px] font-semibold text-ink">{risk.label} de reembolso</p>
            <p className="text-[14px] text-muted-foreground">{summary(counts, result.claims.length)}</p>
          </div>
        </div>
        <ul className="flex flex-wrap gap-4 text-[13px] text-ink">
          {STATUSES.filter((s) => counts[s] > 0).map((s) => (
            <li key={s} className="flex items-center gap-1.5">
              <span className={cn("size-2 rounded-full", STATUS_META[s].solid)} aria-hidden />
              {counts[s]} {STATUS_META[s].label.toLowerCase()}
              {counts[s] > 1 ? "s" : ""}
            </li>
          ))}
        </ul>
      </div>
      {result.claims.length > 0 && (
        <div className="flex h-1.5 gap-1" aria-hidden>
          {result.claims.map((c, i) => (
            <span key={i} className={cn("flex-1 rounded-[3px]", STATUS_META[c.status].solid)} />
          ))}
        </div>
      )}
    </div>
  );
}
