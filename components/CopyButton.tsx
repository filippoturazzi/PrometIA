"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
  variant?: "outline" | "ghost" | "default";
}

export function CopyButton({ text, label = "Copiar", className, variant = "outline" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(t);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // clipboard bloqueado (ex.: http sem permissão): seleciona o texto não é possível aqui, só ignora
    }
  }

  return (
    <Button type="button" size="sm" variant={variant} onClick={copy} className={cn("gap-1.5", className)}>
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      <span aria-live="polite">{copied ? "Copiado!" : label}</span>
    </Button>
  );
}
