"use client";

import { useEffect, useState } from "react";

const START = 14 * 60 + 59;

/** Contador "de urgência" típico de página de vendas. Fica fora da leitura (data-prometia-ignore no pai). */
export function Countdown() {
  const [left, setLeft] = useState(START);

  useEffect(() => {
    const id = setInterval(() => setLeft((s) => (s > 0 ? s - 1 : START)), 1000);
    return () => clearInterval(id);
  }, []);

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  return (
    <span className="font-mono text-lg font-bold tabular-nums" suppressHydrationWarning>
      00:{mm}:{ss}
    </span>
  );
}
