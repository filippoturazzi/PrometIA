import { pct } from "@/lib/format";
import { cn } from "@/lib/utils";

interface RateBarProps {
  /** taxa 0–1 */
  value: number;
  /** valor que ocupa a barra inteira (escala comum a todas as linhas da tabela) */
  max: number;
  /** destaca a barra quando a taxa passa deste limite */
  alertAbove?: number;
}

/** Taxa com barra horizontal fina; o número fica sempre em texto, a barra só reforça. */
export function RateBar({ value, max, alertAbove }: RateBarProps) {
  const width = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const alert = alertAbove != null && value > alertAbove;
  return (
    <div className="flex items-center gap-2">
      <span className={cn("w-12 shrink-0 text-right tabular-nums", alert && "font-semibold text-status-bad")}>
        {pct(value)}
      </span>
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted" aria-hidden>
        <div
          className={cn("h-full rounded-full", alert ? "bg-status-bad" : "bg-secondary/70")}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}
