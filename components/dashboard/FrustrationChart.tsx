"use client";

import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface Datum {
  label: string;
  count: number;
}

/** Barras horizontais, série única (sem legenda: o título nomeia a série), ordenadas do maior para o menor. */
export function FrustrationChart({ data }: { data: Datum[] }) {
  // categorias sem nenhum caso saem do gráfico (ex.: entrega para um curso digital)
  const sorted = data.filter((d) => d.count > 0).sort((a, b) => b.count - a.count);
  const total = sorted.reduce((n, d) => n + d.count, 0);

  return (
    <div className="w-full" style={{ height: Math.max(120, sorted.length * 40) }} role="img" aria-label={sorted.map((d) => `${d.label}: ${d.count}`).join("; ")}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sorted} layout="vertical" margin={{ top: 4, right: 36, bottom: 4, left: 4 }} barCategoryGap={6}>
          {/* os valores vão na ponta de cada barra; eixo X e grade seriam redundantes */}
          <XAxis type="number" hide domain={[0, "dataMax"]} />
          <YAxis
            type="category"
            dataKey="label"
            width={160}
            tick={{ fontSize: 12, fill: "var(--foreground)" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.6 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as Datum;
              return (
                <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
                  <div className="font-semibold text-secondary">{d.label}</div>
                  <div className="text-muted-foreground">
                    {d.count} reembolso{d.count === 1 ? "" : "s"} · {total ? Math.round((d.count / total) * 100) : 0}% do total
                  </div>
                </div>
              );
            }}
          />
          <Bar dataKey="count" fill="var(--chart-1)" radius={[0, 4, 4, 0]} maxBarSize={22} isAnimationActive={false}>
            <LabelList dataKey="count" position="right" style={{ fontSize: 12, fill: "var(--foreground)" }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
