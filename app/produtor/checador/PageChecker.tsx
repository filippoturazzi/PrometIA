"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  BookOpen,
  ChevronDown,
  CircleCheck,
  Circle,
  ExternalLink,
  FileText,
  Globe,
  LoaderCircle,
  Quote,
  ScanSearch,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
  Undo2,
} from "lucide-react";
import { ClaimCard, type ClaimCardData } from "@/components/ClaimCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toastAIError, toastDemoMode } from "@/lib/ai-toast";
import { RISK_META, STATUS_META, compareByRisk } from "@/lib/claims-ui";
import type { OverallRisk } from "@/lib/schemas";
import type { ClaimStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  products: { id: string; name: string; producer: string }[];
  defaultProductId: string;
  /** caminho da página de vendas fictícia (ex.: "/paginavendas") */
  examplePath: string;
}

type PageClaim = ClaimCardData & { refundRisk: OverallRisk };

interface Result {
  claims: PageClaim[];
  overallRisk: OverallRisk;
  summary: string;
  pageText: string;
}

const MAX_TEXT = 6000;
const STATUSES = ["proibida", "exagerada", "sustentada"] as const;
const LOADING_STEPS = ["Lendo a página", "Extraindo promessas", "Estimando risco de reembolso"];

const fieldLabel = "text-[13px] font-semibold text-ink";
const panel = "rounded-[14px] border border-line bg-white";
const input =
  "w-full rounded-lg border border-line bg-white px-3.5 py-3 text-[14px] text-ink outline-none placeholder:text-[#94A0B2] focus-visible:border-navy focus-visible:ring-2 focus-visible:ring-navy/15";

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

function countLine(counts: Record<ClaimStatus, number>, total: number) {
  const found = `${total} ${plural(total, "promessa encontrada", "promessas encontradas")}`;
  const risky = counts.proibida + counts.exagerada;
  if (risky > 0) return `${found} · ${risky} ${plural(risky, "pode gerar", "podem gerar")} reembolso`;
  return total > 0 ? `${found} · tudo confere com a ficha do produto` : found;
}

