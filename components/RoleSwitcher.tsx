"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROLES } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function RoleSwitcher() {
  const pathname = usePathname();

  return (
    <nav
      id="role-switcher"
      aria-label="Trocar de perfil"
      className="flex flex-wrap items-center gap-1"
    >
      {ROLES.map((role) => {
        const active = pathname.startsWith(role.prefix);
        return (
          <Link
            key={role.id}
            href={role.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-full px-3.5 py-2 text-[14px] transition-colors",
              active
                ? "bg-lime font-semibold text-navy-deep"
                : "font-medium text-white/80 hover:bg-white/10 hover:text-white",
            )}
          >
            <role.icon className="size-4" aria-hidden />
            {role.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function SubNav() {
  const pathname = usePathname();
  const role = ROLES.find((r) => pathname.startsWith(r.prefix));
  if (!role) return null;

  return (
    <div className="border-b border-line bg-white">
      <nav
        aria-label={`Telas de ${role.label}`}
        className="mx-auto flex h-14 max-w-[1248px] items-stretch gap-2 overflow-x-auto px-6"
      >
        <div className="flex shrink-0 items-center gap-2 pr-5">
          <span className="text-[11px] font-bold tracking-[1.4px] text-muted-foreground uppercase">
            {role.area}
          </span>
          <span className="h-5 w-px bg-line" aria-hidden />
        </div>
        {role.subnav.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-2.5 border-b-[3px] px-4 pt-[3px] text-[15px] whitespace-nowrap transition-colors",
                active
                  ? "border-navy font-semibold text-ink"
                  : "border-transparent font-medium text-slate hover:text-ink",
              )}
            >
              <link.icon className="size-4" aria-hidden />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
