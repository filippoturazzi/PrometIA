import { EscalationQueue, type QueueItem } from "@/components/EscalationQueue";
import { FrustrationChart } from "@/components/dashboard/FrustrationChart";
import { KpiStrip } from "@/components/dashboard/KpiCard";
import { LearningBanner } from "@/components/dashboard/LearningBanner";
import { RateBar } from "@/components/dashboard/RateBar";
import { StatusBadge } from "@/components/StatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { matchClaim } from "@/lib/claims-ui";
import {
  aggregateByCreator,
  aggregateByProduct,
  frustrationBreakdown,
  getEscalationQueue,
  opsKpis,
  prohibitedComparison,
  type DataFilter,
  type GroupAggregate,
} from "@/lib/data";
import { int, plural, pct, times } from "@/lib/format";
import { cn } from "@/lib/utils";

interface PromiseHealthProps {
  filter?: DataFilter;
  audience: "operacoes" | "produtor";
  /** sufixo dos ids quando há mais de um painel na página (visão do produtor) */
  idSuffix?: string;
}

const panel = "min-w-0 overflow-hidden rounded-[14px] border border-line bg-white";

/** Painel M4 (seção 10): o mesmo componente serve Operações (geral) e o Produtor (filtrado). */
export function PromiseHealth({ filter = {}, audience, idSuffix = "" }: PromiseHealthProps) {
  const id = (base: string) => `${base}${idSuffix}`;
  const kpis = opsKpis(filter);
  const products = aggregateByProduct(filter);
  const creators = aggregateByCreator(filter);
  const cmp = prohibitedComparison(filter);
  const frustration = frustrationBreakdown(filter).map((f) => ({ label: f.label, count: f.count }));

  const queue: QueueItem[] = getEscalationQueue(filter).map((c) => {
    const related = c.feedback.classification.relatedClaim
      ? matchClaim(c.content.claims, c.feedback.classification.relatedClaim)
      : undefined;
    return {
      feedbackId: c.feedback.id,
      buyer: c.buyer,
      productName: c.product.name,
      creatorName: c.creator.name,
      contentTitle: c.content.title,
      hours: c.hoursWithoutResponse,
      responded: c.producerResponded,
      severity: c.feedback.classification.severity,
      type: c.feedback.classification.type,
      text: c.feedback.text,
      expectation: c.sale.expectation,
      relatedClaim: related?.text ?? c.feedback.classification.relatedClaim,
      relatedStatus: related?.status,
    };
  });

  const rateMax = Math.max(...[...products, ...creators].map((r) => r.refundRate), 0.01) * 1.1;

  return (
    <div className="flex flex-col gap-10">
      <KpiStrip
        items={[
          {
            label: "Vendas que ficam",
            value: int(kpis.keptSales),
            hint: `de ${int(kpis.sales)} vendas, sem reembolso nem chargeback`,
          },
          {
            label: "Taxa de reembolso",
            value: pct(kpis.refundRate),
            hint: `${plural(kpis.refunds, "reembolso")} · ${plural(kpis.chargebacks, "chargeback")}`,
          },
          {
            label: "Reembolsos por expectativa",
            value: pct(kpis.expectationShare, 0),
            hint: "o comprador esperava algo que não foi entregue",
          },
          {
            label: audience === "operacoes" ? "Casos na fila" : "Casos precisando de você",
            value: int(kpis.queueSize),
            alert: kpis.queueSize > 0,
            hint: "frustração alta e produtor sem resposta há +48h",
          },
        ]}
      />

      {cmp.ratio != null && cmp.withProhibited.sales > 0 && (
        <LearningBanner
          title={`Conteúdos com promessa proibida têm ${times(cmp.ratio)} mais reembolso.`}
          rows={[
            {
              label: `Com promessa proibida · ${int(cmp.withProhibited.sales)} vendas`,
              value: cmp.withProhibited.refundRate,
              highlight: true,
            },
            { label: "Sem promessa proibida", value: cmp.withoutProhibited.refundRate },
          ]}
        />
      )}

      <section id={id("fila-escalonamento")} aria-label="Fila de escalonamento" className={panel}>
        <EscalationQueue
          cases={queue}
          audience={audience}
          title={audience === "operacoes" ? "Fila de escalonamento" : "Casos dos seus produtos"}
          subtitle="Frustração alta e produtor sem resposta (ou que respondeu depois de 48h): casos que podem virar reclamação pública."
        />
      </section>

      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Tabs defaultValue="produto" className={cn(panel, "gap-0")}>
          <section aria-labelledby={id("tabela-titulo")}>
            <div className="flex flex-wrap items-center justify-between gap-4 px-7 py-6">
              <div className="flex flex-col gap-1">
                <h2 id={id("tabela-titulo")} className="text-[20px]">
                  Onde o reembolso acontece
                </h2>
                <p className="text-[13px] text-muted-foreground">Ordenado pela taxa de reembolso</p>
              </div>
              <TabsList className="h-auto rounded-lg bg-[#EEF1F5] p-[3px]">
                {[
                  ["produto", "Por produto"],
                  ["creator", "Por creator"],
                ].map(([v, l]) => (
                  <TabsTrigger
                    key={v}
                    value={v}
                    className="h-auto rounded-md px-3 py-1.5 text-[13px] font-medium text-muted-foreground data-active:font-semibold data-active:text-ink data-active:shadow-[0_1px_2px_rgb(20_40_74/0.1)]"
                  >
                    {l}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            <TabsContent value="produto">
              <HealthTable
                firstColumn="Produto"
                rows={products.map((p) => ({ key: p.product.id, name: p.product.name, sub: p.product.producer, ...p }))}
                rateMax={rateMax}
              />
            </TabsContent>
            <TabsContent value="creator">
              <HealthTable
                firstColumn="Creator"
                rows={creators.map((c) => ({ key: c.creator.id, name: c.creator.name, sub: `@${c.creator.handle}`, ...c }))}
                rateMax={rateMax}
              />
            </TabsContent>
          </section>
        </Tabs>

        <section aria-labelledby={id("frustracao-titulo")} className={cn(panel, "flex flex-col gap-6 p-7")}>
          <div className="flex flex-col gap-1">
            <h2 id={id("frustracao-titulo")} className="text-[20px]">
              Tipos de frustração
            </h2>
            <p className="text-[13px] text-muted-foreground">
              Motivo dos {plural(kpis.refunds, "pedido")} de reembolso, classificado pela IA
            </p>
          </div>
          <FrustrationChart data={frustration} />
        </section>
      </div>
    </div>
  );
}

type Row = GroupAggregate & { key: string; name: string; sub: string };

const th = "py-2.5 text-left text-[11px] font-semibold tracking-[1px] text-muted-foreground uppercase";

function HealthTable({ rows, rateMax, firstColumn }: { rows: Row[]; rateMax: number; firstColumn: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse">
        <thead>
          <tr className="border-y border-line bg-paper">
            <th className={cn(th, "pl-7")}>{firstColumn}</th>
            <th className={cn(th, "w-[70px] px-2.5 text-right")}>Vendas</th>
            <th className={cn(th, "w-[170px] px-2.5")}>Taxa de reembolso</th>
            <th className={cn(th, "w-[94px] px-2.5 text-right")}>Expectat.</th>
            <th className={cn(th, "w-[170px] pr-7 pl-2.5")}>Proibidas ativas</th>
          </tr>
        </thead>
        <tbody>
          {[...rows]
            .sort((a, b) => b.refundRate - a.refundRate)
            .map((r) => (
              <tr key={r.key} className="border-b border-line text-[14px] text-ink last:border-b-0">
                <td className="py-[18px] pl-7">
                  <span className="block font-semibold">{r.name}</span>
                  <span className="mt-0.5 block text-[12px] text-muted-foreground">{r.sub}</span>
                </td>
                <td className="px-2.5 text-right tabular-nums">{int(r.sales)}</td>
                <td className="px-2.5">
                  <RateBar value={r.refundRate} max={rateMax} alertAbove={0.15} />
                </td>
                <td className="px-2.5 text-right tabular-nums">{r.refunds ? pct(r.expectationShare, 0) : "—"}</td>
                <td className="pr-7 pl-2.5">
                  {r.activeProhibitedClaims > 0 ? (
                    <StatusBadge
                      status="proibida"
                      size="sm"
                      className="px-[9px] py-[3px]"
                      label={`${r.activeProhibitedClaims} em ${r.activeProhibitedContents} conteúdo${r.activeProhibitedContents > 1 ? "s" : ""}`}
                    />
                  ) : (
                    <StatusBadge status="sustentada" size="sm" className="px-[9px] py-[3px]" label="Nenhuma" />
                  )}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
