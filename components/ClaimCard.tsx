import { Lightbulb, Quote } from "lucide-react";
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

export function ClaimCard({ claim, index }: { claim: ClaimCardData; index?: number }) {
  const m = STATUS_META[claim.status];
  return (
    <article className={cn("rounded-xl border border-l-4 bg-card p-4 shadow-sm", m.accent)}>
      <div className={cn("flex flex-wrap items-center justify-between gap-2", m.text)}>
        <StatusBadge status={claim.status} size="sm" />
        <span className="text-xs text-muted-foreground">
          {index != null && `Promessa ${index + 1} · `}
          {CATEGORY_LABELS[claim.category]}
        </span>
      </div>

      <p className="mt-3 text-base leading-relaxed text-foreground">
        “<mark className={cn("rounded px-0.5 text-foreground", m.mark)}>{claim.text}</mark>”
      </p>

      <div className="mt-3 space-y-3 text-sm">
        <blockquote className="flex gap-2 rounded-lg bg-muted/60 p-3 text-muted-foreground">
          <Quote className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <div>
            <span className="block text-xs font-medium tracking-wide text-secondary/70 uppercase">
              Página do produto
            </span>
            {claim.evidence ? (
              <span className="italic">“{claim.evidence}”</span>
            ) : (
              <span>A página do produto não diz nada que sustente isso.</span>
            )}
          </div>
        </blockquote>

        <p>
          <span className="font-medium text-secondary">Por quê: </span>
          {claim.reason}
        </p>

        {claim.rewrite && (
          <div className="bg-highlight rounded-lg border border-primary/40 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-secondary uppercase">
                <Lightbulb className="size-3.5" aria-hidden /> Sugestão de reescrita
              </span>
              <CopyButton text={claim.rewrite} />
            </div>
            <p className="mt-2 text-foreground">{claim.rewrite}</p>
          </div>
        )}
      </div>
    </article>
  );
}
