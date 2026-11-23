// Os 4 response schemas da seção 8, no formato do modo strict do Groq:
// todos os campos em `required` e `additionalProperties: false` em todo objeto.
// Campos "opcionais" vêm como "" e são convertidos em undefined por `clean*` antes de ir para a tela.

import type { ClaimCategory, ClaimStatus, FrustrationType, Severity } from "@/lib/types";

const CLAIM_STATUS: ClaimStatus[] = ["sustentada", "exagerada", "proibida"];
const CLAIM_CATEGORY: ClaimCategory[] = [
  "ganho_financeiro",
  "resultado_saude",
  "prazo",
  "conteudo",
  "garantia",
  "outro",
];
const FRUSTRATION: FrustrationType[] = [
  "expectativa_desalinhada",
  "acesso_tecnico",
  "qualidade_conteudo",
  "entrega_logistica",
  "arrependimento_pessoal",
];
const SEVERITY: Severity[] = ["baixa", "media", "alta"];

// ---------------------------------------------------------------------------
// IA 1 — check-claims
// ---------------------------------------------------------------------------
export const checkClaimsSchema = {
  type: "object",
  properties: {
    claims: {
      type: "array",
      items: {
        type: "object",
        properties: {
          // category logo após status: o modelo tende a esquecer o último campo
          text: { type: "string" },
          status: { type: "string", enum: CLAIM_STATUS },
          category: { type: "string", enum: CLAIM_CATEGORY },
          evidence: { type: "string" },
          reason: { type: "string" },
          rewrite: { type: "string" }, // "" se sustentada
        },
        required: ["text", "status", "category", "evidence", "reason", "rewrite"],
        additionalProperties: false,
      },
    },
    overallRisk: { type: "string", enum: ["baixo", "medio", "alto"] },
  },
  required: ["claims", "overallRisk"],
  additionalProperties: false,
};

export type OverallRisk = "baixo" | "medio" | "alto";

/** Resposta crua do modelo (campos sempre presentes). */
export interface CheckClaimsRaw {
  claims: {
    text: string;
    status: ClaimStatus;
    evidence: string;
    reason: string;
    rewrite: string;
    category: ClaimCategory;
  }[];
  overallRisk: OverallRisk;
}

/** Resposta entregue à tela (rewrite ausente quando não se aplica). */
export interface CheckClaimsResult {
  claims: {
    text: string;
    status: ClaimStatus;
    evidence: string;
    reason: string;
    rewrite?: string;
    category: ClaimCategory;
  }[];
  overallRisk: OverallRisk;
}

// ---------------------------------------------------------------------------
// IA 4 — check-page (página de vendas do produtor)
// ---------------------------------------------------------------------------
const RISK: OverallRisk[] = ["baixo", "medio", "alto"];

export const checkPageSchema = {
  type: "object",
  properties: {
    claims: {
      type: "array",
      items: {
        type: "object",
        properties: {
          text: { type: "string" },
          status: { type: "string", enum: CLAIM_STATUS },
          category: { type: "string", enum: CLAIM_CATEGORY },
          refundRisk: { type: "string", enum: RISK },
          evidence: { type: "string" },
          reason: { type: "string" },
          rewrite: { type: "string" }, // "" se sustentada
        },
        required: ["text", "status", "category", "refundRisk", "evidence", "reason", "rewrite"],
        additionalProperties: false,
      },
    },
    overallRisk: { type: "string", enum: RISK },
    summary: { type: "string" },
  },
  required: ["claims", "overallRisk", "summary"],
  additionalProperties: false,
};

export interface CheckPageRaw {
  claims: (CheckClaimsRaw["claims"][number] & { refundRisk: OverallRisk })[];
  overallRisk: OverallRisk;
  summary: string;
}

export interface CheckPageResult {
  claims: (CheckClaimsResult["claims"][number] & { refundRisk: OverallRisk })[];
  overallRisk: OverallRisk;
  summary: string;
}

// IA 4 por imagem — OCR dos prints (só transcreve; a análise é a mesma do texto)
export const pageOcrSchema = {
  type: "object",
  properties: { text: { type: "string" } },
  required: ["text"],
  additionalProperties: false,
};

export interface PageOcrRaw {
  text: string;
}

// ---------------------------------------------------------------------------
// IA 2 — classify-feedback
// ---------------------------------------------------------------------------
export const classifyFeedbackSchema = {
  type: "object",
  properties: {
    type: { type: "string", enum: FRUSTRATION },
    severity: { type: "string", enum: SEVERITY },
    relatedClaim: { type: "string" }, // "" se não houver
    summary: { type: "string" },
    helpOffer: { type: "string" }, // "" se não houver
  },
  required: ["type", "severity", "relatedClaim", "summary", "helpOffer"],
  additionalProperties: false,
};

export interface ClassifyFeedbackRaw {
  type: FrustrationType;
  severity: Severity;
  relatedClaim: string;
  summary: string;
  helpOffer: string;
}

export interface ClassifyFeedbackResult {
  type: FrustrationType;
  severity: Severity;
  relatedClaim?: string;
  summary: string;
  helpOffer?: string;
}

// ---------------------------------------------------------------------------
// IA 3 — insight (creator e case)
// ---------------------------------------------------------------------------
export const insightSchema = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: { title: { type: "string" }, body: { type: "string" } },
        required: ["title", "body"],
        additionalProperties: false,
      },
    },
    suggestedAction: { type: "string" }, // "" no scope=creator
  },
  required: ["items", "suggestedAction"],
  additionalProperties: false,
};

export interface InsightRaw {
  items: { title: string; body: string }[];
  suggestedAction: string;
}

export interface InsightResult {
  items: { title: string; body: string }[];
  suggestedAction?: string;
}

// ---------------------------------------------------------------------------
// "" → undefined
// ---------------------------------------------------------------------------
const opt = (s: string | undefined) => {
  const t = s?.trim();
  return t ? t : undefined;
};

export function cleanCheckClaims(raw: CheckClaimsRaw): CheckClaimsResult {
  return {
    overallRisk: raw.overallRisk,
    claims: raw.claims.map((c) => ({
      text: c.text.trim(),
      status: c.status,
      evidence: c.evidence.trim(),
      reason: c.reason.trim(),
      rewrite: c.status === "sustentada" ? undefined : opt(c.rewrite),
      category: c.category,
    })),
  };
}

export function cleanCheckPage(raw: CheckPageRaw): CheckPageResult {
  const base = cleanCheckClaims(raw);
  return {
    overallRisk: raw.overallRisk,
    summary: raw.summary.trim(),
    claims: base.claims.map((c, i) => ({ ...c, refundRisk: raw.claims[i].refundRisk })),
  };
}

export function cleanClassifyFeedback(raw: ClassifyFeedbackRaw): ClassifyFeedbackResult {
  return {
    type: raw.type,
    severity: raw.severity,
    relatedClaim: opt(raw.relatedClaim),
    summary: raw.summary.trim(),
    helpOffer: opt(raw.helpOffer),
  };
}

export function cleanInsight(raw: InsightRaw): InsightResult {
  return {
    items: raw.items.map((i) => ({ title: i.title.trim(), body: i.body.trim() })),
    suggestedAction: opt(raw.suggestedAction),
  };
}
