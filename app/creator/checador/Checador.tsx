"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FileText, Info, Link2, Loader2, SearchCheck, Sparkles } from "lucide-react";
import { ClaimCard, type ClaimCardData } from "@/components/ClaimCard";
import { CopyButton } from "@/components/CopyButton";
import { HighlightedScript } from "@/components/HighlightedScript";
import { RiskBadge, StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { contentLink } from "@/lib/links";
import type { OverallRisk } from "@/lib/schemas";
import type { ClaimStatus } from "@/lib/types";

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

export function Checador({ creator, products, defaultProductId, exampleScript, nextContentId }: Props) {
  const [productId, setProductId] = useState(defaultProductId);
  const [script, setScript] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [link, setLink] = useState<string | null>(null);

  const product = products.find((p) => p.id === productId)!;

  async function check() {
    setLoading(true);
    setResult(null);
    setLink(null);
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
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-lg border border-secondary/15 bg-secondary/5 px-4 py-2.5 text-sm text-secondary">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>
          <strong>O PrometIA orienta, não bloqueia.</strong> A decisão de publicar é sua.
        </span>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* Entrada */}
        <section id="checador-entrada" aria-label="Roteiro" className="space-y-4 rounded-xl border bg-card p-5 shadow-sm lg:sticky lg:top-32">
          <p className="text-sm text-muted-foreground">
            Você está como <strong className="text-secondary">{creator.name}</strong> (@{creator.handle})
          </p>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-secondary" htmlFor="produto">
              Produto divulgado
            </label>
            <Select
              items={products.map((p) => ({ value: p.id, label: p.name }))}
              value={productId}
              onValueChange={(v) => {
                if (!v) return;
                setProductId(v);
                setResult(null);
                setLink(null);
              }}
            >
              <SelectTrigger id="produto" className="w-full bg-input-background">
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

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-sm font-medium text-secondary" htmlFor="roteiro">
                Roteiro do vídeo
              </label>
              <Button
                id="btn-roteiro-exemplo"
                type="button"
                variant="ghost"
                size="sm"
                className="text-secondary"
                onClick={() => {
                  setProductId(defaultProductId);
                  setScript(exampleScript);
                  setResult(null);
                  setLink(null);
                }}
              >
                <FileText className="size-3.5" /> Usar roteiro de exemplo
              </Button>
            </div>
            <Textarea
              id="roteiro"
              value={script}
              onChange={(e) => setScript(e.target.value)}
              maxLength={MAX_CHARS}
              placeholder="Cole aqui o texto do seu vídeo, story ou legenda…"
              className="min-h-56 border-transparent bg-input-background text-sm leading-relaxed"
            />
            <p className="text-right text-xs text-muted-foreground">
              {script.length}/{MAX_CHARS}
            </p>
          </div>

          <Button
            id="btn-checar"
            type="button"
            size="lg"
            className="h-10 w-full text-sm font-semibold"
            disabled={!canCheck}
            onClick={check}
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <SearchCheck className="size-4" />}
            {loading ? "Checando promessas…" : "Checar promessas"}
          </Button>
        </section>

        {/* Resultado */}
        <section aria-label="Resultado" aria-live="polite" className="min-w-0 space-y-4">
          {!loading && !result && (
            <div className="flex flex-col items-center rounded-xl border border-dashed bg-muted/30 px-6 py-16 text-center">
              <Sparkles className="size-8 text-secondary/40" aria-hidden />
              <p className="mt-3 font-medium text-secondary">As promessas do roteiro aparecem aqui</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Cole um roteiro e clique em <strong>Checar promessas</strong>. Sem ideia? Use o roteiro de exemplo.
              </p>
            </div>
          )}

          {loading && (
            <div className="space-y-4" aria-label="Carregando análise">
              <Skeleton className="h-24 w-full rounded-xl" />
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-40 w-full rounded-xl" />
              ))}
            </div>
          )}

          {result && (
            <>
              <div className="rounded-xl border bg-card p-5 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <RiskBadge risk={result.overallRisk} />
                  <span className="text-sm text-muted-foreground">
                    {result.claims.length} promessa{result.claims.length === 1 ? "" : "s"} encontrada
                    {result.claims.length === 1 ? "" : "s"}
                  </span>
                  <span className="ml-auto flex flex-wrap gap-1.5">
                    {(["proibida", "exagerada", "sustentada"] as const)
                      .filter((s) => counts[s] > 0)
                      .map((s) => (
                        <StatusBadge key={s} status={s} size="sm" label={`${counts[s]}`} />
                      ))}
                  </span>
                </div>
                <div className="mt-4 rounded-lg bg-muted/40 p-4 text-sm">
                  <HighlightedScript script={result.script} claims={result.claims} />
                </div>
              </div>

              {result.claims.length === 0 ? (
                <p className="rounded-xl border bg-card p-5 text-sm text-muted-foreground">
                  Não encontramos promessas sobre o produto neste roteiro.
                </p>
              ) : (
                result.claims.map((c, i) => <ClaimCard key={`${i}-${c.text}`} claim={c} index={i} />)
              )}

              <div className="rounded-xl border-2 border-primary/50 bg-card p-5 shadow-sm">
                {!link ? (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">
                      Vai publicar? Gere um link só deste vídeo para acompanhar vendas e reembolsos.
                    </p>
                    <Button
                      id="btn-gerar-link"
                      type="button"
                      onClick={() => setLink(contentLink(creator.handle, product.slug, nextContentId))}
                    >
                      <Link2 className="size-4" /> Gerar link deste conteúdo
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold tracking-wide text-secondary uppercase">
                      Link exclusivo deste conteúdo
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <code className="min-w-0 flex-1 truncate rounded-md bg-input-background px-3 py-2 text-sm text-secondary">
                        {link}
                      </code>
                      <CopyButton text={`https://${link}`} label="Copiar link" variant="default" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Assim você vai saber exatamente quais vídeos vendem e quais geram reembolso.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
