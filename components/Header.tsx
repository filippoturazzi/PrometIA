import Link from "next/link";
import { RoleSwitcher, SubNav } from "@/components/RoleSwitcher";

export function Header() {
  return (
    <header className="sticky top-0 z-40">
      <div className="bg-secondary text-secondary-foreground">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="text-xl font-bold tracking-tight text-white">
              Promet<span className="text-primary">IA</span>
            </span>
            <span className="hidden text-xs text-white/70 sm:inline">
              O que prometia, entrega
            </span>
          </Link>
          <RoleSwitcher />
        </div>
      </div>
      <SubNav />
    </header>
  );
}
