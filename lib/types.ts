// Tipos da seção 5 do SPEC.
// Acréscimos: Product.slug (usado no link exclusivo) e os aliases nomeados
// ClaimCategory / CheckinValue / Severity.

export type ProductType = "curso" | "suplemento" | "mentoria";

export interface Product {
  id: string; // "p_reels"
  slug: string; // "renda-reels" — usado em youshop.co/r/{handle}/{slug}?c={id}
  name: string;
  type: ProductType;
  producer: string; // nome do produtor
  price: number;
  salesPageText: string; // texto da página de vendas (fonte de "promessa oficial")
  contentOutline?: string[]; // módulos/conteúdo real (só se hasYouClass)
  hasYouClass: boolean;
  expectationChips: string[]; // opções da página de obrigado
}

export type CreatorStyle = "cauteloso" | "misto" | "exagerado";

export interface Creator {
  id: string; // "c_ana"
  name: string;
  handle: string; // "ana-reels"
  niche: string;
  style: CreatorStyle;
}

export type ClaimStatus = "sustentada" | "exagerada" | "proibida";

export type ClaimCategory =
  | "ganho_financeiro"
  | "resultado_saude"
  | "prazo"
  | "conteudo"
  | "garantia"
  | "outro";

export interface Claim {
  text: string; // trecho literal do roteiro
  status: ClaimStatus;
  evidence: string; // trecho da página/conteúdo que sustenta ou contradiz ("" se nada)
  reason: string; // explicação curta
  rewrite?: string; // só para exagerada/proibida
  category: ClaimCategory;
}

export interface Content {
  id: string; // "ct_013"
  creatorId: string;
  productId: string;
  title: string; // "Reels: como saí do zero"
  channel: "tiktok" | "instagram" | "youtube";
  publishedAt: string; // ISO
  script: string;
  claims: Claim[]; // pré-calculadas para o seed
  linkId: string; // "ct_013"
}

export type CheckinValue = "positivo" | "neutro" | "negativo";

export interface Sale {
  id: string;
  contentId: string;
  productId: string;
  creatorId: string;
  createdAt: string;
  expectation?: string; // chip marcado na página de obrigado
  checkin?: CheckinValue;
  refunded: boolean;
  chargeback: boolean;
}

export type FrustrationType =
  | "expectativa_desalinhada"
  | "acesso_tecnico"
  | "qualidade_conteudo"
  | "entrega_logistica"
  | "arrependimento_pessoal";

export type Severity = "baixa" | "media" | "alta";

export interface Feedback {
  id: string;
  saleId: string;
  text: string; // o que o comprador escreveu no reembolso
  classification: {
    type: FrustrationType;
    severity: Severity;
    relatedClaim?: string; // promessa relacionada, se houver
    summary: string;
  };
  producerRespondedHours?: number | null; // null = produtor não respondeu
  createdAt: string;
}
