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
  /** chamado depois de copiar com sucesso */
  onCopied?: () => void;
}

export function CopyButton({
  text,
  label = "Copiar",
  className,
  variant = "outline",
  onCopied,
}: CopyButtonProps) {
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
      onCopied?.();
    } catch {
      // clipboard bloqueado (ex.: http sem permissão): só ignora
    }
  }

  return (
    <Button type="button" size="sm" variant={variant} onClick={copy} className={cn("gap-1.5", className)}>
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      <span aria-live="polite">{copied ? "Copiado!" : label}</span>
    </Button>
  );
}
