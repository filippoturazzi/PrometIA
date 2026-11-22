import { TriangleAlert } from "lucide-react";
import { pct } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Row {
  label: string;
  /** taxa 0–1 */
  value: number;
  /** linha em destaque (vermelho) */
  highlight?: boolean;
}

/** Faixa escura "Principal aprendizado" com a comparação em barras. */
export function LearningBanner({ title, rows }: { title: string; rows: Row[] }) {
  const max = Math.max(...rows.map((r) => r.value), 0.0001) * 1.1;
  return (
    <section className="flex flex-col gap-6 rounded-[14px] bg-navy-deep px-9 py-7 lg:flex-row lg:items-center lg:gap-12">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="flex items-center gap-2 text-[11px] font-semibold tracking-[1.4px] text-lime uppercase">
          <TriangleAlert className="size-3.5" aria-hidden /> Principal aprendizado
        </span>
        <p className="font-heading text-[24px] leading-[30px] font-semibold text-white">{title}</p>
      </div>
      <dl className="flex w-full flex-col gap-3.5 lg:w-[440px]">
        {rows.map((r) => (
          <div key={r.label} className="flex flex-col gap-1.5">
            <div className="flex justify-between gap-3 text-[13px]">
              <dt className="text-white/70">{r.label}</dt>
              <dd className="font-semibold text-white tabular-nums">{pct(r.value)}</dd>
            </div>
            <div className="h-2 overflow-hidden rounded-[4px] bg-white/[0.08]" aria-hidden>
              <div
                className={cn("h-full rounded-[4px]", r.highlight ? "bg-[#FF6B6B]" : "bg-white/40")}
                style={{ width: `${(r.value / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </dl>
    </section>
  );
}
