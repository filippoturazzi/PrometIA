import "server-only";

import productsJson from "@/data/products.json";
import creatorsJson from "@/data/creators.json";
import contentsJson from "@/data/contents.json";
import salesJson from "@/data/sales.json";
import feedbackJson from "@/data/feedback.json";
import type {
  Claim,
  ClaimStatus,
  Content,
  Creator,
  CreatorStyle,
  Feedback,
  FrustrationType,
  Product,
  Sale,
} from "@/lib/types";
import { FRUSTRATION_LABELS } from "@/lib/claims-ui";
import { COMMISSION_RATE, DEMO_FEEDBACK_ID, DEMO_NOW, ESCALATION_HOURS } from "@/lib/demo";

export { FRUSTRATION_LABELS };

// ---------------------------------------------------------------------------
// Dados brutos (imports estáticos: entram no bundle do servidor, sem fs em runtime)
// ---------------------------------------------------------------------------
const products = productsJson as Product[];
const creators = creatorsJson as Creator[];
const contents = contentsJson as Content[];
const sales = salesJson as Sale[];
const feedback = feedbackJson as Feedback[];

const productById = new Map(products.map((p) => [p.id, p]));
const creatorById = new Map(creators.map((c) => [c.id, c]));
const contentById = new Map(contents.map((c) => [c.id, c]));
const saleById = new Map(sales.map((s) => [s.id, s]));

const HOUR = 3_600_000;
const NOW = new Date(DEMO_NOW).getTime();

// ---------------------------------------------------------------------------
// Getters
// ---------------------------------------------------------------------------
export interface DataFilter {
  creatorId?: string;
  productId?: string;
  /** nome do produtor (visão /produtor) */
  producer?: string;
}

export const getProducts = (filter: Pick<DataFilter, "producer"> = {}) =>
  products.filter((p) => !filter.producer || p.producer === filter.producer);
export const getProduct = (id: string) => productById.get(id);
export const getCreators = () => creators;
export const getCreator = (id: string) => creatorById.get(id);
export const getContent = (id: string) => contentById.get(id);
export const getSale = (id: string) => saleById.get(id);
export const getProducers = () => [...new Set(products.map((p) => p.producer))];

function matches(item: { creatorId: string; productId: string }, filter: DataFilter) {
  if (filter.creatorId && item.creatorId !== filter.creatorId) return false;
  if (filter.productId && item.productId !== filter.productId) return false;
  if (filter.producer && productById.get(item.productId)?.producer !== filter.producer) return false;
  return true;
}

export const getContents = (filter: DataFilter = {}) => contents.filter((c) => matches(c, filter));
export const getSales = (filter: DataFilter = {}) => sales.filter((s) => matches(s, filter));
export const getFeedback = (filter: DataFilter = {}) =>
  feedback.filter((f) => {
    const sale = saleById.get(f.saleId);
    return sale ? matches(sale, filter) : false;
  });
export const getFeedbackById = (id: string) => feedback.find((f) => f.id === id);

// ---------------------------------------------------------------------------
// Claims
// ---------------------------------------------------------------------------
const STATUS_RANK: Record<ClaimStatus, number> = { sustentada: 0, exagerada: 1, proibida: 2 };

export function worstClaimStatus(claims: Claim[]): ClaimStatus {
  return claims.reduce<ClaimStatus>(
    (worst, c) => (STATUS_RANK[c.status] > STATUS_RANK[worst] ? c.status : worst),
    "sustentada",
  );
}

/** Claim de maior risco (proibida > exagerada > sustentada); a primeira em caso de empate. */
export function highestRiskClaim(claims: Claim[]): Claim | undefined {
  return claims.reduce<Claim | undefined>(
    (best, c) => (!best || STATUS_RANK[c.status] > STATUS_RANK[best.status] ? c : best),
    undefined,
  );
}

export const hasProhibitedClaim = (content: Content) =>
  content.claims.some((c) => c.status === "proibida");

// ---------------------------------------------------------------------------
// Métricas básicas
// ---------------------------------------------------------------------------
export interface SalesMetrics {
  sales: number;
  refunds: number;
  chargebacks: number;
  /** reembolsos / vendas (0–1) */
  refundRate: number;
  /** "vendas que ficam": vendas sem reembolso nem chargeback (no seed, todo chargeback também é reembolso) */
  keptSales: number;
}

function metrics(list: Sale[]): SalesMetrics {
  const refunds = list.filter((s) => s.refunded).length;
  const chargebacks = list.filter((s) => s.chargeback).length;
  // Todo chargeback no seed também é reembolso. "Vendas que ficam" = vendas sem reembolso nem chargeback.
  const keptSales = list.filter((s) => !s.refunded && !s.chargeback).length;
  return {
    sales: list.length,
    refunds,
    chargebacks,
    refundRate: list.length ? refunds / list.length : 0,
    keptSales,
  };
}

