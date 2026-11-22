import { cn } from "@/lib/utils";

interface Datum {
  label: string;
  count: number;
}

/** Barras horizontais simples, do maior para o menor; o maior motivo fica em destaque. */
export function FrustrationChart({ data }: { data: Datum[] }) {
  // categorias sem nenhum caso saem do gráfico (ex.: entrega para um curso digital)
  const sorted = data.filter((d) => d.count > 0).sort((a, b) => b.count - a.count);
  const total = sorted.reduce((n, d) => n + d.count, 0);
  const max = sorted[0]?.count ?? 1;

  if (!sorted.length) {
    return <p className="text-[13px] text-muted-foreground">Nenhum pedido de reembolso no período.</p>;
  }

  return (
    <ul className="flex flex-col gap-[18px]">
      {sorted.map((d, i) => {
        const share = total ? Math.round((d.count / total) * 100) : 0;
        return (
          <li key={d.label} className="flex flex-col gap-2">
            <div className="flex justify-between gap-3">
              <span className={cn("text-[14px] text-ink", i === 0 && "font-semibold")}>{d.label}</span>
              <span className={cn("text-[13px] font-semibold tabular-nums", i === 0 ? "text-ink" : "text-muted-foreground")}>
                {d.count} · {share}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-[4px] bg-[#EEF1F5]" aria-hidden>
              <div
                className={cn("h-full rounded-[4px]", i === 0 ? "bg-navy" : "bg-[#9AA9BF]")}
                style={{ width: `${(d.count / max) * 100}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
