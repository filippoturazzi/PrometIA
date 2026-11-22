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
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-1">
        {eyebrow && (
          <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium tracking-wide text-secondary uppercase">
            {eyebrow}
          </span>
        )}
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground">{subtitle}</p>
      </div>
      {actions}
    </div>
  );
}
