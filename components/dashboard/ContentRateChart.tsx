"use client";

import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { STATUS_META } from "@/lib/claims-ui";
import { pct } from "@/lib/format";
import type { ClaimStatus } from "@/lib/types";

interface Datum {
  title: string;
  refundRate: number;
  sales: number;
  worstStatus: ClaimStatus;
}

// cores de status (reservadas para estado): o pior status das promessas do conteúdo
const FILL: Record<ClaimStatus, string> = {
  sustentada: "var(--status-ok)",
  exagerada: "var(--status-warn)",
  proibida: "var(--status-bad)",
};

const short = (s: string) => (s.length > 26 ? `${s.slice(0, 25)}…` : s);

/** Taxa de reembolso por conteúdo, barras coloridas pelo pior status da promessa (com legenda de ícone + rótulo). */
export function ContentRateChart({ data }: { data: Datum[] }) {
  const sorted = [...data].sort((a, b) => b.refundRate - a.refundRate);
  const present = (["proibida", "exagerada", "sustentada"] as const).filter((s) => sorted.some((d) => d.worstStatus === s));

  return (
    <div>
      <div
        className="w-full"
        style={{ height: Math.max(120, sorted.length * 44) }}
        role="img"
        aria-label={sorted.map((d) => `${d.title}: ${pct(d.refundRate)} de reembolso, pior promessa ${STATUS_META[d.worstStatus].label}`).join("; ")}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sorted} layout="vertical" margin={{ top: 4, right: 52, bottom: 4, left: 4 }} barCategoryGap={8}>
            <XAxis type="number" hide domain={[0, "dataMax"]} />
            <YAxis
              type="category"
              dataKey="title"
              width={190}
              tickFormatter={short}
              tick={{ fontSize: 12, fill: "var(--foreground)" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: "var(--muted)", opacity: 0.6 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as Datum;
                const m = STATUS_META[d.worstStatus];
                return (
                  <div className="max-w-64 rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
                    <div className="font-semibold text-secondary">{d.title}</div>
                    <div className="text-muted-foreground">
                      {pct(d.refundRate)} de reembolso · {d.sales} vendas
                    </div>
                    <div className="mt-1">
                      {m.icon} Pior promessa: {m.label.toLowerCase()}
                    </div>
                  </div>
                );
              }}
            />
            <Bar dataKey="refundRate" radius={[0, 4, 4, 0]} maxBarSize={22} isAnimationActive={false}>
              {sorted.map((d) => (
                <Cell key={d.title} fill={FILL[d.worstStatus]} />
              ))}
              <LabelList
                dataKey="refundRate"
                position="right"
                formatter={(v: unknown) => pct(Number(v))}
                style={{ fontSize: 12, fill: "var(--foreground)" }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground" aria-label="Legenda">
        {present.map((s) => (
          <li key={s} className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm" style={{ background: FILL[s] }} aria-hidden />
            {STATUS_META[s].icon} pior promessa {STATUS_META[s].label.toLowerCase()}
          </li>
        ))}
      </ul>
    </div>
  );
}
