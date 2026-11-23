"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  BookOpen,
  ChevronDown,
  CircleCheck,
  Circle,
  ExternalLink,
  FileText,
  Globe,
  ImagePlus,
  Images,
  LoaderCircle,
  Quote,
  ScanSearch,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
  Undo2,
  X,
} from "lucide-react";
import { ClaimCard, type ClaimCardData } from "@/components/ClaimCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toastAIError, toastDemoMode } from "@/lib/ai-toast";
import { RISK_META, STATUS_META, compareByRisk } from "@/lib/claims-ui";
import { fetchAsDataUrl, resizeImage } from "@/lib/image-resize";
import { MAX_IMAGES, MAX_IMAGE_B64 } from "@/lib/page-images";
import type { OverallRisk } from "@/lib/schemas";
import type { ClaimStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  products: { id: string; name: string; producer: string }[];
  defaultProductId: string;
  /** caminho da página de vendas fictícia (ex.: "/paginavendas") */
  examplePath: string;
  /** prints da página fictícia (ex.: "/demo/paginavendas-1.jpg") */
  examplePrints: string[];
}

type PageClaim = ClaimCardData & { refundRisk: OverallRisk };

interface Result {
  claims: PageClaim[];
  overallRisk: OverallRisk;
  summary: string;
  pageText: string;
}

const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];
const STATUSES = ["proibida", "exagerada", "sustentada"] as const;
const LOADING_STEPS = {
  url: ["Lendo a página", "Extraindo promessas", "Estimando risco de reembolso"],
  prints: ["Lendo os prints", "Extraindo promessas", "Estimando risco de reembolso"],
};
const UNREADABLE_URL = "Não conseguimos ler essa página. Envie prints dela.";

const fieldLabel = "text-[13px] font-semibold text-ink";
const panel = "rounded-[14px] border border-line bg-white";
const input =
  "w-full rounded-lg border border-line bg-white px-3.5 py-3 text-[14px] text-ink outline-none placeholder:text-[#94A0B2] focus-visible:border-navy focus-visible:ring-2 focus-visible:ring-navy/15";

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);
const b64Length = (dataUrl: string) => dataUrl.length - dataUrl.indexOf(",") - 1;

function countLine(counts: Record<ClaimStatus, number>, total: number) {
  const found = `${total} ${plural(total, "promessa encontrada", "promessas encontradas")}`;
  const risky = counts.proibida + counts.exagerada;
  if (risky > 0) return `${found} · ${risky} ${plural(risky, "pode gerar", "podem gerar")} reembolso`;
  return total > 0 ? `${found} · tudo confere com a ficha do produto` : found;
}

