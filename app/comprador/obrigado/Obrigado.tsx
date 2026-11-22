"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowRight,
  Banknote,
  Briefcase,
  Check,
  Clapperboard,
  Dumbbell,
  Flame,
  GitCompare,
  Link2,
  Rocket,
  Scissors,
  Store,
  Target,
  Timer,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { BrowserFrame } from "@/components/BrowserFrame";
import { brl } from "@/lib/format";
import { EXPECTATION_KEY, setSessionValue } from "@/lib/session";
import { cn } from "@/lib/utils";

interface Props {
  product: { name: string; producer: string; price: number; chips: string[] };
  creatorHandle: string;
}

const CHIP_ICONS: Record<string, LucideIcon> = {
  "Aprender a editar": Scissors,
  "Crescer seguidores": Users,
  "Faturar rápido": Banknote,
  "Virar freelancer de edição": Briefcase,
  "Mais disposição": Zap,
  Emagrecer: Flame,
  "Resultado rápido": Rocket,
  "Treinar melhor": Dumbbell,
  "Montar minha loja": Store,
  "Largar o emprego": Briefcase,
};

const POINTS = [
  { icon: Timer, title: "Leva 2 segundos", text: "Uma pergunta, respostas prontas. Pular é sempre possível." },
  { icon: Link2, title: "Ligada ao conteúdo", text: "A resposta fica associada ao vídeo que gerou a venda." },
  { icon: GitCompare, title: "Base para o reembolso", text: "Se algo não bater, a expectativa já está registrada." },
];

export function Obrigado({ product, creatorHandle }: Props) {
  const router = useRouter();
  const [chosen, setChosen] = useState<string[]>([]);

  function toggle(chip: string) {
    setChosen((c) => (c.includes(chip) ? c.filter((x) => x !== chip) : [...c, chip]));
  }

  function go(expectation: string | null) {
    setSessionValue(EXPECTATION_KEY, expectation);
    router.push("/comprador/youclass");
    // com Cache Components a página fica guardada ao navegar; ao voltar, as opções estão livres de novo
    setChosen([]);
  }

  return (
    <div className="flex flex-col gap-12 lg:flex-row lg:gap-20">
      <div className="flex flex-col gap-7 pt-6 lg:w-[420px] lg:shrink-0">
        <span className="text-[12px] font-semibold tracking-[1.6px] text-muted-foreground uppercase">
          Comprador · Depois da venda
        </span>
        <h1 className="text-[36px] leading-10 tracking-[-0.8px]">
          A expectativa fica registrada antes de virar frustração.
        </h1>
        <p className="text-[16px] leading-[26px] text-muted-foreground">
          Logo depois da compra, na página de obrigado, o comprador diz o que espera do produto — em um toque.
        </p>
        <ul>
          {POINTS.map((p) => (
            <li key={p.title} className="flex gap-3.5 border-t border-line py-4">
              <p.icon className="mt-0.5 size-[18px] shrink-0 text-navy" aria-hidden />
              <div className="flex flex-col gap-1">
                <span className="text-[15px] font-semibold text-ink">{p.title}</span>
                <span className="text-[14px] leading-[21px] text-muted-foreground">{p.text}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <BrowserFrame url="youshop.co/obrigado" className="min-w-0 flex-1">
        <div className="flex flex-col gap-8 px-6 py-10 sm:px-12">
          <div className="flex items-center gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-status-ok-bg">
              <Check className="size-6 text-status-ok" aria-hidden />
            </span>
            <div className="flex flex-col gap-1">
              <p className="font-heading text-[26px] font-semibold tracking-[-0.4px] text-ink">Pagamento aprovado</p>
              <p className="text-[14px] text-muted-foreground">O acesso já foi liberado na sua área de membros.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-xl bg-paper px-5 py-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-[10px] bg-navy">
              <Clapperboard className="size-5 text-white" aria-hidden />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-[15px] font-semibold text-ink">{product.name}</span>
              <span className="text-[13px] text-muted-foreground">
                por {product.producer} · indicado por @{creatorHandle}
              </span>
            </div>
            <span className="font-heading text-[18px] font-semibold text-ink">{brl(product.price)}</span>
          </div>

          <div className="flex flex-col gap-5 border-t border-line pt-7">
            <div className="flex flex-col gap-1.5">
              <h2 className="text-[20px]">O que você espera conseguir com este produto?</h2>
              <p className="text-[14px] text-muted-foreground">
                Escolha uma ou mais opções. Isso ajuda o produtor a acertar o que entrega.
              </p>
            </div>

            <div id="chips-expectativa" className="grid gap-3 sm:grid-cols-2" role="group" aria-label="Expectativa">
              {product.chips.map((chip) => {
                const on = chosen.includes(chip);
                const Icon = CHIP_ICONS[chip] ?? Target;
                return (
                  <button
                    key={chip}
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    onClick={() => toggle(chip)}
                    className={cn(
                      "flex items-center gap-3 rounded-[10px] px-4 py-3.5 text-left text-[14px] text-ink transition-colors",
                      on
                        ? "bg-[#F3FBE3] font-semibold outline-[1.5px] -outline-offset-[0.75px] outline-navy outline-solid"
                        : "border border-line bg-white font-medium hover:border-navy/40",
                    )}
                  >
                    <Icon className="size-[18px] shrink-0 text-navy" aria-hidden />
                    <span className="flex-1">{chip}</span>
                    <span
                      className={cn(
                        "flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border-[1.5px]",
                        on ? "border-navy bg-navy" : "border-[#C5CEDA] bg-white",
                      )}
                      aria-hidden
                    >
                      {on && <Check className="size-3 text-white" strokeWidth={3} />}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <button
                type="button"
                onClick={() => go(null)}
                className="text-[14px] font-medium text-muted-foreground hover:text-ink"
              >
                Pular por agora
              </button>
              <button
                id="btn-enviar-expectativa"
                type="button"
                disabled={chosen.length === 0}
                onClick={() => go(chosen.join(", "))}
                className="flex items-center gap-2 rounded-lg bg-lime px-[22px] py-[13px] text-[15px] font-semibold text-navy-deep transition-colors hover:bg-lime/85 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Enviar e acessar o curso <ArrowRight className="size-4" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </BrowserFrame>
    </div>
  );
}
