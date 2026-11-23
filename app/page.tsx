import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  Building2,
  Clapperboard,
  Megaphone,
  MessageSquareText,
  PackageOpen,
  ShieldCheck,
  ShoppingBag,
  Store,
  TrendingUp,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RevealWords } from "@/components/RevealWords";

const STEPS = [
  {
    icon: ShieldCheck,
    title: "Antes de postar",
    text: "O creator passa o roteiro pelo checador: a IA extrai cada promessa, confere com a página do produto e sugere uma reescrita verdadeira.",
  },
  {
    icon: MessageSquareText,
    title: "Depois da venda",
    text: "O comprador conta o que esperava. Check-in e pedido de reembolso são classificados e ligados ao conteúdo que gerou a venda.",
  },
  {
    icon: TrendingUp,
    title: "Aprendizado",
    text: "Painéis mostram quais conteúdos e promessas geram reembolso, e uma fila revela os casos antes de virarem reclamação pública.",
  },
];

const PROFILES = [
  {
    href: "/creator/checador",
    icon: Clapperboard,
    label: "Creator",
    text: "Checar um roteiro e ver o que gera reembolso",
    stage: "Antes de postar",
  },
  {
    href: "/comprador/obrigado",
    icon: ShoppingBag,
    label: "Comprador",
    text: "Declarar expectativa e pedir reembolso",
    stage: "Depois da venda",
  },
  {
    href: "/produtor",
    icon: Store,
    label: "Produtor",
    text: "Saúde da promessa dos seus produtos",
    stage: "Aprendizado",
  },
  {
    href: "/operacoes",
    icon: Building2,
    label: "Operações YouShop",
    text: "Painel geral e fila de escalonamento",
    stage: "Aprendizado",
  },
];

const container = "mx-auto w-full max-w-[1248px] px-6";

