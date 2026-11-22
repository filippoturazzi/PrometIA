import { pct } from "@/lib/format";
import { cn } from "@/lib/utils";

interface RateBarProps {
  /** taxa 0–1 */
  value: number;
  /** valor que ocupa a barra inteira (escala comum a todas as linhas da tabela) */
  max: number;
  /** destaca o número em vermelho quando a taxa passa deste limite */
  alertAbove?: number;
  /** classe de cor da barra (padrão: azul-marinho) */
  barClassName?: string;
  className?: string;
}

/** Taxa com barra horizontal fina; o número fica sempre em texto, a barra só reforça. */
export function RateBar({ value, max, alertAbove, barClassName = "bg-navy", className }: RateBarProps) {
  const width = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const alert = alertAbove != null && value > alertAbove;
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span
        className={cn("w-12 shrink-0 text-[14px] font-semibold tabular-nums", alert ? "text-status-bad" : "text-ink")}
      >
        {pct(value)}
      </span>
      <div className="h-1.5 min-w-10 flex-1 overflow-hidden rounded-[3px] bg-[#EEF1F5]" aria-hidden>
        <div className={cn("h-full rounded-[3px]", barClassName)} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}
