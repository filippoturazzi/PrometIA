import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface KpiItem {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  /** destaca o número em vermelho */
  alert?: boolean;
}

/** Faixa única de indicadores separados por divisórias (redesign pen.dev). */
export function KpiStrip({ items, className }: { items: KpiItem[]; className?: string }) {
  return (
    <section
      aria-label="Indicadores"
      data-reveal="stagger"
      className={cn(
        "grid gap-y-6 rounded-[14px] border border-line bg-white py-7 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-line",
        className,
      )}
    >
      {items.map((k) => (
        <div
          key={k.label}
          className="flex flex-col gap-2 px-8"
        >
          <span className="text-[13px] font-medium text-muted-foreground">{k.label}</span>
          <span
            className={cn(
              "font-heading text-[34px] leading-none font-semibold tracking-[-0.8px] tabular-nums",
              k.alert ? "text-status-bad" : "text-ink",
            )}
          >
            {k.value}
          </span>
          {k.hint && <span className="text-[13px] leading-[19px] text-muted-foreground">{k.hint}</span>}
        </div>
      ))}
    </section>
  );
}
