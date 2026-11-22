"use client";

import { useSyncExternalStore } from "react";

// Pequeno estado da simulação do comprador (ex.: expectativa marcada na página de obrigado).
// sessionStorage pode falhar (aba anônima, bloqueio): toda leitura/escrita fica em try/catch.

const EVENT = "prometia-session";

export const EXPECTATION_KEY = "prometia_expectativa";

export function setSessionValue(key: string, value: string | null) {
  try {
    if (value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, value);
  } catch {
    // sem armazenamento: a simulação segue sem lembrar o valor
  }
  window.dispatchEvent(new Event(EVENT));
}

function read(key: string) {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

/** Valor do sessionStorage; null no servidor e quando não existe. */
export function useSessionValue(key: string) {
  return useSyncExternalStore(subscribe, () => read(key), () => null);
}
