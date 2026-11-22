/**
 * Gera data/sales.json e data/feedback.json a partir de products/creators/contents.
 * Determinístico: seedrandom("prometia") + datas relativas a DEMO_NOW.
 *
 * Uso: npm run seed
 *
 * Padrões da seção 7 do SPEC. Decisões registradas no plano:
 * - 1 feedback por reembolso.
 * - "~3x" = taxa dos conteúdos com promessa proibida vs. conteúdos sem proibida do mesmo produto.
 * - Contagens de vendas/reembolsos por conteúdo são fixas (abaixo), para os padrões
 *   saírem exatos mesmo com amostra pequena.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import seedrandom from "seedrandom";
import type {
  CheckinValue,
  Claim,
  Content,
  Creator,
  CreatorStyle,
  Feedback,
  FrustrationType,
  Product,
  Sale,
  Severity,
} from "../lib/types";
import {
  DEMO_CASE_HOURS,
  DEMO_CONTENT_ID,
  DEMO_FEEDBACK_ID,
  DEMO_NOW,
  DEMO_REFUND_TEXT,
  ESCALATION_HOURS,
} from "../lib/demo";

const DATA = join(__dirname, "..", "data");
const readJSON = <T>(file: string): T =>
  JSON.parse(readFileSync(join(DATA, file), "utf8")) as T;

const products = readJSON<Product[]>("products.json");
const creators = readJSON<Creator[]>("creators.json");
const contents = readJSON<Content[]>("contents.json");

const productById = new Map(products.map((p) => [p.id, p]));
const creatorById = new Map(creators.map((c) => [c.id, c]));

// ---------------------------------------------------------------------------
// Aleatoriedade determinística
// ---------------------------------------------------------------------------
const rng = seedrandom("prometia");
const rand = () => rng();
const randInt = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
function weighted<T>(items: readonly T[], weights: readonly number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rand() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------------------------------------------------------------------------
// Tempo
// ---------------------------------------------------------------------------
const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const NOW = new Date(DEMO_NOW).getTime();
const WINDOW_START = NOW - 60 * DAY;
const iso = (t: number) => new Date(Math.round(t / 60_000) * 60_000).toISOString();

// ---------------------------------------------------------------------------
// Volume por conteúdo: [vendas, reembolsos]
// exagerado ~18–22% · misto ~9–11% · cauteloso ~4–6%
// conteúdos com proibida ~3x os conteúdos sem proibida do mesmo produto
// ---------------------------------------------------------------------------
const VOLUME: Record<string, [sales: number, refunds: number]> = {
  ct_001: [40, 8], // Ana — R$10k (proibida)
  ct_002: [35, 8], // Ana — R$10k + renda garantida (proibida)
  ct_003: [25, 2], // Ana — só exageros
  ct_004: [20, 1], // Bruno
  ct_005: [20, 1], // Bruno
  ct_006: [40, 9], // Carla — seca 5kg sem dieta (proibida)
  ct_007: [25, 3], // Carla — só exageros
  ct_008: [20, 1], // Diego
  ct_009: [20, 1], // Diego
  ct_010: [24, 4], // Eva — loja pronta (proibida)
  ct_011: [18, 1], // Eva
  ct_012: [18, 1], // Eva
};

// ---------------------------------------------------------------------------
// Expectativa (página de obrigado)
// ---------------------------------------------------------------------------
const HYPE_CHIPS = new Set(["Faturar rápido", "Resultado rápido", "Emagrecer", "Largar o emprego"]);
const CHIP_WEIGHTS: Record<string, Record<CreatorStyle, number[]>> = {
  // ["Aprender a editar", "Crescer seguidores", "Faturar rápido", "Virar freelancer de edição"]
  p_reels: { exagerado: [15, 20, 50, 15], misto: [30, 25, 25, 20], cauteloso: [50, 25, 8, 17] },
  // ["Mais disposição", "Emagrecer", "Foco nos treinos", "Resultado rápido"]
  p_slim: { exagerado: [12, 45, 8, 35], misto: [25, 30, 25, 20], cauteloso: [40, 15, 40, 5] },
  // ["Montar minha loja", "Primeiras vendas", "Renda extra", "Largar o emprego"]
  p_mentor: { exagerado: [25, 15, 20, 40], misto: [35, 25, 25, 15], cauteloso: [40, 30, 25, 5] },
};
const SKIP_RATE = 0.25;

function pickExpectation(product: Product, style: CreatorStyle, boostHype: boolean) {
  if (rand() < SKIP_RATE) return undefined;
  const chips = product.expectationChips;
  const weights = CHIP_WEIGHTS[product.id][style].map((w, i) =>
    boostHype && HYPE_CHIPS.has(chips[i]) ? w * 2.5 : w,
  );
  return weighted(chips, weights);
}

// ---------------------------------------------------------------------------
// Templates de feedback
// `match` (opcional): só usa o template se alguma claim do conteúdo bater com a regex;
// a claim encontrada vira a relatedClaim.
// ---------------------------------------------------------------------------
interface Template {
  text: string;
  match?: RegExp;
}

const EXPECTATION_TEMPLATES: Record<string, Template[]> = {
  p_reels: [
    { text: "Comprei achando que ia ganhar dinheiro rápido, mas é só aula de edição básica." },
    { text: "A criadora falou em faturar 10 mil no primeiro mês. O curso não fala nada de ganhar dinheiro, é só CapCut.", match: /10 ?(mil|k)/i },
    { text: "Me prometeram renda garantida e o próprio curso diz que não garante ganho nenhum.", match: /garantid/i },
    { text: "Esperava aprender a ganhar dinheiro com Reels, recebi aula de legenda e gancho." },
    { text: "Disseram que era só postar um vídeo por dia que o algoritmo fazia o resto. Postei 30 dias seguidos e nada.", match: /algoritmo/i },
    { text: "Comprei pra fazer uma renda rápida e o curso fala em 3 meses só pra começar a crescer seguidor." },
    { text: "Vi o vídeo com print de faturamento e achei que ia sair vendendo serviço. É um curso de edição pra iniciante.", match: /fatur/i },
    { text: "Achei que ia editar igual profissional em uma semana, não é nada disso.", match: /profissional/i },
    { text: "O vídeo vende como se fosse renda, mas o conteúdo é edição de vídeo e só." },
    { text: "Esperava um método pra monetizar, recebi um curso de CapCut." },
  ],
  p_slim: [
    { text: "Falaram que eu ia secar sem dieta, a embalagem diz que precisa de dieta e treino.", match: /sem dieta/i },
    { text: "Prometeram 5kg em 2 semanas. Tomei certinho e não perdi nada.", match: /5 ?kg/i },
    { text: "A influencer disse que derretia gordura dormindo. Isso não existe.", match: /derrete/i },
    { text: "Comprei pra emagrecer e o próprio rótulo diz que sozinho ele não faz isso." },
    { text: "Disseram que não tinha contraindicação nenhuma e eu passei mal com a cafeína.", match: /contraindica/i },
    { text: "Esperava resultado rápido igual ao antes e depois do vídeo, não vi diferença." },
    { text: "Achei que era um emagrecedor, é só um pré-treino com cafeína." },
    { text: "No vídeo era 'o segredo do shape'. Pra mim só deu insônia.", match: /segredo/i },
  ],
  p_mentor: [
    { text: "Achei que a mentoria montava a loja pra mim.", match: /loja pronta/i },
    { text: "Falaram que eu ia sair com a loja pronta e vendendo. São aulas em grupo e eu tenho que fazer tudo sozinho.", match: /loja pronta/i },
    { text: "Disseram que em poucas semanas dava pra largar o emprego. Não chegou nem perto.", match: /largar o emprego/i },
    { text: "Esperava fazer as primeiras vendas no primeiro mês como mostraram, ainda não vendi nada.", match: /primeiras vendas/i },
    { text: "Paguei quase mil reais achando que iam configurar minha loja. É só aula.", match: /loja pronta/i },
    { text: "Comprei pra ter renda extra logo e o plano é de 90 dias só pra começar.", match: /renda extra/i },
    { text: "Esperava algo mais mão na massa, é muita aula teórica em grupo." },
  ],
};

const ACCESS_TEMPLATES: Template[] = [
  { text: "Não consigo acessar os módulos, aparece bloqueado." },
  { text: "Paguei e o acesso ao {produto} não chegou no meu e-mail." },
  { text: "Os vídeos não carregam no celular, fica só girando." },
  { text: "O YouClass pede login toda hora e não entra." },
  { text: "Liberaram só a primeira aula, o resto está travado." },
  { text: "As aulas travam no meio e perdem o meu progresso." },
  { text: "Não acho o {produto} na minha área de membros." },
  { text: "O áudio das aulas está fora de sincronia, impossível acompanhar." },
];

const QUALITY_DIGITAL_TEMPLATES: Template[] = [
  { text: "São só PDFs sem contexto." },
  { text: "As aulas são muito superficiais, nada que eu não ache de graça no YouTube." },
  { text: "O {produto} parece gravado às pressas, áudio ruim e sem roteiro." },
  { text: "O conteúdo é desatualizado, as telas não batem com a versão atual do app." },
  { text: "Esperava mais profundidade pelo preço que paguei." },
  { text: "Metade das aulas repete a mesma coisa." },
  { text: "Material confuso, pula etapas importantes." },
  { text: "Não tem ninguém pra tirar dúvida, fico perdido." },
];

const QUALITY_PHYSICAL_TEMPLATES: Template[] = [
  { text: "As cápsulas vieram grudadas e com cheiro estranho." },
  { text: "O pote chegou com o lacre rompido." },
  { text: "Me deu dor de estômago logo na primeira semana." },
  { text: "A validade vence mês que vem, não dá tempo de usar." },
];

const DELIVERY_TEMPLATES: Template[] = [
  { text: "Já faz 20 dias e não chegou nem o código de rastreio." },
  { text: "O rastreio está parado há uma semana." },
  { text: "Chegou o produto errado." },
  { text: "Comprei o kit e veio só um pote." },
  { text: "O pedido consta como entregue, mas eu não recebi." },
  { text: "A caixa chegou amassada e o pote aberto." },
  { text: "O prazo era de 7 dias e já são 25." },
  { text: "Não consigo falar com ninguém sobre a entrega." },
];

const REGRET_TEMPLATES: Template[] = [
  { text: "Comprei por impulso e preciso do dinheiro." },
  { text: "Não vou ter tempo de fazer o {produto} agora." },
  { text: "Comprei sem conversar com a minha família e eles não concordaram." },
  { text: "Me arrependi, estava passando por um momento difícil." },
  { text: "Achei caro depois de pensar melhor." },
  { text: "Já tenho algo parecido, comprei sem pensar." },
  { text: "Perdi o emprego e preciso cancelar." },
  { text: "Mudei de ideia, não é o momento." },
];

// Escolha sem repetição enquanto houver templates não usados.
const usedTemplates = new Set<Template>();
function pickTemplate(pool: Template[]): Template {
  const fresh = pool.filter((t) => !usedTemplates.has(t));
  const t = pick(fresh.length ? fresh : pool);
  usedTemplates.add(t);
  return t;
}

// ---------------------------------------------------------------------------
// Classificação dos feedbacks do seed (dado fictício, preenchido pelo script)
// ---------------------------------------------------------------------------
const STATUS_RANK = { sustentada: 0, exagerada: 1, proibida: 2 } as const;
const worstStatus = (claims: Claim[]) =>
  claims.reduce<Claim["status"]>(
    (w, c) => (STATUS_RANK[c.status] > STATUS_RANK[w] ? c.status : w),
    "sustentada",
  );
const riskiestClaim = (claims: Claim[]) =>
  [...claims].sort((a, b) => STATUS_RANK[b.status] - STATUS_RANK[a.status])[0];
const hasProhibited = (c: Content) => c.claims.some((cl) => cl.status === "proibida");

function pickFrustrationType(content: Content, product: Product): FrustrationType {
  const worst = worstStatus(content.claims);
  const pExpect = worst === "proibida" ? 0.75 : worst === "exagerada" ? 0.45 : 0.15;
  if (rand() < pExpect) return "expectativa_desalinhada";
  const others: FrustrationType[] = ["qualidade_conteudo", "arrependimento_pessoal"];
  if (product.hasYouClass) others.push("acesso_tecnico");
  if (product.type === "suplemento") others.push("entrega_logistica");
  return pick(others);
}

function pickSeverity(type: FrustrationType, prohibited: boolean, chargeback: boolean): Severity {
  if (chargeback) return "alta";
  const levels: Severity[] = ["baixa", "media", "alta"];
  switch (type) {
    case "expectativa_desalinhada":
      return weighted(levels, prohibited ? [10, 35, 55] : [30, 50, 20]);
    case "acesso_tecnico":
      return weighted(levels, [40, 50, 10]);
    case "qualidade_conteudo":
      return weighted(levels, [30, 60, 10]);
    case "entrega_logistica":
      return weighted(levels, [20, 50, 30]);
    case "arrependimento_pessoal":
      return weighted(levels, [80, 20, 0]);
  }
}

function buildFeedbackText(type: FrustrationType, content: Content, product: Product) {
  let template: Template;
  let relatedClaim: string | undefined;

  if (type === "expectativa_desalinhada") {
    const pool = EXPECTATION_TEMPLATES[product.id];
    const matching = pool.filter((t) => t.match && content.claims.some((c) => t.match!.test(c.text)));
    const generic = pool.filter((t) => !t.match);
    // conteúdo com promessa de risco → a reclamação costuma citar a promessa
    const preferMatching = matching.length > 0 && rand() < 0.75;
    template = pickTemplate(preferMatching ? matching : generic);
    const matched = template.match && content.claims.find((c) => template.match!.test(c.text));
    if (matched) relatedClaim = matched.text;
    else if (worstStatus(content.claims) !== "sustentada") relatedClaim = riskiestClaim(content.claims).text;
  } else {
    const pool =
      type === "acesso_tecnico"
        ? ACCESS_TEMPLATES
        : type === "entrega_logistica"
          ? DELIVERY_TEMPLATES
          : type === "qualidade_conteudo"
            ? product.type === "suplemento"
              ? QUALITY_PHYSICAL_TEMPLATES
              : QUALITY_DIGITAL_TEMPLATES
            : REGRET_TEMPLATES;
    template = pickTemplate(pool);
  }

  return { text: template.text.replaceAll("{produto}", product.name), relatedClaim };
}

function buildSummary(type: FrustrationType, product: Product, relatedClaim?: string) {
  switch (type) {
    case "expectativa_desalinhada":
      return relatedClaim
        ? `A expectativa criada pela promessa "${relatedClaim}" não corresponde ao que ${product.name} entrega segundo a página oficial.`
        : `O comprador esperava mais do que ${product.name} oferece segundo a página oficial.`;
    case "acesso_tecnico":
      return `O comprador não consegue acessar o conteúdo de ${product.name}; parece um problema técnico que dá para resolver sem reembolso.`;
    case "qualidade_conteudo":
      return product.type === "suplemento"
        ? `O comprador relata problema na qualidade do produto físico recebido (${product.name}).`
        : `O comprador considera o conteúdo de ${product.name} abaixo do esperado.`;
    case "entrega_logistica":
      return `O pedido de ${product.name} teve problema na entrega.`;
    case "arrependimento_pessoal":
      return "Desistência por motivo pessoal, sem relação com a promessa do conteúdo.";
  }
}

// ---------------------------------------------------------------------------
// Geração
// ---------------------------------------------------------------------------
interface DraftSale extends Omit<Sale, "id"> {
  t: number;
  isDemo?: boolean;
}

const drafts: DraftSale[] = [];

for (const content of contents) {
  const product = productById.get(content.productId)!;
  const creator = creatorById.get(content.creatorId)!;
  const [nSales, nRefunds] = VOLUME[content.id];
  const start = Math.max(WINDOW_START, new Date(content.publishedAt).getTime());
  const prohibited = hasProhibited(content);

  const indices = shuffle([...Array(nSales).keys()]);
  const refundIdx = new Set(indices.slice(0, nRefunds));
  const demoIdx = content.id === DEMO_CONTENT_ID ? indices[0] : -1;

  for (let i = 0; i < nSales; i++) {
    const refunded = refundIdx.has(i);
    const isDemo = i === demoIdx;
    drafts.push({
      t: start + rand() * (NOW - start),
      contentId: content.id,
      productId: product.id,
      creatorId: creator.id,
      createdAt: "",
      expectation: isDemo
        ? "Faturar rápido"
        : pickExpectation(product, creator.style, refunded && prohibited),
      refunded,
      chargeback: false,
      isDemo,
    });
  }
}

// Check-in: ~70% dos reembolsos com check-in negativo antes; chargeback: ~10% dos reembolsos.
const refundedDrafts = drafts.filter((d) => d.refunded);
const demoDraft = refundedDrafts.find((d) => d.isDemo)!;
const otherRefunds = shuffle(refundedDrafts.filter((d) => !d.isDemo));
const nNegative = Math.round(refundedDrafts.length * 0.7) - 1; // -1: o caso da demo já é negativo
const nChargeback = Math.round(refundedDrafts.length * 0.1);

demoDraft.checkin = "negativo";
otherRefunds.forEach((d, i) => {
  d.checkin = i < nNegative ? "negativo" : rand() < 0.5 ? "neutro" : undefined;
});
shuffle(otherRefunds)
  .slice(0, nChargeback)
  .forEach((d) => (d.chargeback = true));

for (const d of drafts.filter((d) => !d.refunded)) {
  d.checkin = weighted<CheckinValue | undefined>(
    ["positivo", "neutro", "negativo", undefined],
    [55, 20, 7, 18],
  );
}

// Tempo de resposta do produtor: 70% <24h, 15% 24–72h, 15% sem resposta.
type Response = { hours: number | null };
const nNull = Math.round(refundedDrafts.length * 0.15) - 1; // -1: a demo já é "sem resposta"
const nSlow = Math.round(refundedDrafts.length * 0.15);
const responseFor = new Map<DraftSale, Response>();
responseFor.set(demoDraft, { hours: null });
shuffle(otherRefunds).forEach((d, i) => {
  if (i < nNull) responseFor.set(d, { hours: null });
  else if (i < nNull + nSlow) responseFor.set(d, { hours: randInt(24, 72) });
  else responseFor.set(d, { hours: randInt(1, 23) });
});

// Data do pedido de reembolso, coerente com a venda e com o tempo de resposta.
const feedbackTime = new Map<DraftSale, number>();
for (const d of refundedDrafts) {
  const { hours } = responseFor.get(d)!;
  let ft: number;
  if (d.isDemo) {
    ft = NOW - DEMO_CASE_HOURS * HOUR;
    d.t = ft - 3 * DAY;
  } else if (hours === null) {
    // sem resposta: caso recente (6h a 5 dias), senão a fila mostraria centenas de horas
    ft = NOW - randInt(6, 120) * HOUR;
    d.t = Math.max(WINDOW_START, ft - randInt(1, 6) * DAY);
  } else {
    ft = Math.min(d.t + randInt(12, 7 * 24) * HOUR, NOW - (hours + 1) * HOUR);
    if (ft <= d.t) d.t = Math.max(WINDOW_START, ft - randInt(1, 3) * DAY);
  }
  feedbackTime.set(d, ft);
}

// Ordena por data e atribui ids.
drafts.sort((a, b) => a.t - b.t);
const sales: Sale[] = drafts.map((d, i) => {
  const sale: Sale = {
    id: `s_${String(i + 1).padStart(4, "0")}`,
    contentId: d.contentId,
    productId: d.productId,
    creatorId: d.creatorId,
    createdAt: iso(d.t),
    refunded: d.refunded,
    chargeback: d.chargeback,
  };
  if (d.expectation) sale.expectation = d.expectation;
  if (d.checkin) sale.checkin = d.checkin;
  return sale;
});
const saleIdOf = new Map(drafts.map((d, i) => [d, sales[i].id]));

const feedbackDrafts = refundedDrafts
  .map((d) => ({ d, ft: feedbackTime.get(d)! }))
  .sort((a, b) => a.ft - b.ft);

let fbCounter = 0;
const feedback: Feedback[] = feedbackDrafts.map(({ d, ft }) => {
  const content = contents.find((c) => c.id === d.contentId)!;
  const product = productById.get(d.productId)!;
  const { hours } = responseFor.get(d)!;

  if (d.isDemo) {
    const claim = content.claims.find((c) => /10 ?(mil|k)/i.test(c.text))!;
    return {
      id: DEMO_FEEDBACK_ID,
      saleId: saleIdOf.get(d)!,
      text: DEMO_REFUND_TEXT,
      classification: {
        type: "expectativa_desalinhada",
        severity: "alta",
        relatedClaim: claim.text,
        summary: buildSummary("expectativa_desalinhada", product, claim.text),
      },
      producerRespondedHours: null,
      createdAt: iso(ft),
    };
  }

  const type = pickFrustrationType(content, product);
  const { text, relatedClaim } = buildFeedbackText(type, content, product);
  const severity = pickSeverity(type, hasProhibited(content), d.chargeback);
  const fb: Feedback = {
    id: `fb_${String(++fbCounter).padStart(3, "0")}`,
    saleId: saleIdOf.get(d)!,
    text,
    classification: { type, severity, summary: buildSummary(type, product, relatedClaim) },
    producerRespondedHours: hours,
    createdAt: iso(ft),
  };
  if (relatedClaim) fb.classification.relatedClaim = relatedClaim;
  return fb;
});

writeFileSync(join(DATA, "sales.json"), JSON.stringify(sales, null, 2) + "\n");
writeFileSync(join(DATA, "feedback.json"), JSON.stringify(feedback, null, 2) + "\n");

// ---------------------------------------------------------------------------
// Relatório: confere os padrões da seção 7
// ---------------------------------------------------------------------------
const pct = (n: number, d: number) => (d ? (100 * n) / d : 0);
const fmt = (x: number) => `${x.toFixed(1)}%`;
const mark = (ok: boolean) => (ok ? "✅" : "❌");
const between = (x: number, lo: number, hi: number) => x >= lo && x <= hi;
let failures = 0;
const check = (label: string, ok: boolean, detail: string) => {
  if (!ok) failures++;
  console.log(`${mark(ok)} ${label.padEnd(52)} ${detail}`);
};
const rate = (list: Sale[]) => pct(list.filter((s) => s.refunded).length, list.length);
const styleOf = (s: Sale) => creatorById.get(s.creatorId)!.style;
const contentById = new Map(contents.map((c) => [c.id, c]));

console.log(`\nGerados: ${sales.length} vendas · ${feedback.length} feedbacks\n`);

console.log("Taxa de reembolso por estilo");
const ranges: Record<CreatorStyle, [number, number]> = {
  exagerado: [18, 22],
  misto: [9, 11],
  cauteloso: [4, 6],
};
for (const style of ["exagerado", "misto", "cauteloso"] as const) {
  const list = sales.filter((s) => styleOf(s) === style);
  const r = rate(list);
  check(`  ${style}`, between(r, ...ranges[style]), `${fmt(r)} (alvo ${ranges[style].join("–")}%)`);
}

console.log("\nConteúdos com promessa proibida vs. sem proibida (mesmo produto, alvo ~3x)");
for (const p of products) {
  const ofProduct = sales.filter((s) => s.productId === p.id);
  const withP = ofProduct.filter((s) => hasProhibited(contentById.get(s.contentId)!));
  const without = ofProduct.filter((s) => !hasProhibited(contentById.get(s.contentId)!));
  const ratio = rate(withP) / rate(without);
  check(
    `  ${p.name}`,
    between(ratio, 2.5, 3.6),
    `${fmt(rate(withP))} vs ${fmt(rate(without))} → ${ratio.toFixed(1)}x (média do produto ${fmt(rate(ofProduct))})`,
  );
}

console.log("\nPor conteúdo");
for (const c of contents) {
  const list = sales.filter((s) => s.contentId === c.id);
  console.log(
    `   ${c.id} ${creatorById.get(c.creatorId)!.name.padEnd(14)} ${worstStatus(c.claims).padEnd(10)} ${String(list.length).padStart(3)} vendas  ${fmt(rate(list)).padStart(6)}`,
  );
}

console.log("\nExpectativa marcada (chips de pressa/ganho)");
const hypeShare = (style: CreatorStyle) => {
  const list = sales.filter((s) => styleOf(s) === style && s.expectation);
  return pct(list.filter((s) => HYPE_CHIPS.has(s.expectation!)).length, list.length);
};
const hExag = hypeShare("exagerado");
const hMisto = hypeShare("misto");
const hCaut = hypeShare("cauteloso");
check("  exagerado marca mais pressa/ganho", hExag > 2 * hCaut && hExag > hMisto,
  `exagerado ${fmt(hExag)} · misto ${fmt(hMisto)} · cauteloso ${fmt(hCaut)}`);

const refunds = sales.filter((s) => s.refunded);
console.log("\nCheck-in e chargeback");
const negShare = pct(refunds.filter((s) => s.checkin === "negativo").length, refunds.length);
check("  reembolsos com check-in negativo antes", between(negShare, 65, 75), `${fmt(negShare)} (alvo ~70%)`);
const cbShare = pct(refunds.filter((s) => s.chargeback).length, refunds.length);
check("  chargeback entre os reembolsos", between(cbShare, 8, 12), `${fmt(cbShare)} (alvo ~10%)`);

console.log("\nDatas");
const times = sales.map((s) => new Date(s.createdAt).getTime());
check("  vendas nos últimos 60 dias", Math.min(...times) >= WINDOW_START && Math.max(...times) <= NOW,
  `${sales[0].createdAt.slice(0, 10)} → ${sales[sales.length - 1].createdAt.slice(0, 10)}`);
const fbOk = feedback.every((f) => {
  const sale = sales.find((s) => s.id === f.saleId)!;
  return f.createdAt >= sale.createdAt && new Date(f.createdAt).getTime() <= NOW;
});
check("  reembolso sempre depois da venda", fbOk, "");

console.log("\nResposta do produtor");
const fast = feedback.filter((f) => f.producerRespondedHours != null && f.producerRespondedHours < 24).length;
const slow = feedback.filter((f) => f.producerRespondedHours != null && f.producerRespondedHours >= 24).length;
const none = feedback.filter((f) => f.producerRespondedHours === null).length;
check("  <24h / 24–72h / sem resposta",
  between(pct(fast, feedback.length), 65, 75) && between(pct(slow, feedback.length), 10, 20) && between(pct(none, feedback.length), 10, 20),
  `${fmt(pct(fast, feedback.length))} / ${fmt(pct(slow, feedback.length))} / ${fmt(pct(none, feedback.length))} (alvo 70/15/15)`);

console.log("\nFeedbacks");
check("  1 feedback por reembolso", feedback.length === refunds.length, `${feedback.length} feedbacks · ${refunds.length} reembolsos`);
const byType = new Map<string, number>();
feedback.forEach((f) => byType.set(f.classification.type, (byType.get(f.classification.type) ?? 0) + 1));
console.log(`   tipos: ${[...byType].map(([k, v]) => `${k} ${v}`).join(" · ")}`);
const distinctTexts = new Set(feedback.map((f) => f.text)).size;
console.log(`   textos distintos: ${distinctTexts}/${feedback.length}`);

console.log("\nFila de escalonamento (gravidade alta e produtor sem resposta ou >48h)");
const hoursWithout = (f: Feedback) =>
  f.producerRespondedHours == null
    ? Math.round((NOW - new Date(f.createdAt).getTime()) / HOUR)
    : f.producerRespondedHours;
const queue = feedback
  .filter((f) => f.classification.severity === "alta")
  .filter((f) => f.producerRespondedHours == null || f.producerRespondedHours > ESCALATION_HOURS)
  .sort((a, b) => hoursWithout(b) - hoursWithout(a));
for (const f of queue) {
  const sale = sales.find((s) => s.id === f.saleId)!;
  console.log(`   ${f.id.padEnd(8)} ${sale.contentId} ${String(hoursWithout(f)).padStart(4)}h ${f.producerRespondedHours == null ? "sem resposta" : "respondeu tarde"}  ${f.classification.type}`);
}
const demoInQueue = queue.find((f) => f.id === DEMO_FEEDBACK_ID);
check("  caso da demo na fila com 52h", !!demoInQueue && hoursWithout(demoInQueue) === DEMO_CASE_HOURS,
  `${queue.length} casos na fila`);

console.log(failures ? `\n${failures} verificação(ões) falharam.` : "\nTodos os padrões da seção 7 conferem.");
if (failures) process.exitCode = 1;
