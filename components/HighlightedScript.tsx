import { STATUS_META, findClaimSpan } from "@/lib/claims-ui";
import type { ClaimStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  script: string;
  claims: { text: string; status: ClaimStatus }[];
}

/** Quebra o roteiro em frases (com a posição de cada uma no texto original). */
function sentences(script: string): { text: string; start: number; end: number }[] {
  const out: { text: string; start: number; end: number }[] = [];
  const re = /[^.!?…\n]+(?:[.!?…]+["”’]?|$)/gu;
  for (const m of script.matchAll(re)) {
    const raw = m[0];
    const lead = raw.length - raw.trimStart().length;
    const text = raw.trim();
    if (!text) continue;
    const start = (m.index ?? 0) + lead;
    out.push({ text, start, end: start + text.length });
  }
  return out;
}

/** Roteiro frase a frase; as frases com promessa recebem o número e a cor do status. */
export function HighlightedScript({ script, claims }: Props) {
  const spans = claims.map((c, i) => ({ span: findClaimSpan(script, c.text), status: c.status, n: i + 1 }));

  return (
    <ol className="flex flex-col gap-3.5">
      {sentences(script).map((s) => {
        const hit = spans.find((c) => c.span && c.span[0] < s.end && c.span[1] > s.start);
        return (
          <li key={s.start} className="flex items-start gap-3">
            {hit ? (
              <span
                className={cn(
                  "mt-px flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white",
                  STATUS_META[hit.status].solid,
                )}
                title={STATUS_META[hit.status].label}
              >
                {hit.n}
              </span>
            ) : (
              <span className="size-5 shrink-0" aria-hidden />
            )}
            <span
              className={cn(
                "flex-1 text-[14px] leading-[21px]",
                hit ? "font-medium text-ink" : "text-muted-foreground",
              )}
            >
              {s.text}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
