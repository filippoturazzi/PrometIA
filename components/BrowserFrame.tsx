import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

/** Janela de navegador para as telas que simulam a plataforma (redesign pen.dev). */
export function BrowserFrame({
  url,
  children,
  className,
  id,
}: {
  url: string;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div
      id={id}
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-[0_16px_40px_rgb(20_40_74/0.08)]",
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b border-line bg-paper px-4 py-3">
        <span className="flex gap-1.5" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span key={i} className="size-2.5 rounded-full bg-[#D5DCE5]" />
          ))}
        </span>
        <span className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md border border-line bg-white px-3 py-1.5 text-[12px] text-muted-foreground">
          <Lock className="size-3 shrink-0" aria-hidden />
          <span className="truncate">{url}</span>
        </span>
        <span className="rounded-full bg-status-warn-bg px-2.5 py-1 text-[11px] font-semibold text-status-warn">
          Simulação
        </span>
      </div>
      {children}
    </div>
  );
}
