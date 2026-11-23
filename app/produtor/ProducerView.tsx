"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ChevronsUpDown, ScanSearch } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";

export interface ProducerOption {
  name: string;
  products: string[];
  /** painel já renderizado no servidor */
  panel: ReactNode;
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/** Troca de produtor no cabeçalho; os painéis vêm prontos do servidor. */
export function ProducerView({ producers }: { producers: ProducerOption[] }) {
  const [current, setCurrent] = useState(producers[0].name);
  const p = producers.find((x) => x.name === current)!;

  return (
    <>
      <PageHeader
        eyebrow="Produtor · Aprendizado"
        title="Saúde da promessa dos seus produtos"
        subtitle="Quais creators e promessas geram reembolso nos seus produtos — e quais casos pedem a sua resposta."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/produtor/checador"
              className="flex items-center gap-2 rounded-[10px] bg-lime px-4 py-3 text-[14px] font-semibold text-navy-deep transition-colors hover:bg-lime/85"
            >
              <ScanSearch className="size-4" aria-hidden /> Checar minha página de vendas
            </Link>
            <Select
              items={producers.map((x) => ({ value: x.name, label: x.name }))}
              value={current}
              onValueChange={(v) => v && setCurrent(v)}
            >
              <SelectTrigger
                aria-label="Ver como produtor"
                className="gap-3 rounded-[10px] border-line bg-white py-2 pr-3.5 pl-2 data-[size=default]:h-auto [&>svg:last-child]:hidden"
              >
                <span className="flex size-8 items-center justify-center rounded-lg bg-navy text-[12px] font-bold text-lime">
                  {initials(p.name)}
                </span>
                <span className="flex flex-col items-start gap-px text-left">
                  <span className="text-[14px] font-semibold text-ink">{p.name}</span>
                  <span className="text-[12px] text-muted-foreground">
                    {p.products.length} produto{p.products.length > 1 ? "s" : ""} · {p.products.join(", ")}
                  </span>
                </span>
                <ChevronsUpDown className="ml-1 size-4 text-muted-foreground" aria-hidden />
              </SelectTrigger>
              <SelectContent>
                {producers.map((x) => (
                  <SelectItem key={x.name} value={x.name}>
                    {x.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />
      {producers.map((x) => (
        <div key={x.name} hidden={x.name !== current}>
          {x.panel}
        </div>
      ))}
    </>
  );
}
