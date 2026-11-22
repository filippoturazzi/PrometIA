import Link from "next/link";
import { RoleSwitcher, SubNav } from "@/components/RoleSwitcher";
import { TourButton } from "@/components/Tour";

export function Logo({ className = "text-xl" }: { className?: string }) {
  return (
    <span className={`font-heading font-bold text-white ${className}`}>
      Promet<span className="text-lime">IA</span>
    </span>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-40">
      <div className="border-b border-white/[0.08] bg-navy-deep text-white">
        <div className="mx-auto flex max-w-[1248px] flex-wrap items-center justify-between gap-3 px-6 py-[22px]">
          <Link href="/" className="flex items-center gap-3.5">
            <Logo />
            <span className="hidden h-4 w-px bg-white/20 sm:block" aria-hidden />
            <span className="hidden text-[13px] text-white/60 sm:inline">
              O que prometia, entrega
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <RoleSwitcher />
            <TourButton />
          </div>
        </div>
      </div>
      <SubNav />
    </header>
  );
}