export function PageChecker({ products, defaultProductId, examplePath }: Props) {
  const [productId, setProductId] = useState(defaultProductId);
  const [url, setUrl] = useState("");
  const [pastedText, setPastedText] = useState("");
  /** a URL não pôde ser lida: a tela passa a checar o texto colado */
  const [unreadable, setUnreadable] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<Result | null>(null);

  // Progresso ilustrativo enquanto a IA responde.
  useEffect(() => {
    if (!loading) return;
    const timers = [setTimeout(() => setLoadingStep(1), 1500), setTimeout(() => setLoadingStep(2), 4000)];
    return () => timers.forEach(clearTimeout);
  }, [loading]);

  function fillExample() {
    setProductId(defaultProductId);
    setUrl(`${window.location.origin}${examplePath}`);
    setUnreadable(null);
    setPastedText("");
    setResult(null);
  }

  async function check() {
    setLoadingStep(0);
    setLoading(true);
    setResult(null);
    const usingText = !!unreadable;
    try {
      const res = await fetch("/api/check-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(usingText ? { productId, text: pastedText } : { productId, url }),
      });
      const data = await res.json();
      if (res.status === 422) {
        setUnreadable(data.error ?? "Não conseguimos ler essa página. Cole o texto dela abaixo.");
        return;
      }
      if (!res.ok) {
        toastAIError(data, "Não foi possível checar agora.");
        return;
      }
      setResult({
        claims: [...data.claims].sort(compareByRisk),
        overallRisk: data.overallRisk,
        summary: data.summary,
        pageText: data.pageText,
      });
      toastDemoMode(data, "uma análise salva");
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
  const canCheck = !loading && (unreadable ? pastedText.trim().length >= 80 : url.trim().length >= 4);

  return (
    <div className="grid gap-8 lg:grid-cols-[400px_minmax(0,1fr)]">
      {/* Entrada */}
      <section
        id="checador-produtor-entrada"
        aria-label="Página de vendas"
        className={cn(panel, "flex flex-col gap-6 p-7 lg:sticky lg:top-40 lg:self-start")}
      >
        <div className="flex flex-col gap-2">
          <label className={fieldLabel} htmlFor="produto">
            Produto
          </label>
          <Select
            items={products.map((p) => ({ value: p.id, label: `${p.name} · ${p.producer}` }))}
            value={productId}
            onValueChange={(v) => {
              if (!v) return;
              setProductId(v);
              setResult(null);
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
                  {p.name} · {p.producer}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[12px] text-muted-foreground">A IA compara a página com a ficha cadastrada deste produto.</p>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <label className={fieldLabel} htmlFor="url-pagina">
              URL da página de vendas
            </label>
            <button
              id="btn-pagina-exemplo"
              type="button"
              className="flex items-center gap-1.5 text-[13px] font-medium text-navy hover:underline"
              onClick={fillExample}
            >
              <FileText className="size-3.5" aria-hidden /> Usar página de exemplo
            </button>
          </div>
          <div className="relative">
            <Globe className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input
              id="url-pagina"
              type="text"
              inputMode="url"
              autoComplete="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setUnreadable(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && canCheck && check()}
              placeholder="https://sualoja.com.br/oferta"
              className={cn(input, "pl-10")}
            />
          </div>
          <a
            href={examplePath}
            target="_blank"
            rel="noreferrer"
            className="flex w-fit items-center gap-1.5 text-[12px] text-muted-foreground hover:text-navy hover:underline"
          >
            <ExternalLink className="size-3.5" aria-hidden /> Abrir a página de exemplo em outra aba
          </a>
        </div>

        {unreadable && (
          <div className="flex flex-col gap-2">
            <p
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-status-warn/30 bg-status-warn-bg px-3.5 py-3 text-[13px] text-ink"
            >
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-status-warn" aria-hidden />
              {unreadable}
            </p>
            <label className={fieldLabel} htmlFor="texto-pagina">
              Cole o texto da página
            </label>
            <Textarea
              id="texto-pagina"
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              maxLength={MAX_TEXT}
              placeholder="Copie os textos da página (título, benefícios, depoimentos, garantia) e cole aqui…"
              className="h-48 resize-none rounded-lg border-line bg-white p-3.5 text-[14px] leading-[22px] text-ink placeholder:text-[#94A0B2]"
            />
            <div className="flex items-center justify-between text-[12px] text-muted-foreground">
              <button type="button" className="hover:text-navy hover:underline" onClick={() => setUnreadable(null)}>
                Tentar a URL de novo
              </button>
              <span>
                {pastedText.length} / {MAX_TEXT}
              </span>
            </div>
          </div>
        )}

        <button
          id="btn-checar-pagina"
          type="button"
          disabled={!canCheck}
          onClick={check}
          className="flex items-center justify-center gap-2 rounded-lg bg-lime px-5 py-3.5 text-[15px] font-semibold text-navy-deep transition-colors hover:bg-lime/85 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <ScanSearch className="size-4" aria-hidden />}
          {loading ? "Checando a página…" : unreadable ? "Checar texto colado" : "Checar página"}
        </button>
      </section>

      {/* Resultado */}
      <section aria-label="Resultado" aria-live="polite" className="flex min-w-0 flex-col">
        {!loading && !result && (
          <div className={cn(panel, "flex min-h-[520px] flex-1 flex-col items-center justify-center gap-7 p-8 text-center sm:p-12")}>
            <span className="flex size-14 items-center justify-center rounded-full bg-paper">
              <Globe className="size-6 text-navy" aria-hidden />
            </span>
            <div className="flex flex-col gap-2">
              <p className="font-heading text-[22px] font-semibold text-ink">As promessas da sua página aparecem aqui</p>
              <p className="text-[15px] text-muted-foreground">Cole a URL da sua página ou use a página de exemplo.</p>
            </div>
            <ul className="flex flex-wrap justify-center gap-x-8 gap-y-3 border-t border-line pt-6 text-[13px] text-muted-foreground">
              {[
                { icon: Quote, text: "Lê cada promessa da página" },
                { icon: BookOpen, text: "Confere com a ficha do produto" },
                { icon: Undo2, text: "Estima o risco de reembolso" },
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
            <div className="flex items-center gap-3.5 border-b border-line px-6 py-6 sm:px-8">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#EEF2F8]">
                <LoaderCircle className="size-5 animate-spin text-navy" aria-hidden />
              </span>
              <div className="flex flex-col gap-1.5">
                <p className="font-heading text-[20px] font-semibold text-ink">Analisando a página…</p>
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
                          className={cn("size-3.5", i < loadingStep && "text-status-ok", i === loadingStep && "animate-spin text-navy")}
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
                </div>
                <span className="h-5 w-full rounded-md bg-[#EEF1F5]" />
                <span className="h-5 w-3/5 rounded-md bg-[#EEF1F5]" />
              </div>
            ))}
          </div>
        )}

        {result && (
          <div className={cn(panel, "overflow-hidden")}>
            <ResultHeader result={result} counts={counts} />

            {result.claims.length === 0 ? (
              <p className="border-b border-line px-8 py-7 text-[14px] text-muted-foreground">
                Não encontramos promessas sobre o produto nesta página.
              </p>
            ) : (
              result.claims.map((c, i) => (
                <ClaimCard
                  key={`${i}-${c.text}`}
                  claim={c}
                  index={i}
                  evidenceLabel="Ficha do produto"
                  refundRisk={c.refundRisk}
                />
              ))
            )}

            <details className="group bg-paper px-6 py-5 sm:px-8">
              <summary className="flex cursor-pointer list-none items-center gap-2 text-[13px] font-semibold text-ink">
                <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden />
                Texto lido da página
              </summary>
              <pre className="mt-4 max-h-80 overflow-auto rounded-lg border border-line bg-white p-4 font-sans text-[13px] leading-[21px] whitespace-pre-wrap text-ink">
                {result.pageText}
              </pre>
            </details>
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
            <p className="text-[14px] text-muted-foreground">{countLine(counts, result.claims.length)}</p>
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
      {result.summary && <p className="text-[15px] leading-[23px] text-ink">{result.summary}</p>}
      {result.overallRisk !== "baixo" && (
        <p className="rounded-lg bg-paper px-4 py-3 text-[14px] text-slate">
          Promessas assim geram reembolso por expectativa desalinhada.
        </p>
      )}
    </div>
  );
}
