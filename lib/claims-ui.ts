// Metadados visuais das promessas, compartilhados entre client e server.

import type { ClaimCategory, ClaimStatus } from "@/lib/types";
import type { OverallRisk } from "@/lib/schemas";

export const STATUS_META: Record<
  ClaimStatus,
  { label: string; icon: string; text: string; bg: string; border: string; accent: string; mark: string }
> = {
  sustentada: {
    label: "Sustentada",
    icon: "✅",
    text: "text-status-ok",
    bg: "bg-status-ok-bg",
    border: "border-status-ok/30",
    accent: "border-l-status-ok",
    mark: "bg-status-ok-bg decoration-status-ok",
  },
  exagerada: {
    label: "Exagerada",
    icon: "⚠️",
    text: "text-status-warn",
    bg: "bg-status-warn-bg",
    border: "border-status-warn/30",
    accent: "border-l-status-warn",
    mark: "bg-status-warn-bg decoration-status-warn",
  },
  proibida: {
    label: "Proibida",
    icon: "❌",
    text: "text-status-bad",
    bg: "bg-status-bad-bg",
    border: "border-status-bad/30",
    accent: "border-l-status-bad",
    mark: "bg-status-bad-bg decoration-status-bad",
  },
};

export const CATEGORY_LABELS: Record<ClaimCategory, string> = {
  ganho_financeiro: "Ganho financeiro",
  resultado_saude: "Resultado de saúde",
  prazo: "Prazo",
  conteudo: "Conteúdo",
  garantia: "Garantia",
  outro: "Outro",
};

export const RISK_META: Record<OverallRisk, { label: string; status: ClaimStatus }> = {
  baixo: { label: "Risco baixo", status: "sustentada" },
  medio: { label: "Risco médio", status: "exagerada" },
  alto: { label: "Risco alto", status: "proibida" },
};

const STATUS_RANK: Record<ClaimStatus, number> = { sustentada: 0, exagerada: 1, proibida: 2 };
export const compareByRisk = (a: { status: ClaimStatus }, b: { status: ClaimStatus }) =>
  STATUS_RANK[b.status] - STATUS_RANK[a.status];

/**
 * Localiza o trecho da promessa no roteiro (o modelo às vezes muda pontuação ou maiúsculas).
 * Devolve [início, fim) ou null.
 */
export function findClaimSpan(script: string, claim: string): [number, number] | null {
  const hay = script.toLowerCase();
  const candidates = [
    claim,
    claim.replace(/[.,;:!?…"“”]+$/u, ""),
    claim.replace(/^["“]|["”]$/gu, "").replace(/[.,;:!?…]+$/u, ""),
  ];
  for (const c of candidates) {
    const needle = c.trim().toLowerCase();
    if (needle.length < 4) continue;
    const i = hay.indexOf(needle);
    if (i >= 0) return [i, i + needle.length];
  }
  return null;
}
