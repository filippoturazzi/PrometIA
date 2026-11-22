import { RISK_META, STATUS_META } from "@/lib/claims-ui";
import type { OverallRisk } from "@/lib/schemas";
import type { ClaimStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: ClaimStatus;
  /** texto alternativo ao rótulo padrão */
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

export function StatusBadge({ status, label, size = "md", className }: StatusBadgeProps) {
  const m = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-semibold whitespace-nowrap",
        m.bg,
        m.text,
        m.border,
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        className,
      )}
    >
      <span aria-hidden>{m.icon}</span>
      {label ?? m.label}
    </span>
  );
}

export function RiskBadge({ risk, className }: { risk: OverallRisk; className?: string }) {
  const m = RISK_META[risk];
  return <StatusBadge status={m.status} label={m.label} className={className} />;
}