/** Feedbacks classificados como expectativa desalinhada / total de reembolsos com feedback (0–1). */
function expectationShare(list: Feedback[]) {
  if (!list.length) return 0;
  return list.filter((f) => f.classification.type === "expectativa_desalinhada").length / list.length;
}

// ---------------------------------------------------------------------------
// Agregações
// ---------------------------------------------------------------------------
export interface ContentAggregate extends SalesMetrics {
  content: Content;
  creator: Creator;
  product: Product;
  worstStatus: ClaimStatus;
  riskiestClaim?: Claim;
}

export function aggregateByContent(filter: DataFilter = {}): ContentAggregate[] {
  return getContents(filter).map((content) => ({
    content,
    creator: creatorById.get(content.creatorId)!,
    product: productById.get(content.productId)!,
    worstStatus: worstClaimStatus(content.claims),
    riskiestClaim: highestRiskClaim(content.claims),
    ...metrics(sales.filter((s) => s.contentId === content.id)),
  }));
}

export interface GroupAggregate extends SalesMetrics {
  /** % dos reembolsos classificados como expectativa desalinhada (0–1) */
  expectationShare: number;
  /** nº de conteúdos publicados com ao menos uma promessa proibida */
  activeProhibitedContents: number;
  /** nº total de promessas proibidas nesses conteúdos */
  activeProhibitedClaims: number;
}

function groupAggregate(filter: DataFilter): GroupAggregate {
  const groupContents = getContents(filter);
  return {
    ...metrics(getSales(filter)),
    expectationShare: expectationShare(getFeedback(filter)),
    activeProhibitedContents: groupContents.filter(hasProhibitedClaim).length,
    activeProhibitedClaims: groupContents.reduce(
      (n, c) => n + c.claims.filter((cl) => cl.status === "proibida").length,
      0,
    ),
  };
}

export function aggregateByCreator(filter: DataFilter = {}) {
  const ids = new Set(getContents(filter).map((c) => c.creatorId));
  return creators
    .filter((c) => ids.has(c.id))
    .map((creator) => ({ creator, ...groupAggregate({ ...filter, creatorId: creator.id }) }));
}

export function aggregateByProduct(filter: DataFilter = {}) {
  return getProducts(filter)
    .filter((p) => !filter.productId || p.id === filter.productId)
    .map((product) => ({ product, ...groupAggregate({ ...filter, productId: product.id }) }));
}

export function aggregateByStyle() {
  const styles: CreatorStyle[] = ["exagerado", "misto", "cauteloso"];
  return styles.map((style) => {
    const ids = new Set(creators.filter((c) => c.style === style).map((c) => c.id));
    return { style, ...metrics(sales.filter((s) => ids.has(s.creatorId))) };
  });
}

/** Taxa dos conteúdos com promessa proibida vs. sem proibida (o "~3x"). */
export function prohibitedComparison(filter: DataFilter = {}) {
  const list = getSales(filter);
  const isProhibited = (s: Sale) => hasProhibitedClaim(contentById.get(s.contentId)!);
  const withProhibited = metrics(list.filter(isProhibited));
  const withoutProhibited = metrics(list.filter((s) => !isProhibited(s)));
  return {
    withProhibited,
    withoutProhibited,
    ratio: withoutProhibited.refundRate
      ? withProhibited.refundRate / withoutProhibited.refundRate
      : null,
  };
}

// ---------------------------------------------------------------------------
// KPIs das telas
// ---------------------------------------------------------------------------
export function creatorKpis(creatorId: string) {
  const list = getSales({ creatorId });
  const m = metrics(list);
  const commission = (filterFn: (s: Sale) => boolean) =>
    list
      .filter(filterFn)
      .reduce((sum, s) => sum + productById.get(s.productId)!.price * COMMISSION_RATE, 0);
  return {
    ...m,
    commissionRate: COMMISSION_RATE,
    /** comissão das vendas que ficaram (R$) */
    commissionKept: commission((s) => !s.refunded && !s.chargeback),
    /** comissão perdida com reembolsos e chargebacks (R$) */
    commissionLost: commission((s) => s.refunded || s.chargeback),
  };
}

export function opsKpis(filter: DataFilter = {}) {
  return {
    ...metrics(getSales(filter)),
    expectationShare: expectationShare(getFeedback(filter)),
    queueSize: getEscalationQueue(filter).length,
  };
}