export default function Home() {
  return (
    <>
      <section id="problema" className="bg-navy-deep text-white">
        <div
          className={cn(
            container,
            "flex flex-col gap-12 py-16 lg:flex-row lg:items-center lg:gap-20 lg:pt-24 lg:pb-28",
          )}
        >
          <div className="flex flex-1 flex-col items-start gap-7">
            <span data-reveal="up" className="text-[12px] font-semibold tracking-[1.6px] text-lime uppercase">
              Um conceito para o ecossistema YouShop
            </span>
            <h1
              data-reveal="words"
              className="text-[38px] leading-[1.08] tracking-[-1.2px] text-white sm:text-[54px]"
            >
              <RevealWords
                parts={[
                  "O que foi ",
                  { text: "prometido", className: "text-lime" },
                  " na divulgação quase nunca é ",
                  { text: "conferido", className: "text-lime" },
                  " com o que o comprador recebe.",
                ]}
              />
            </h1>
            <p data-reveal="up" style={{ "--reveal-delay": "400ms" } as React.CSSProperties} className="max-w-[520px] text-[17px] leading-[27px] text-white/70">
              A diferença só aparece no fim — como reembolso, chargeback ou reclamação pública.
              O PrometIA confere a promessa antes de postar, ouve o comprador depois da venda e
              fecha o ciclo quando não bate.
            </p>
            <div data-reveal="up" style={{ "--reveal-delay": "550ms" } as React.CSSProperties} className="flex flex-wrap items-center gap-6 pt-2">
              <Link
                href="/creator/checador"
                className="inline-flex items-center gap-2.5 rounded-lg bg-lime px-6 py-4 text-[15px] font-semibold text-navy-deep transition-colors hover:bg-lime/85"
              >
                Começar pelo creator <ArrowRight className="size-4" />
              </Link>
              <a
                href="#solucao"
                className="inline-flex items-center gap-2 text-[15px] font-medium text-white hover:text-white/80"
              >
                Ver como funciona <ArrowDown className="size-4" />
              </a>
            </div>
          </div>

          <div data-reveal="up" style={{ "--reveal-delay": "300ms" } as React.CSSProperties} className="w-full rounded-2xl border border-white/[0.12] bg-white/[0.04] p-8 lg:w-[460px]">
            <div className="flex flex-col gap-2.5">
              <span className="flex items-center gap-2 text-[11px] font-semibold tracking-[1.4px] text-white/60 uppercase">
                <Megaphone className="size-3.5" aria-hidden /> Prometido no vídeo
              </span>
              <p className="font-heading text-[19px] leading-[26px] font-medium">
                “Bateria dura 3 dias e carrega em 20 minutos.”
              </p>
            </div>
            <div className="flex items-center gap-3 py-6">
              <span className="h-px flex-1 bg-white/15" />
              <span data-reveal="pop" style={{ "--reveal-delay": "1000ms" } as React.CSSProperties} className="flex items-center gap-1.5 rounded-full bg-[#FF6B5A26] px-3 py-1.5 text-[12px] font-semibold text-[#FF9A8C]">
                <X className="size-3.5" aria-hidden /> Não bate
              </span>
              <span className="h-px flex-1 bg-white/15" />
            </div>
            <div className="flex flex-col gap-2.5">
              <span className="flex items-center gap-2 text-[11px] font-semibold tracking-[1.4px] text-lime uppercase">
                <PackageOpen className="size-3.5" aria-hidden /> Recebido pelo comprador
              </span>
              <p className="font-heading text-[19px] leading-[26px] font-medium">
                “Dura menos de um dia. Carregar leva quase 2 horas.”
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 pt-6 text-[13px]">
              <span className="text-white/50">Resultado sem o PrometIA</span>
              <span className="font-semibold">Reembolso + reclamação</span>
            </div>
          </div>
        </div>
      </section>

      <section id="solucao" aria-labelledby="solucao-titulo" className="scroll-mt-24 bg-white py-20 lg:py-28">
        <div id="solucao-conteudo" className={cn(container, "flex flex-col gap-16")}>
          <div className="flex flex-wrap items-end justify-between gap-x-20 gap-y-6">
            <div data-reveal="blur" className="flex max-w-[640px] flex-col gap-4">
              <span className="text-[12px] font-semibold tracking-[1.6px] text-muted-foreground uppercase">
                Como funciona
              </span>
              <h2
                id="solucao-titulo"
                className="text-[32px] leading-[1.12] tracking-[-0.8px] sm:text-[40px]"
              >
                Um ciclo em 3 passos que transforma promessa em{" "}
                <span className="reveal-mark">aprendizado</span>.
              </h2>
            </div>
            <p data-reveal="up" style={{ "--reveal-delay": "200ms" } as React.CSSProperties} className="max-w-[380px] text-[16px] leading-[26px] text-muted-foreground">
              Cada etapa alimenta a próxima: o que o comprador relata volta como sinal para quem
              cria e para quem vende.
            </p>
          </div>
          <ol data-reveal="stagger" className="grid gap-12 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="group relative flex flex-col gap-5 border-t border-line pt-7">
                {/* barra que preenche da esquerda para a direita no hover */}
                <span
                  aria-hidden
                  className="absolute -top-px left-0 h-[3px] w-full origin-left scale-x-0 bg-navy transition-transform duration-500 ease-out group-hover:scale-x-100 motion-reduce:transition-none"
                />
                <div className="flex items-center justify-between">
                  <span className="font-heading text-[15px] font-semibold text-muted-foreground transition-colors duration-300 group-hover:text-navy">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="flex size-10 items-center justify-center rounded-[10px] bg-paper">
                    <step.icon className="size-[18px] text-navy" aria-hidden />
                  </span>
                </div>
                <h3 className="text-[22px]">{step.title}</h3>
                <p className="text-[15px] leading-[25px] text-muted-foreground">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="perfis-titulo" className="bg-paper">
        <div className={cn(container, "flex flex-col gap-12 pt-24 pb-28")}>
          <div data-reveal="blur" className="flex flex-col gap-3">
            <h2 id="perfis-titulo" className="text-[32px] tracking-[-0.6px]">
              Escolha uma perspectiva
            </h2>
            <p className="text-[16px] text-muted-foreground">
              Cada perfil vê o mesmo problema de um ângulo diferente.
            </p>
          </div>
          <ul data-reveal="stagger" className="border-t border-line">
            {PROFILES.map((p, i) => (
              <li key={p.href} className="border-b border-line">
                <Link
                  href={p.href}
                  className="group flex items-center gap-4 px-2 py-7 transition-colors hover:bg-white sm:gap-7"
                >
                  <span className="hidden font-heading text-[14px] font-medium text-muted-foreground sm:inline">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-line bg-white">
                    <p.icon className="size-5 text-navy" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1 font-heading text-[20px] font-semibold text-ink md:w-[280px] md:flex-none md:text-[22px]">
                    {p.label}
                  </span>
                  <span className="hidden flex-1 text-[15px] text-muted-foreground md:block">
                    {p.text}
                  </span>
                  <span className="hidden rounded-full border border-line bg-white px-3 py-1.5 text-[12px] font-medium text-muted-foreground lg:inline">
                    {p.stage}
                  </span>
                  <span
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-full transition-transform group-hover:translate-x-0.5",
                      i === 0 ? "bg-lime text-navy-deep" : "bg-navy text-white",
                    )}
                  >
                    <ArrowRight className="size-4" aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
