"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Páginas que não são do PrometIA (ex.: a página de vendas fictícia): sem header, rodapé nem tour. */
export const STANDALONE_ROUTES = ["/paginavendas"];

export function isStandaloneRoute(pathname: string | null) {
  return !!pathname && STANDALONE_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}

export function HideOnStandalone({ children }: { children: ReactNode }) {
  return isStandaloneRoute(usePathname()) ? null : <>{children}</>;
}
