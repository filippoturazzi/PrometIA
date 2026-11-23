"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Ao trocar de página, volta ao topo (com o header visível).
 * O Next só rola até o começo do conteúdo novo, deixando o header fora da tela.
 */
export function ScrollToTop() {
  const pathname = usePathname();
  const previous = useRef(pathname);

  useEffect(() => {
    if (previous.current === pathname) return;
    previous.current = pathname;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
