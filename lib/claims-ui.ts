// Metadados visuais das promessas, compartilhados entre client e server.

import { CircleCheck, CircleX, TriangleAlert, type LucideIcon } from "lucide-react";
import type { ClaimCategory, ClaimStatus, FrustrationType, Severity } from "@/lib/types";
import type { OverallRisk } from "@/lib/schemas";

export const STATUS_META: Record<
  ClaimStatus,
  {
    label: string;
    icon: string;
    Icon: LucideIcon;
    text: string;
    bg: string;
    /** fundo sólido (bolinhas, numeração, barras) */
    solid: string;
    border: string;
    accent: string;
    mark: string;
  }
> = {
  sustentada: {
    label: "Sustentada",
    icon: "✅",
    Icon: CircleCheck,
    text: "text-status-ok",
    solid: "bg-status-ok",
    bg: "bg-status-ok-bg",
    border: "border-status-ok/30",
    accent: "border-l-status-ok",
    mark: "bg-status-ok-bg decoration-status-ok",
  },
  exagerada: {
    label: "Exagerada",
    icon: "⚠️",
    Icon: TriangleAlert,
    text: "text-status-warn",
    solid: "bg-status-warn",
    bg: "bg-status-warn-bg",
    border: "border-status-warn/30",
    accent: "border-l-status-warn",
    mark: "bg-status-warn-bg decoration-status-warn",
  },
  proibida: {
    label: "Proibida",
    icon: "❌",
    Icon: CircleX,
    text: "text-status-bad",
    solid: "bg-status-bad",
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

export const FRUSTRATION_LABELS: Record<FrustrationType, string> = {
  expectativa_desalinhada: "Expectativa desalinhada",
  acesso_tecnico: "Acesso / técnico",
  qualidade_conteudo: "Qualidade do conteúdo",
  entrega_logistica: "Entrega / logística",
  arrependimento_pessoal: "Arrependimento pessoal",
};

/** Gravidade reaproveita as cores de status: alta = vermelho, média = âmbar, baixa = verde. */
export const SEVERITY_META: Record<Severity, { label: string; status: ClaimStatus }> = {
  alta: { label: "Gravidade alta", status: "proibida" },
  media: { label: "Gravidade média", status: "exagerada" },
  baixa: { label: "Gravidade baixa", status: "sustentada" },
};

const normClaim = (s: string) =>
  s.toLowerCase().replace(/[^\p{L}\p{N} ]/gu, "").replace(/\s+/g, " ").trim();

/** Encontra a promessa da lista que corresponde ao texto (tolerante a pontuação e recortes). */
export function matchClaim<T extends { text: string }>(claims: T[], text: string): T | undefined {
  const t = normClaim(text);
  if (t.length < 4) return undefined;
  return (
    claims.find((c) => normClaim(c.text) === t) ??
    claims.find((c) => {
      const x = normClaim(c.text);
      return x.includes(t) || t.includes(x);
    })
  );
}
