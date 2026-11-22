import type { ReactNode } from "react";
import { BatteryFull, SignalHigh, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";

/** Moldura de celular para as telas que simulam o app da plataforma (seção 10). */
export function PhoneFrame({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <div
      id={id}
      className={cn(
        "relative mx-auto w-full max-w-[380px] rounded-[2.75rem] border-[10px] border-neutral-900 bg-neutral-900 shadow-2xl",
        className,
      )}
    >
      <div className="absolute top-0 left-1/2 z-20 h-6 w-32 -translate-x-1/2 rounded-b-2xl bg-neutral-900" aria-hidden />
      <div className="flex h-[640px] flex-col overflow-hidden rounded-[2.1rem] bg-white">
        <div className="flex shrink-0 items-center justify-between px-6 pt-2 pb-1 text-xs font-semibold text-neutral-900" aria-hidden>
          <span>9:41</span>
          <span className="flex items-center gap-1">
            <SignalHigh className="size-3.5" />
            <Wifi className="size-3.5" />
            <BatteryFull className="size-4" />
          </span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
