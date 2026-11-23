"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { driver, type Driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";

// Tour de boas-vindas (seção 15 do SPEC).

export const TOUR_EVENT = "prometia:tour";
const TOUR_DONE_KEY = "prometia_tour_done";

interface TourStep {
  route: string;
  /** seletor do elemento destacado; sem seletor = modal central */
  selector?: string;
  title: string;
  description: string;
  side?: "top" | "right" | "bottom" | "left";
  /** onde o elemento deve ficar na tela antes de destacar (abre espaço para o balão) */
  scrollBlock?: ScrollLogicalPosition;
}

const STEPS: TourStep[] = [
  {
    route: "/",
    title: "Seja bem-vindo ao PrometIA 👋",
    description:
      "Este é o meu projeto para o Desafio de Inovação do Programa de Estágio YouShop 2027. Em 2 minutos eu te mostro como ele funciona.<br><br><em>— Filippo</em>",
  },
  {
    route: "/",
    selector: "#problema",
    side: "bottom",
    title: "O problema",
    description:
      "O que é prometido na divulgação e o que o comprador recebe nunca são conferidos. A diferença só aparece no fim, como reembolso, chargeback ou reclamação pública.",
  },
  {
    route: "/",
    // só os 3 passos, rolados para o fim da tela, com o balão no espaço livre acima
    selector: "#solucao-passos",
    side: "top",
    scrollBlock: "end",
    title: "A solução",
    description:
      "Um ciclo em 3 passos: checar a promessa antes de postar, ouvir o comprador depois da venda e transformar isso em aprendizado.",
  },
  {
    route: "/",
    selector: "#role-switcher",
    side: "bottom",
    title: "Troque de perspectiva aqui",
    description: "Creator, Comprador, Produtor e Operações YouShop. Cada um vê o mesmo problema de um ângulo.",
  },
  {
    route: "/creator/checador",
    selector: "#checador-entrada",
    side: "right",
    title: "Comece pelo creator",
    description:
      "Use o <strong>roteiro de exemplo</strong> e clique em <strong>Checar promessas</strong> para ver a IA classificar cada promessa.",
  },
  {
    route: "/comprador/reembolso",
    selector: "#phone-frame",
    side: "right",
    // o celular é mais alto que a tela: mostra o começo dele, logo abaixo do header
    scrollBlock: "start",
    title: "Depois, o comprador",
    description:
      "Simulação do pedido de reembolso: a IA entende o motivo e liga ao conteúdo que gerou a venda. O reembolso nunca é escondido.",
  },
  {
    route: "/operacoes",
    selector: "#fila-escalonamento",
    side: "top",
    title: "E a YouShop enxerga antes",
    description:
      "Casos com frustração alta e produtor sem resposta aparecem aqui antes de virarem reclamação pública.",
  },
  {
    route: "/operacoes",
    selector: "#btn-tour",
    side: "bottom",
    title: "Pronto!",
    description: "Explore livremente. Você pode rever este tour pelo “?”. Todos os dados são fictícios.",
  },
];

/** Trava a rolagem do usuário durante o tour (o driver ainda rola via script). */
function lockScroll(locked: boolean) {
  document.documentElement.classList.toggle("tour-scroll-lock", locked);
}

function markDone() {
  try {
    localStorage.setItem(TOUR_DONE_KEY, "1");
  } catch {
    // sem armazenamento: o tour pode reaparecer na próxima visita, sem problema
  }
}

function alreadyDone() {
  try {
    return localStorage.getItem(TOUR_DONE_KEY) === "1";
  } catch {
    return false; // se falhar, simplesmente mostra o tour
  }
}

/** Elemento visível (com Cache Components, páginas anteriores ficam no DOM, só escondidas). */
function findVisible(selector: string): Element | null {
  for (const el of document.querySelectorAll(selector)) {
    if (el.getClientRects().length > 0) return el;
  }
  return null;
}

function waitForVisible(selector: string, timeoutMs = 6000): Promise<Element | null> {
  return new Promise((resolve) => {
    const start = Date.now();
    const tick = () => {
      const el = findVisible(selector);
      if (el) return resolve(el);
      if (Date.now() - start > timeoutMs) return resolve(null);
      setTimeout(tick, 100);
    };
    tick();
  });
}

