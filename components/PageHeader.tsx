import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow?: string;
  title: ReactNode;
  /** 1 linha explicando o que a tela demonstra (seção 10) */
  subtitle: string;
  actions?: ReactNode;
}

export function PageHeader({ eyebrow, title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
      <div data-reveal="up" className="flex min-w-0 flex-1 basis-[480px] flex-col gap-2.5">
        {eyebrow && (
          <span className="text-[12px] font-semibold tracking-[1.6px] text-muted-foreground uppercase">
            {eyebrow}
          </span>
        )}
        <h1 className="text-[36px] leading-tight tracking-[-0.8px]">{title}</h1>
        <p className="text-[16px] text-muted-foreground">{subtitle}</p>
      </div>
      {actions}
    </div>
  );
}
