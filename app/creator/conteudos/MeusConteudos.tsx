"use client";

import { useState } from "react";
import { ChevronsUpDown } from "lucide-react";
import { KpiStrip } from "@/components/dashboard/KpiCard";
import { LearningBanner } from "@/components/dashboard/LearningBanner";
import { RateBar } from "@/components/dashboard/RateBar";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { STATUS_META } from "@/lib/claims-ui";
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
const ALERT_RATE = 0.15;

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const th = "text-[11px] font-semibold tracking-[1px] text-muted-foreground uppercase";

export function MeusConteudos({ views, defaultCreatorId }: { views: CreatorView[]; defaultCreatorId: string }) {
  const [creatorId, setCreatorId] = useState(defaultCreatorId);
  const v = views.find((x) => x.id === creatorId)!;
  const rateMax = Math.max(...v.contents.map((c) => c.refundRate), 0.01) * 1.1;

  return (
    <>
      <PageHeader
        eyebrow="Creator · Aprendizado"
        title="Meus conteúdos"
        subtitle="Quais vídeos vendem e quais geram reembolso — cada venda vem do link exclusivo do conteúdo."
        actions={
          <Select
            items={views.map((x) => ({ value: x.id, label: x.name }))}
            value={creatorId}
            onValueChange={(val) => val && setCreatorId(val)}
          >
            <SelectTrigger
              aria-label="Ver como creator"
              className="gap-3 rounded-[10px] border-line bg-white py-2 pr-3.5 pl-2 data-[size=default]:h-auto [&>svg:last-child]:hidden"
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-navy text-[12px] font-semibold text-white">
                {initials(v.name)}
              </span>
              <span className="flex flex-col items-start gap-px text-left">
                <span className="text-[14px] font-semibold text-ink">{v.name}</span>
                <span className="text-[12px] text-muted-foreground">@{v.handle}</span>
              </span>
              <ChevronsUpDown className="ml-1 size-4 text-muted-foreground" aria-hidden />
            </SelectTrigger>
            <SelectContent>
              {views.map((x) => (
                <SelectItem key={x.id} value={x.id}>
                  {x.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <div className="flex flex-col gap-10">
        <KpiStrip
          items={[
            { label: "Vendas", value: int(v.kpis.sales), hint: "pelos seus links de conteúdo" },
            {
              label: "Taxa de reembolso",
              value: pct(v.kpis.refundRate),
              alert: v.kpis.refundRate > ALERT_RATE,
              hint: `${plural(v.kpis.refunds, "reembolso")} · ${plural(v.kpis.chargebacks, "chargeback")}`,
            },
            { label: "Vendas que ficam", value: int(v.kpis.keptSales), hint: "sem reembolso nem chargeback" },
            {
              label: "Comissão preservada",
              value: brl(v.kpis.commissionKept),
              hint: `${brl(v.kpis.commissionLost)} perdidos em reembolsos · comissão de ${pct(v.kpis.commissionRate, 0)}`,
            },
          ]}
        />

        {v.comparison && (
          <LearningBanner
            title={`Seus conteúdos com promessa proibida têm ${times(v.comparison.ratio)} mais reembolso.`}
            rows={[
              { label: "Com promessa proibida", value: v.comparison.with, highlight: true },
              { label: "Demais conteúdos", value: v.comparison.without },
            ]}
          />
        )}

        <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section
            aria-labelledby="tabela-conteudos"
            className="min-w-0 overflow-hidden rounded-[14px] border border-line bg-white"
          >
            <div className="flex flex-col gap-1 px-7 py-6">
              <h2 id="tabela-conteudos" className="text-[20px]">
                Seus conteúdos
              </h2>
              <p className="text-[13px] text-muted-foreground">Ordenado pela taxa de reembolso</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse">
                <thead>
                  <tr className="border-y border-line bg-paper text-left">
                    <th className={`${th} py-2.5 pl-7`}>Conteúdo</th>
                    <th className={`${th} w-16 px-2.5 text-right`}>Vendas</th>
                    <th className={`${th} w-16 px-2.5 text-right`}>Reemb.</th>
                    <th className={`${th} w-[190px] px-2.5`}>Taxa de reembolso</th>
                    <th className={`${th} w-[270px] pr-7 pl-2.5`}>Promessa de maior risco</th>
                  </tr>
                </thead>
                <tbody>
                  {[...v.contents]
                    .sort((a, b) => b.refundRate - a.refundRate)
                    .map((c) => (
                      <tr key={c.id} className="border-b border-line last:border-b-0">
                        <td className="py-5 pl-7 align-middle">
                          <span className="block text-[14px] font-semibold text-ink">{c.title}</span>
                          <span className="mt-1 block text-[12px] text-muted-foreground">
                            {CHANNEL[c.channel] ?? c.channel} · {c.productName}
                          </span>
                        </td>
                        <td className="px-2.5 text-right text-[14px] text-ink tabular-nums">{int(c.sales)}</td>
                        <td className="px-2.5 text-right text-[14px] text-ink tabular-nums">{int(c.refunds)}</td>
                        <td className="px-2.5">
                          <RateBar
                            value={c.refundRate}
                            max={rateMax}
                            alertAbove={ALERT_RATE}
                            barClassName={STATUS_META[c.worstStatus].solid}
                          />
                        </td>
                        <td className="py-5 pr-7 pl-2.5">
                          {c.riskiestClaim ? (
                            <div className="flex flex-col items-start gap-1.5">
                              <StatusBadge
                                status={c.riskiestClaim.status}
                                size="sm"
                                className="gap-[5px] px-[9px] py-[3px] text-[11px]"
                              />
                              <span
                                className="line-clamp-2 text-[12px] leading-[17px] text-muted-foreground italic"
                                title={c.riskiestClaim.text}
                              >
                                “{c.riskiestClaim.text}”
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>

          <InsightCard key={v.id} creatorId={v.id} />
        </div>
      </div>
    </>
  );
}
