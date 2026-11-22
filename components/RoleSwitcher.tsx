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
      className="flex flex-wrap items-center gap-1 rounded-full bg-white/10 p-1"
    >
      {ROLES.map((role) => {
        const active = pathname.startsWith(role.prefix);
        return (
          <Link
            key={role.id}
            href={role.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-white/80 hover:bg-white/10 hover:text-white",
            )}
          >
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
  if (!role?.subnav) return null;

  return (
    <div className="border-b bg-white">
      <nav
        aria-label={`Telas de ${role.label}`}
        className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6"
      >
        {role.subnav.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
                active
                  ? "border-primary text-secondary"
                  : "border-transparent text-muted-foreground hover:text-secondary",
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
