"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    __revealReady?: boolean;
  }
}

/**
 * Revela elementos com [data-reveal] quando entram na tela.
 * Variantes (CSS em globals.css): up, blur, pop, words, stagger.
 * Atraso opcional via style={{ "--reveal-delay": "300ms" }}.
 */
export function ScrollReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-revealed");
          io.unobserve(entry.target);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -8% 0px" },
    );

    const scan = () => {
      document
        .querySelectorAll<HTMLElement>("[data-reveal]:not([data-reveal-bound])")
        .forEach((el) => {
          el.setAttribute("data-reveal-bound", "");
          if (el.dataset.reveal === "stagger") {
            Array.from(el.children).forEach((child, i) =>
              (child as HTMLElement).style.setProperty("--i", String(i)),
            );
          }
          io.observe(el);
        });
    };

    scan();
    // novas telas (navegação no client) e conteúdo que aparece depois
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    window.__revealReady = true;

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  return null;
}

/** Script inline: esconde os elementos antes da primeira pintura; se o JS falhar, mostra tudo. */
export const revealBootScript = `document.documentElement.classList.add('reveal-on');setTimeout(function(){if(!window.__revealReady)document.documentElement.classList.remove('reveal-on')},4000);`;
