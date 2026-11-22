import { Fragment } from "react";
import { STATUS_META, findClaimSpan } from "@/lib/claims-ui";
import type { ClaimStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  script: string;
  claims: { text: string; status: ClaimStatus }[];
}

/** Roteiro com cada promessa marcada na cor do seu status. */
export function HighlightedScript({ script, claims }: Props) {
  const spans = claims
    .map((c, i) => ({ span: findClaimSpan(script, c.text), status: c.status, n: i + 1 }))
    .filter((s): s is { span: [number, number]; status: ClaimStatus; n: number } => s.span !== null)
    .sort((a, b) => a.span[0] - b.span[0]);

  const parts: React.ReactNode[] = [];
  let cursor = 0;
  for (const s of spans) {
    const [start, end] = s.span;
    if (start < cursor) continue; // sobreposição: mantém a primeira marcação
    if (start > cursor) parts.push(<Fragment key={`t${cursor}`}>{script.slice(cursor, start)}</Fragment>);
    parts.push(
      <mark
        key={`m${start}`}
        className={cn("rounded px-0.5 text-foreground underline decoration-2 underline-offset-4", STATUS_META[s.status].mark)}
        title={STATUS_META[s.status].label}
      >
        {script.slice(start, end)}
        <sup className={cn("ml-0.5 font-semibold", STATUS_META[s.status].text)}>{s.n}</sup>
      </mark>,
    );
    cursor = end;
  }
  if (cursor < script.length) parts.push(<Fragment key="tail">{script.slice(cursor)}</Fragment>);

  return <p className="leading-loose whitespace-pre-wrap">{parts}</p>;
}
