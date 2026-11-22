import type { ReactNode } from "react";

/** Corpo das telas internas: fundo "paper" e coluna de 1200px (redesign pen.dev). */
export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex-1 bg-paper">
      <div className="mx-auto w-full max-w-[1248px] px-6 pt-14 pb-24">{children}</div>
    </div>
  );
}
