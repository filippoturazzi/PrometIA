"use client";

import { useState } from "react";
import { AlertOctagon, HandCoins, PackageCheck, Percent, ShoppingBag } from "lucide-react";
import { ContentRateChart } from "@/components/dashboard/ContentRateChart";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { RateBar } from "@/components/dashboard/RateBar";
import { StatusBadge } from "@/components/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { brl, int, plural, pct, times } from "@/lib/format";
import type { ClaimStatus } from "@/lib/types";
import { InsightCard } from "./InsightCard";

export interface CreatorView {
  id: string;
  name: string;
  handle: string;
  kpis: {
    sales: number;
    refunds: number;
    chargebacks: number;
    refundRate: number;
    keptSales: number;
    commissionRate: number;
    commissionKept: number;
    commissionLost: number;
  };
  comparison: { with: number; without: number; ratio: number } | null;
  contents: {
    id: string;
    title: string;
    channel: string;
    productName: string;
    sales: number;
    refunds: number;
    refundRate: number;
    worstStatus: ClaimStatus;
    riskiestClaim: { text: string; status: ClaimStatus } | null;
  }[];
}

const CHANNEL: Record<string, string> = { tiktok: "TikTok", instagram: "Instagram", youtube: "YouTube" };

export function MeusConteudos({ views, defaultCreatorId }: { views: CreatorView[]; defaultCreatorId: string }) {
  const [creatorId, setCreatorId] = useState(defaultCreatorId);
  const v = views.find((x) => x.id === creatorId)!;
  const rateMax = Math.max(...v.contents.map((c) => c.refundRate), 0.01) * 1.1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        Você está como
        <Select
          items={views.map((x) => ({ value: x.id, label: x.name }))}
          value={creatorId}
          onValueChange={(val) => val && setCreatorId(val)}
        >
          <SelectTrigger className="w-52 bg-input-background" aria-label="Creator">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {views.map((x) => (
              <SelectItem key={x.id} value={x.id}>
                {x.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span>@{v.handle}</span>
      </div>

      <section aria-label="Indicadores" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Vendas" icon={ShoppingBag} value={int(v.kpis.sales)} hint="pelos seus links de conteúdo" />
        <KpiCard
          label="Taxa de reembolso"
          icon={Percent}
          value={pct(v.kpis.refundRate)}
          hint={`${plural(v.kpis.refunds, "reembolso")} · ${plural(v.kpis.chargebacks, "chargeback")}`}
        />
        <KpiCard label="Vendas que ficam" icon={PackageCheck} value={int(v.kpis.keptSales)} hint="sem reembolso nem chargeback" />
        <KpiCard
          label="Comissão preservada"
          icon={HandCoins}
          value={brl(v.kpis.commissionKept)}
          hint={
            <>
              <span className="font-medium text-status-bad">{brl(v.kpis.commissionLost)} perdidos</span> em reembolsos ·
              comissão de {pct(v.kpis.commissionRate, 0)}
            </>
          }
        />
      </section>

      {v.comparison && (
        <section className="bg-hero flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl px-6 py-5 text-white">
          <AlertOctagon className="size-8 shrink-0 text-primary" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold">
              Seus conteúdos com promessa proibida têm{" "}
              <span className="text-primary">{times(v.comparison.ratio)} mais reembolso</span>
            </p>
            <p className="text-sm text-white/75">
              {pct(v.comparison.with)} de reembolso, contra {pct(v.comparison.without)} nos seus outros conteúdos.
            </p>
          </div>
        </section>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="min-w-0 space-y-6">
          <section aria-labelledby="tabela-conteudos" className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 id="tabela-conteudos" className="text-lg">
              Seus conteúdos
            </h2>
            <Table className="mt-2">
              <TableHeader>
                <TableRow>
                  <TableHead>Conteúdo</TableHead>
                  <TableHead className="text-right">Vendas</TableHead>
                  <TableHead className="text-right">Reemb.</TableHead>
                  <TableHead>Taxa</TableHead>
                  <TableHead>Promessa de maior risco</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...v.contents]
                  .sort((a, b) => b.refundRate - a.refundRate)
                  .map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="min-w-40 whitespace-normal">
                        <span className="block font-medium text-secondary">{c.title}</span>
                        <span className="block text-xs text-muted-foreground">
                          {CHANNEL[c.channel] ?? c.channel} · {c.productName}
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{int(c.sales)}</TableCell>
                      <TableCell className="text-right tabular-nums">{int(c.refunds)}</TableCell>
                      <TableCell>
                        <RateBar value={c.refundRate} max={rateMax} alertAbove={0.15} />
                      </TableCell>
                      <TableCell className="min-w-44 whitespace-normal">
                        {c.riskiestClaim ? (
                          <div className="space-y-1">
                            <StatusBadge status={c.riskiestClaim.status} size="sm" />
                            <span className="line-clamp-2 text-xs text-muted-foreground" title={c.riskiestClaim.text}>
                              “{c.riskiestClaim.text}”
                            </span>
                          </div>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </section>

          <section aria-labelledby="grafico-conteudos" className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 id="grafico-conteudos" className="text-lg">
              Taxa de reembolso por conteúdo
            </h2>
            <p className="text-sm text-muted-foreground">Cor da barra = pior promessa do conteúdo</p>
            <div className="mt-3">
              <ContentRateChart data={v.contents} />
            </div>
          </section>
        </div>

        <InsightCard key={v.id} creatorId={v.id} creatorName={v.name} />
      </div>
    </div>
  );
}
