import { AlertOctagon, Inbox, PackageCheck, Percent, TrendingUp } from "lucide-react";
import { EscalationQueue, type QueueItem } from "@/components/EscalationQueue";
import { FrustrationChart } from "@/components/dashboard/FrustrationChart";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { RateBar } from "@/components/dashboard/RateBar";
import { StatusBadge } from "@/components/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

interface PromiseHealthProps {
  filter?: DataFilter;
  audience: "operacoes" | "produtor";
  /** sufixo dos ids quando há mais de um painel na página (visão do produtor) */
  idSuffix?: string;
}

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
      relatedClaim: related?.text ?? c.feedback.classification.relatedClaim,
      relatedStatus: related?.status,
    };
  });

  const rateMax = Math.max(...[...products, ...creators].map((r) => r.refundRate), 0.01) * 1.1;

  return (
    <div className="space-y-8">
      <section aria-label="Indicadores" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Vendas que ficam"
          icon={PackageCheck}
          value={int(kpis.keptSales)}
          hint={`de ${int(kpis.sales)} vendas, sem reembolso nem chargeback`}
        />
        <KpiCard
          label="Taxa de reembolso"
          icon={Percent}
          value={pct(kpis.refundRate)}
          hint={`${plural(kpis.refunds, "reembolso")} · ${plural(kpis.chargebacks, "chargeback")}`}
        />
        <KpiCard
          label="Reembolsos por expectativa"
          icon={TrendingUp}
          value={pct(kpis.expectationShare, 0)}
          hint="o comprador esperava algo que não foi entregue"
        />
        <KpiCard
          label={audience === "operacoes" ? "Casos na fila" : "Casos precisando de você"}
          icon={Inbox}
          value={int(kpis.queueSize)}
          hint="frustração alta e produtor sem resposta ou acima de 48h"
        />
      </section>

      {cmp.ratio != null && cmp.withProhibited.sales > 0 && (
        <section className="bg-hero flex flex-wrap items-center gap-x-8 gap-y-3 rounded-xl px-6 py-5 text-white">
          <AlertOctagon className="size-8 shrink-0 text-primary" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold">
              Conteúdos com promessa proibida têm <span className="text-primary">{times(cmp.ratio)} mais reembolso</span>
            </p>
            <p className="text-sm text-white/75">
              {pct(cmp.withProhibited.refundRate)} de reembolso em {int(cmp.withProhibited.sales)} vendas, contra{" "}
              {pct(cmp.withoutProhibited.refundRate)} nos conteúdos sem promessa proibida.
            </p>
          </div>
        </section>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section aria-labelledby={id("tabela-titulo")} className="min-w-0 rounded-xl border bg-card p-5 shadow-sm">
          <h2 id={id("tabela-titulo")} className="text-lg">
            Onde o reembolso acontece
          </h2>
          <Tabs defaultValue="produto" className="mt-3">
            <TabsList>
              <TabsTrigger value="produto">Por produto</TabsTrigger>
              <TabsTrigger value="creator">Por creator</TabsTrigger>
            </TabsList>
            <TabsContent value="produto" className="mt-3">
              <HealthTable
                rows={products.map((p) => ({ key: p.product.id, name: p.product.name, sub: p.product.producer, ...p }))}
                rateMax={rateMax}
              />
            </TabsContent>
            <TabsContent value="creator" className="mt-3">
              <HealthTable
                rows={creators.map((c) => ({ key: c.creator.id, name: c.creator.name, sub: `@${c.creator.handle}`, ...c }))}
                rateMax={rateMax}
              />
            </TabsContent>
          </Tabs>
        </section>

        <section aria-labelledby={id("frustracao-titulo")} className="min-w-0 rounded-xl border bg-card p-5 shadow-sm">
          <h2 id={id("frustracao-titulo")} className="text-lg">
            Tipos de frustração
          </h2>
          <p className="text-sm text-muted-foreground">Motivo dos pedidos de reembolso, classificado pela IA</p>
          <div className="mt-3">
            <FrustrationChart data={frustration} />
          </div>
        </section>
      </div>

      <section id={id("fila-escalonamento")} aria-labelledby={id("fila-titulo")} className="space-y-3">
        <div>
          <h2 id={id("fila-titulo")} className="text-lg">
            {audience === "operacoes" ? "Fila de escalonamento" : "Casos dos seus produtos"}
          </h2>
          <p className="text-sm text-muted-foreground">
            Frustração alta e produtor sem resposta (ou que respondeu depois de 48h): casos que podem virar
            reclamação pública.
          </p>
        </div>
        <EscalationQueue cases={queue} audience={audience} />
      </section>
    </div>
  );
}

type Row = GroupAggregate & { key: string; name: string; sub: string };

function HealthTable({ rows, rateMax }: { rows: Row[]; rateMax: number }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead className="text-right">Vendas</TableHead>
          <TableHead>Taxa de reembolso</TableHead>
          <TableHead className="text-right">Expectativa</TableHead>
          <TableHead>Proibidas ativas</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[...rows]
          .sort((a, b) => b.refundRate - a.refundRate)
          .map((r) => (
            <TableRow key={r.key}>
              <TableCell>
                <span className="block font-medium text-secondary">{r.name}</span>
                <span className="block text-xs text-muted-foreground">{r.sub}</span>
              </TableCell>
              <TableCell className="text-right tabular-nums">{int(r.sales)}</TableCell>
              <TableCell>
                <RateBar value={r.refundRate} max={rateMax} alertAbove={0.15} />
              </TableCell>
              <TableCell className="text-right tabular-nums">{r.refunds ? pct(r.expectationShare, 0) : "—"}</TableCell>
              <TableCell>
                {r.activeProhibitedClaims > 0 ? (
                  <StatusBadge
                    status="proibida"
                    size="sm"
                    label={`${r.activeProhibitedClaims} em ${r.activeProhibitedContents} conteúdo${r.activeProhibitedContents > 1 ? "s" : ""}`}
                  />
                ) : (
                  <StatusBadge status="sustentada" size="sm" label="Nenhuma" />
                )}
              </TableCell>
            </TableRow>
          ))}
      </TableBody>
    </Table>
  );
}
