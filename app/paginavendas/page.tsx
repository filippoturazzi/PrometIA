import type { Metadata } from "next";
import Link from "next/link";
import { Anton } from "next/font/google";
import { DEMO_PAGE } from "@/lib/demo-page";
import { Countdown } from "./Countdown";

// Página de vendas FICTÍCIA do TermoSlim, para a demo do Checador do Produtor.
// Visual propositalmente diferente do PrometIA. Tudo marcado com data-prometia-ignore fica fora da leitura da IA.

const anton = Anton({ subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: "TermoSlim — Oferta especial (página fictícia)",
  description: "Página de vendas fictícia criada para a demonstração do PrometIA.",
  robots: { index: false, follow: false },
};

const page = DEMO_PAGE;

function Cta() {
  return (
    <a
      href="#topo"
      className={`${anton.className} block w-full rounded-xl bg-[#ffd400] px-6 py-5 text-center text-2xl tracking-wide text-[#1a0000] uppercase shadow-[0_6px_0_#b39500] transition hover:translate-y-0.5 hover:shadow-[0_4px_0_#b39500] sm:text-3xl`}
    >
      {page.cta}
    </a>
  );
}

export default function PaginaVendasPage() {
  return (
    <div id="topo" className="min-h-screen bg-[#0d0d0d] text-white">
      {/* aviso obrigatório: fora da leitura */}
      <div
        data-prometia-ignore
        className="sticky top-0 z-50 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-white px-4 py-2 text-center text-[12px] text-neutral-700"
      >
        <span>Página fictícia criada para a demonstração do PrometIA · todos os dados são fictícios</span>
        <Link href="/produtor/checador" className="font-semibold text-neutral-900 underline">
          Voltar ao PrometIA
        </Link>
      </div>

      {/* faixa de urgência: o contador muda a cada segundo, então fica fora da leitura */}
      <div
        data-prometia-ignore
        className="flex flex-wrap items-center justify-center gap-3 bg-[#d90000] px-4 py-2.5 text-center text-sm font-bold uppercase"
      >
        <span>⚠️ Oferta acaba em</span>
        <Countdown />
      </div>

      <main className="mx-auto flex max-w-3xl flex-col gap-10 px-4 py-10 sm:py-14">
        <header className="flex flex-col items-center gap-5 text-center">
          <p className="rounded-full border border-[#ffd400]/60 px-4 py-1 text-xs font-bold tracking-[3px] text-[#ffd400] uppercase">
            {page.brand} apresenta · {page.product}
          </p>
          <h1 className={`${anton.className} text-4xl leading-[1.05] text-white uppercase sm:text-6xl`}>
            {page.headline}
          </h1>
          <p className="max-w-xl text-lg text-neutral-300">{page.subheadline}</p>
        </header>

        <section className="rounded-2xl border-2 border-[#d90000] bg-[#1a0505] p-6 sm:p-8">
          <h2 className={`${anton.className} mb-5 text-2xl text-[#ffd400] uppercase sm:text-3xl`}>
            Por que o {page.product} funciona
          </h2>
          <ul className="flex flex-col gap-3">
            {page.bullets.map((b) => (
              <li key={b} className="flex gap-3 text-base sm:text-lg">
                <span data-prometia-ignore className="mt-0.5 text-[#ffd400]" aria-hidden>
                  ✔
                </span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className={`${anton.className} text-center text-2xl text-white uppercase sm:text-3xl`}>Quem tomou, aprovou</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {page.testimonials.map((t) => (
              <figure key={t.name} className="flex flex-col gap-3 rounded-xl bg-white p-5 text-neutral-900">
                <span data-prometia-ignore className="text-[#ffb400]" aria-label="5 estrelas">
                  ★★★★★
                </span>
                <blockquote className="text-sm leading-relaxed">“{t.text}”</blockquote>
                <figcaption className="text-xs font-bold text-neutral-500">{t.name}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="flex flex-col items-center gap-5 rounded-2xl bg-gradient-to-b from-[#2a0000] to-[#0d0d0d] p-6 text-center sm:p-10">
          <p className="text-neutral-400">
            De <span className="line-through">{page.priceFrom}</span> por apenas
          </p>
          <p className={`${anton.className} text-6xl text-[#ffd400] sm:text-7xl`}>{page.priceTo}</p>
          <Cta />
          <div className="flex items-center gap-3 rounded-xl border border-[#ffd400]/40 px-4 py-3 text-left">
            <span
              data-prometia-ignore
              className={`${anton.className} flex size-14 shrink-0 items-center justify-center rounded-full bg-[#ffd400] text-center text-[11px] leading-tight text-[#1a0000] uppercase`}
              aria-hidden
            >
              Selo
              <br />
              100%
            </span>
            <p className="text-sm text-neutral-200">{page.guarantee}</p>
          </div>
        </section>
      </main>

      <footer data-prometia-ignore className="px-4 pb-8 text-center text-xs text-neutral-500">
        {page.brand} · marca fictícia · protótipo conceitual, não oficial
      </footer>
    </div>
  );
}
