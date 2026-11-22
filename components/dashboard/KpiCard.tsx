import type { LucideIcon } from "lucide-react";
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

interface KpiCardProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: LucideIcon;
}

/** Cartão isolado (mantido para telas ainda não migradas). */
export function KpiCard({ label, value, hint, icon: Icon }: KpiCardProps) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
        {label}
        {Icon && <Icon className="size-4 text-secondary/50" aria-hidden />}
      </div>
      <div className="mt-1 text-2xl font-bold text-secondary tabular-nums">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