export function PageChecker({ products, defaultProductId, examplePath, examplePrints }: Props) {
  const [productId, setProductId] = useState(defaultProductId);
  const [url, setUrl] = useState("");
  /** prints como data URL; um ou outro: com prints, a URL fica vazia */
  const [prints, setPrints] = useState<string[]>([]);
  const [preparing, setPreparing] = useState(false);
  const [dragging, setDragging] = useState(false);
  /** aviso de leitura (URL ou prints), mostrado junto da área de prints */
  const [unreadable, setUnreadable] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [mode, setMode] = useState<"url" | "prints">("url");
  const [result, setResult] = useState<Result | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const dropZone = useRef<HTMLDivElement>(null);

  // Progresso ilustrativo enquanto a IA responde.
  useEffect(() => {
    if (!loading) return;
    const timers = [setTimeout(() => setLoadingStep(1), 2500), setTimeout(() => setLoadingStep(2), 6000)];
    return () => timers.forEach(clearTimeout);
  }, [loading]);

  function changeUrl(value: string) {
    setUrl(value);
    if (value) setPrints([]);
    setUnreadable(null);
  }

  function fillExample() {
    setProductId(defaultProductId);
    changeUrl(`${window.location.origin}${examplePath}`);
    setResult(null);
  }

  async function addFiles(files: FileList | File[]) {
    const list = [...files];
    if (list.some((f) => !ACCEPTED.includes(f.type))) {
      toast.error("Envie imagens PNG, JPG ou WEBP.");
      return;
    }
    if (prints.length + list.length > MAX_IMAGES) {
      toast.error(`Envie no máximo ${MAX_IMAGES} prints.`);
      return;
    }
    setPreparing(true);
    try {
      const resized = await Promise.all(list.map((f) => resizeImage(f)));
      const ok = resized.filter((d) => b64Length(d) <= MAX_IMAGE_B64);
      if (ok.length < resized.length) toast.error("Um print ficou grande demais mesmo reduzido e foi descartado.");
      if (ok.length) {
        setPrints((cur) => [...cur, ...ok].slice(0, MAX_IMAGES));
        setUrl("");
        setUnreadable(null);
        setResult(null);
      }
    } catch {
      toast.error("Não foi possível abrir essa imagem.");
    } finally {
      setPreparing(false);
    }
  }

  async function fillExamplePrints() {
    setPreparing(true);
    try {
      // sem redimensionar: os bytes precisam bater com o cache e o plano B da demo
      const imgs = await Promise.all(examplePrints.map(fetchAsDataUrl));
      setProductId(defaultProductId);
      setPrints(imgs);
      setUrl("");
      setUnreadable(null);
      setResult(null);
    } catch {
      toast.error("Não foi possível carregar os prints de exemplo.");
    } finally {
      setPreparing(false);
    }
  }

  function showUnreadable(message: string) {
    setUnreadable(message);
    dropZone.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    dropZone.current?.focus({ preventScroll: true });
  }

  async function check() {
    const usingPrints = prints.length > 0;
    setMode(usingPrints ? "prints" : "url");
    setLoadingStep(0);
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/check-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(usingPrints ? { productId, images: prints } : { productId, url }),
      });
      const data = await res.json();
      if (res.status === 422) {
        showUnreadable(usingPrints ? (data.error ?? "Não conseguimos ler texto nesses prints.") : UNREADABLE_URL);
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
  const canCheck = !loading && !preparing && (prints.length > 0 || url.trim().length >= 4);

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
            <Globe
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              id="url-pagina"
              type="text"
              inputMode="url"
              autoComplete="url"
              value={url}
              onChange={(e) => changeUrl(e.target.value)}
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

        <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
          <span className="h-px flex-1 bg-line" aria-hidden />
          ou
          <span className="h-px flex-1 bg-line" aria-hidden />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className={fieldLabel} id="prints-label">
              Prints da página
            </span>
            <button
              id="btn-prints-exemplo"
              type="button"
              className="flex items-center gap-1.5 text-[13px] font-medium text-navy hover:underline"
              onClick={fillExamplePrints}
            >
              <Images className="size-3.5" aria-hidden /> Usar prints de exemplo
            </button>
          </div>

          {unreadable && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-status-warn/30 bg-status-warn-bg px-3.5 py-3 text-[13px] text-ink"
            >
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-status-warn" aria-hidden />
              {unreadable}
            </p>
          )}

          <div
            ref={dropZone}
            role="button"
            tabIndex={0}
            aria-labelledby="prints-label"
            aria-describedby="prints-dica"
            onClick={() => prints.length < MAX_IMAGES && fileInput.current?.click()}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && prints.length < MAX_IMAGES) {
                e.preventDefault();
                fileInput.current?.click();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
            }}
            className={cn(
              "flex cursor-pointer flex-col gap-3 rounded-lg border border-dashed border-[#C9D1DD] bg-paper px-3.5 py-3 outline-none focus-visible:ring-2 focus-visible:ring-navy/20",
              dragging && "border-navy bg-[#EEF2F8]",
              unreadable && "border-status-warn",
            )}
          >
            {prints.length === 0 ? (
              <span className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-navy">
                  {preparing ? (
                    <LoaderCircle className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <ImagePlus className="size-4" aria-hidden />
                  )}
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-[14px] font-semibold text-ink">Enviar prints da página</span>
                  <span className="text-[12px] leading-[17px] text-muted-foreground">
                    Clique ou arraste · PNG, JPG ou WEBP
                  </span>
                </span>
              </span>
            ) : (
              <ul className="grid grid-cols-3 gap-2" aria-label="Prints enviados">
                {prints.map((src, i) => (
                  <li key={i} className="relative aspect-[3/4] overflow-hidden rounded-md border border-line bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element -- data URL local */}
                    <img src={src} alt={`Print ${i + 1}`} className="size-full object-cover object-top" />
                    <button
                      type="button"
                      aria-label={`Remover print ${i + 1}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setPrints((cur) => cur.filter((_, j) => j !== i));
                        setResult(null);
                      }}
                      className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-navy-deep/80 text-white hover:bg-navy-deep"
                    >
                      <X className="size-3.5" aria-hidden />
                    </button>
                  </li>
                ))}
                {prints.length < MAX_IMAGES && (
                  <li className="flex aspect-[3/4] items-center justify-center rounded-md border border-dashed border-[#C9D1DD] bg-white text-navy">
                    {preparing ? (
                      <LoaderCircle className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <ImagePlus className="size-5" aria-label="Adicionar print" />
                    )}
                  </li>
                )}
              </ul>
            )}
          </div>
          <input
            ref={fileInput}
            type="file"
            accept={ACCEPTED.join(",")}
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files?.length) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <p id="prints-dica" className="flex justify-between gap-3 text-[12px] text-muted-foreground">
            <span>Até {MAX_IMAGES} prints. Para páginas longas, tire um print por parte da página.</span>
            <span className="shrink-0">
              {prints.length} de {MAX_IMAGES}
            </span>
          </p>
        </div>

        <button
          id="btn-checar-pagina"
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
          {loading ? "Checando a página…" : prints.length ? "Checar prints" : "Checar página"}
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
              <p className="text-[15px] text-muted-foreground">Cole a URL da sua página ou envie prints dela.</p>
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
                  {LOADING_STEPS[mode].map((s, i) => {
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
