"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { SimulationBadge } from "@/components/SimulationBadge";
import { brl } from "@/lib/format";
import { EXPECTATION_KEY, setSessionValue } from "@/lib/session";
import { cn } from "@/lib/utils";

interface Props {
  product: { name: string; producer: string; price: number; chips: string[] };
}

export function Obrigado({ product }: Props) {
  const router = useRouter();
  const [chosen, setChosen] = useState<string | null>(null);

  function go(expectation: string | null) {
    setSessionValue(EXPECTATION_KEY, expectation);
    router.push("/comprador/youclass");
    // com Cache Components a página fica guardada ao navegar; ao voltar, os chips estão livres de novo
    setChosen(null);
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="relative overflow-hidden rounded-2xl border bg-card shadow-lg">
        <SimulationBadge className="absolute top-4 right-4" />
        <div className="bg-hero px-6 py-8 text-center text-white">
          <CheckCircle2 className="mx-auto size-12 text-primary" aria-hidden />
          <p className="mt-3 text-2xl font-bold">Pagamento aprovado 🎉</p>
          <p className="mt-1 text-white/80">
            {product.name} · {brl(product.price)} · por {product.producer}
          </p>
          <p className="mt-1 text-sm text-white/60">O acesso já foi liberado na sua área de membros.</p>
        </div>

        <div className="space-y-5 p-6">
          <div>
            <h2 className="text-lg">O que você espera conseguir com este produto?</h2>
            <p className="text-sm text-muted-foreground">
              Leva 2 segundos e ajuda o produtor a acertar o que entrega.
            </p>
          </div>

          <div id="chips-expectativa" className="flex flex-wrap gap-2" role="radiogroup" aria-label="Expectativa">
            {product.chips.map((chip) => (
              <button
                key={chip}
                type="button"
                role="radio"
                aria-checked={chosen === chip}
                disabled={chosen !== null}
                onClick={() => {
                  setChosen(chip);
                  // um instante para o chip marcado aparecer antes de navegar
                  setTimeout(() => go(chip), 350);
                }}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-default",
                  chosen === chip
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-white text-secondary hover:border-primary hover:bg-primary/10",
                )}
              >
                {chip}
              </button>
            ))}
          </div>

          <div className="border-t pt-4 text-center">
            <button
              type="button"
              onClick={() => go(null)}
              className="text-sm text-muted-foreground underline underline-offset-2 hover:text-secondary"
            >
              Pular
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
