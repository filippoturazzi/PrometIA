import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Clapperboard,
  MessageSquareText,
  ShieldCheck,
  ShoppingBag,
  Store,
  TrendingUp,
} from "lucide-react";

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
  },
  {
    href: "/comprador/obrigado",
    icon: ShoppingBag,
    label: "Comprador",
    text: "Declarar expectativa e pedir reembolso",
  },
  {
    href: "/produtor",
    icon: Store,
    label: "Produtor",
    text: "Saúde da promessa dos seus produtos",
  },
  {
    href: "/operacoes",
    icon: Building2,
    label: "Operações YouShop",
    text: "Painel geral e fila de escalonamento",
  },
];

export default function Home() {
  return (
    <div className="space-y-12">
      <section
        id="problema"
        className="bg-hero overflow-hidden rounded-2xl px-6 py-12 text-white sm:px-10 sm:py-16"
      >
        <span className="text-xs font-semibold tracking-widest text-primary uppercase">
          Um conceito para o ecossistema YouShop
        </span>
        <h1 className="mt-3 max-w-3xl text-3xl leading-tight font-bold text-white sm:text-4xl">
          O que foi <span className="text-primary">prometido</span> na
          divulgação quase nunca é conferido com o que o comprador{" "}
          <span className="text-primary">recebe</span>.
        </h1>
        <p className="mt-4 max-w-2xl text-base text-white/80">
          A diferença só aparece no fim: como reembolso, chargeback ou
          reclamação pública. O <strong className="text-white">PrometIA</strong>{" "}
          confere a promessa antes de postar, ouve o comprador depois da venda e
          fecha o ciclo quando não bate.
        </p>
        <Link
          href="/creator/checador"
          className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 font-medium text-primary-foreground transition-colors hover:bg-primary/85"
        >
          Começar pelo creator <ArrowRight className="size-4" />
        </Link>
      </section>

      <section id="solucao" aria-labelledby="solucao-titulo">
        <span className="text-xs font-semibold tracking-widest text-secondary/70 uppercase">
          Como funciona
        </span>
        <h2 id="solucao-titulo" className="mt-1 text-2xl">
          Um ciclo em 3 passos que{" "}
          <span className="rounded bg-primary/30 px-1">
            transforma promessa em aprendizado
          </span>
        </h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="relative rounded-xl border bg-card p-5 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <step.icon className="size-5 text-secondary" aria-hidden />
                <h3 className="text-base">{step.title}</h3>
              </div>
              <p className="mt-3 text-muted-foreground">{step.text}</p>
              {i < STEPS.length - 1 && (
                <ArrowRight
                  aria-hidden
                  className="absolute top-1/2 -right-3.5 hidden size-5 -translate-y-1/2 text-secondary/40 md:block"
                />
              )}
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="perfis-titulo">
        <h2 id="perfis-titulo" className="text-2xl">
          Escolha uma perspectiva
        </h2>
        <p className="mt-1 text-muted-foreground">
          Cada perfil vê o mesmo problema de um ângulo diferente.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PROFILES.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="group rounded-xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
            >
              <p.icon className="size-6 text-secondary" aria-hidden />
              <div className="mt-3 flex items-center justify-between font-semibold text-secondary">
                {p.label}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{p.text}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
