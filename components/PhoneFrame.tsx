import type { ReactNode } from "react";
import { BatteryFull, SignalHigh, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";

/** Moldura de celular para as telas que simulam o app da plataforma (seção 10). */
export function PhoneFrame({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <div
      id={id}
      className={cn(
        "relative mx-auto w-full max-w-[380px] rounded-[44px] border-[8px] border-ink bg-ink shadow-[0_20px_48px_rgb(20_40_74/0.18)]",
        className,
      )}
    >
      <div className="flex h-[660px] flex-col overflow-hidden rounded-[36px] bg-white">
        <div
          className="flex shrink-0 items-center justify-between px-7 pt-4 pb-1 text-[13px] font-semibold text-ink"
          aria-hidden
        >
          <span>9:41</span>
          <span className="flex items-center gap-1">
            <SignalHigh className="size-3.5" />
            <Wifi className="size-3.5" />
            <BatteryFull className="size-4" />
          </span>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