export function frustrationBreakdown(filter: DataFilter = {}) {
  const list = getFeedback(filter);
  return (Object.keys(FRUSTRATION_LABELS) as FrustrationType[]).map((type) => ({
    type,
    label: FRUSTRATION_LABELS[type],
    count: list.filter((f) => f.classification.type === type).length,
  }));
}

// ---------------------------------------------------------------------------
// Fila de escalonamento
// ---------------------------------------------------------------------------
/** Sem resposta → horas desde o pedido até DEMO_NOW; respondeu → horas que levou. */
export function hoursWithoutResponse(f: Feedback): number {
  if (f.producerRespondedHours == null) {
    return Math.round((NOW - new Date(f.createdAt).getTime()) / HOUR);
  }
  return f.producerRespondedHours;
}

/** "Comprador #4821": número estável derivado do id da venda, sem dado pessoal. */
export function anonymizedBuyer(saleId: string) {
  // FNV-1a: ids vizinhos geram números bem diferentes
  let h = 0x811c9dc5;
  for (const ch of saleId) h = Math.imul(h ^ ch.charCodeAt(0), 0x01000193) >>> 0;
  return `Comprador #${1000 + (h % 9000)}`;
}

export interface EscalationCase {
  feedback: Feedback;
  sale: Sale;
  content: Content;
  creator: Creator;
  product: Product;
  buyer: string;
  hoursWithoutResponse: number;
  producerResponded: boolean;
}

/**
 * Gravidade alta e (produtor sem resposta ou resposta depois de 48h).
 * O caso da demo (passo 4 da seção 2) vem sempre no topo; os demais, mais antigos primeiro.
 */
export function getEscalationQueue(filter: DataFilter = {}): EscalationCase[] {
  const isDemo = (c: EscalationCase) => (c.feedback.id === DEMO_FEEDBACK_ID ? 1 : 0);
  return getFeedback(filter)
    .filter((f) => f.classification.severity === "alta")
    .filter((f) => f.producerRespondedHours == null || f.producerRespondedHours > ESCALATION_HOURS)
    .map((f) => buildCase(f))
    .sort((a, b) => isDemo(b) - isDemo(a) || b.hoursWithoutResponse - a.hoursWithoutResponse);
}

function buildCase(f: Feedback): EscalationCase {
  const sale = saleById.get(f.saleId)!;
  return {
    feedback: f,
    sale,
    content: contentById.get(sale.contentId)!,
    creator: creatorById.get(sale.creatorId)!,
    product: productById.get(sale.productId)!,
    buyer: anonymizedBuyer(sale.id),
    hoursWithoutResponse: hoursWithoutResponse(f),
    producerResponded: f.producerRespondedHours != null,
  };
}

// ---------------------------------------------------------------------------
// Payloads da IA 3 (seção 8)
// ---------------------------------------------------------------------------
const pct = (x: number) => Math.round(x * 1000) / 10;

export function getCreatorInsightData(creatorId: string) {
  const creator = creatorById.get(creatorId);
  if (!creator) return null;
  const kpis = creatorKpis(creatorId);
  return {
    creator: { name: creator.name, style: creator.style },
    totals: {
      vendas: kpis.sales,
      reembolsos: kpis.refunds,
      taxaReembolsoPct: pct(kpis.refundRate),
      comissaoPerdida: Math.round(kpis.commissionLost),
    },
    // sem id: a IA deve citar os conteúdos pelo título
    conteudos: aggregateByContent({ creatorId }).map((a) => ({
      titulo: a.content.title,
      canal: a.content.channel,
      produto: a.product.name,
      vendas: a.sales,
      reembolsos: a.refunds,
      taxaReembolsoPct: pct(a.refundRate),
      promessas: a.content.claims.map((c) => ({ texto: c.text, status: c.status })),
    })),
  };
}

export function getCaseData(feedbackId: string) {
  const f = getFeedbackById(feedbackId);
  if (!f) return null;
  const c = buildCase(f);
  return {
    comprador: c.buyer,
    textoDoComprador: f.text,
    classificacao: f.classification,
    venda: {
      data: c.sale.createdAt,
      expectativaMarcada: c.sale.expectation ?? null,
      checkin: c.sale.checkin ?? null,
      chargeback: c.sale.chargeback,
    },
    produto: { nome: c.product.name, produtor: c.product.producer, paginaOficial: c.product.salesPageText },
    conteudoDeOrigem: {
      titulo: c.content.title,
      creator: c.creator.name,
      promessas: c.content.claims.map((cl) => ({ texto: cl.text, status: cl.status })),
    },
    horasSemRespostaDoProdutor: c.hoursWithoutResponse,
    produtorRespondeu: c.producerResponded,
  };
}
