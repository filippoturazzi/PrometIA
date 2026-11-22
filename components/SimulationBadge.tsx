import { cn } from "@/lib/utils";

/** Selo exigido em telas que imitam fluxos da plataforma (seção 14). */
export function SimulationBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-status-warn/30 bg-status-warn-bg px-2.5 py-0.5 text-xs font-semibold text-status-warn",
        className,
      )}
    >
      Simulação
    </span>
  );
}
