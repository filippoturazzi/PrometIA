import { BookOpen, Lightbulb, Sparkles } from "lucide-react";
import { CopyButton } from "@/components/CopyButton";
import { StatusBadge } from "@/components/StatusBadge";
import { CATEGORY_LABELS, STATUS_META } from "@/lib/claims-ui";
import type { ClaimCategory, ClaimStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface ClaimCardData {
  text: string;
  status: ClaimStatus;
  evidence: string;
  reason: string;
  rewrite?: string;
  category: ClaimCategory;
}

const label = "flex items-center gap-1.5 text-[11px] font-semibold tracking-[1.2px] uppercase";

/** Uma promessa analisada; pensada para ficar empilhada dentro do painel de resultado. */
export function ClaimCard({ claim, index }: { claim: ClaimCardData; index?: number }) {
  const m = STATUS_META[claim.status];
  return (
    <article className="flex flex-col gap-[18px] border-b border-line px-6 py-7 sm:px-8">
      <div className="flex flex-wrap items-center gap-3">
        {index != null && (
          <span
            className={cn(
              "flex size-6 items-center justify-center rounded-full text-[12px] font-bold text-white",
              m.solid,
            )}
          >
            {index + 1}
          </span>
        )}
        <StatusBadge status={claim.status} size="sm" />
        <span className="text-[13px] text-muted-foreground">{CATEGORY_LABELS[claim.category]}</span>
      </div>

      <p className="font-heading text-[20px] leading-[27px] font-medium text-ink">“{claim.text}”</p>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <span className={cn(label, "text-muted-foreground")}>
            <BookOpen className="size-3.5" aria-hidden /> Página do produto
          </span>
          <p className="text-[14px] leading-[22px] text-ink italic">
            {claim.evidence ? `“${claim.evidence}”` : "A página do produto não diz nada que sustente isso."}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <span className={cn(label, "text-muted-foreground")}>
            <Lightbulb className="size-3.5" aria-hidden /> Por quê
          </span>
          <p className="text-[14px] leading-[22px] text-ink">{claim.reason}</p>
        </div>
      </div>

      {claim.rewrite && (
        <div className="flex flex-col gap-2.5 rounded-[10px] border border-[#D7EFA8] bg-[#F3FBE3] px-[18px] py-4">
          <div className="flex items-center justify-between gap-2">
            <span className={cn(label, "font-bold text-[#4E7A00]")}>
              <Sparkles className="size-3.5" aria-hidden /> Versão sugerida
            </span>
            <CopyButton
              text={claim.rewrite}
              className="h-auto rounded-md border-[#D7EFA8] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-ink"
            />
          </div>
          <p className="text-[15px] leading-[23px] text-ink">{claim.rewrite}</p>
        </div>
      )}
    </article>
  );
}