export function Tour() {
  const router = useRouter();
  const driverRef = useRef<Driver | null>(null);

  useEffect(() => {
    // vai para a rota do passo, espera o elemento aparecer e então destaca
    async function goTo(index: number) {
      const d = driverRef.current;
      if (!d) return;
      const step = STEPS[index];
      if (!step) return d.destroy();
      if (window.location.pathname !== step.route) {
        router.push(step.route);
      }
      const el = step.selector ? await waitForVisible(step.selector) : null;
      // o driver só rola se o elemento estiver fora da tela; aqui forçamos a posição
      if (el && step.scrollBlock) el.scrollIntoView({ block: step.scrollBlock, behavior: "instant" });
      // um quadro para o layout assentar antes de medir
      requestAnimationFrame(() => d.moveTo(index));
    }

    function start() {
      driverRef.current?.destroy();
      const steps: DriveStep[] = STEPS.map((s) => ({
        element: s.selector ? () => findVisible(s.selector!) ?? document.body : undefined,
        popover: { title: s.title, description: s.description, side: s.side, align: "start" },
      }));

      const d = driver({
        steps,
        showProgress: false,
        nextBtnText: "Próximo →",
        prevBtnText: "← Voltar",
        doneBtnText: "Concluir ✓",
        closeBtnLabel: "Fechar o tour",
        popoverClass: "prometia-tour",
        overlayColor: "#0B1628",
        overlayOpacity: 0.55,
        stagePadding: 6,
        stageRadius: 12,
        allowClose: true,
        smoothScroll: true,
        onNextClick: (_el, _step, { index }) => {
          const next = (index ?? 0) + 1;
          if (next >= STEPS.length) return d.destroy();
          void goTo(next);
        },
        onPrevClick: (_el, _step, { index }) => void goTo(Math.max(0, (index ?? 0) - 1)),
        onPopoverRender: (popover, { index }) => {
          const i = index ?? 0;
          const total = STEPS.length;

          // barra de progresso no topo e "Passo X de N" acima do título
          const bar = document.createElement("div");
          bar.className = "prometia-tour-bar";
          bar.style.setProperty("--progress", `${((i + 1) / total) * 100}%`);
          popover.wrapper.prepend(bar);
          const label = document.createElement("span");
          label.className = "prometia-tour-step";
          label.textContent = `Passo ${i + 1} de ${total}`;
          popover.title.before(label);

          if (i === 0) {
            popover.previousButton.style.display = "none";
            popover.nextButton.textContent = "Começar tour →";
          }

          // "Pular tour" à esquerda do rodapé (não aparece no último passo)
          if (i === total - 1) return;
          const skip = document.createElement("button");
          skip.type = "button";
          skip.textContent = "Pular tour";
          skip.className = "prometia-tour-skip";
          skip.addEventListener("click", () => d.destroy());
          popover.footer.prepend(skip);
        },
        onDestroyed: () => {
          lockScroll(false);
          markDone();
          driverRef.current = null;
        },
      });
      driverRef.current = d;
      lockScroll(true);

      if (window.location.pathname !== STEPS[0].route) router.push(STEPS[0].route);
      // dá tempo para a landing aparecer (ou para a hidratação terminar)
      setTimeout(() => d.drive(0), 400);
    }

    const onRequest = () => start();
    window.addEventListener(TOUR_EVENT, onRequest);
    if (!alreadyDone()) start();

    return () => {
      window.removeEventListener(TOUR_EVENT, onRequest);
    };
  }, [router]);

  // ao desmontar de vez, fecha o tour
  useEffect(
    () => () => {
      driverRef.current?.destroy();
      lockScroll(false);
    },
    [],
  );

  return null;
}

/** Botão "?" do header: reabre o tour. */
export function TourButton() {
  return (
    <button
      id="btn-tour"
      type="button"
      aria-label="Rever o tour de boas-vindas"
      title="Rever o tour"
      onClick={() => window.dispatchEvent(new Event(TOUR_EVENT))}
      className="ml-1 flex size-[34px] items-center justify-center rounded-full border border-white/25 text-sm text-white transition-colors hover:bg-white/10"
    >
      ?
    </button>
  );
}
