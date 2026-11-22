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

    // Sem marcar o DOM: atributos extras antes da hidratação geram aviso do React,
    // e o StrictMode monta este efeito duas vezes (cada montagem tem seu próprio conjunto).
    const seen = new WeakSet<Element>();
    const scan = () => {
      document.querySelectorAll("[data-reveal]:not(.is-revealed)").forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        io.observe(el);
      });
    };

    // começa depois da hidratação, para não alterar o DOM antes do React
    const raf = requestAnimationFrame(() => requestAnimationFrame(scan));
    // novas telas (navegação no client) e conteúdo que aparece depois
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    window.__revealReady = true;

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  return null;
}

/** Script inline: esconde os elementos antes da primeira pintura; se o JS falhar, mostra tudo. */
export const revealBootScript = `document.documentElement.classList.add('reveal-on');setTimeout(function(){if(!window.__revealReady)document.documentElement.classList.remove('reveal-on')},4000);`;
