import { PageHeader } from "@/components/PageHeader";

interface ComingSoonProps {
  eyebrow: string;
  title: string;
  subtitle: string;
}

/** Placeholder temporário enquanto a tela não é implementada. */
export function ComingSoon(props: ComingSoonProps) {
  return (
    <>
      <PageHeader {...props} />
      <div className="rounded-xl border border-dashed bg-muted/40 p-10 text-center text-muted-foreground">
        Em construção.
      </div>
    </>
  );
}
