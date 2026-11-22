/**
 * Confere as agregações de lib/data.ts.
 * Uso: npx tsx --conditions=react-server --tsconfig tsconfig.json scripts/check-data.ts
 */
import {
  aggregateByContent,
  aggregateByCreator,
  aggregateByProduct,
  aggregateByStyle,
  creatorKpis,
  frustrationBreakdown,
  getCaseData,
  getCreatorInsightData,
  getEscalationQueue,
  opsKpis,
  prohibitedComparison,
} from "../lib/data";
import { DEMO_CASE_HOURS, DEMO_CREATOR_ID, DEMO_FEEDBACK_ID } from "../lib/demo";

const p = (x: number) => `${(x * 100).toFixed(1)}%`;
let failures = 0;
const check = (label: string, ok: boolean) => {
  if (!ok) failures++;
  console.log(`${ok ? "✅" : "❌"} ${label}`);
};

console.log("\nPor estilo");
for (const s of aggregateByStyle()) console.log(`  ${s.style.padEnd(10)} ${p(s.refundRate)}`);

console.log("\nPor produto");
for (const a of aggregateByProduct())
  console.log(`  ${a.product.name.padEnd(24)} vendas ${a.sales} · taxa ${p(a.refundRate)} · expectativa ${p(a.expectationShare)} · proibidas ativas ${a.activeProhibitedClaims} (${a.activeProhibitedContents} conteúdos)`);

console.log("\nPor creator");
for (const a of aggregateByCreator())
  console.log(`  ${a.creator.name.padEnd(14)} vendas ${a.sales} · taxa ${p(a.refundRate)} · expectativa ${p(a.expectationShare)} · proibidas ${a.activeProhibitedClaims}`);

console.log("\nConteúdos da Ana");
for (const a of aggregateByContent({ creatorId: DEMO_CREATOR_ID }))
  console.log(`  ${a.content.id} ${a.worstStatus.padEnd(10)} ${p(a.refundRate)}  maior risco: "${a.riskiestClaim?.text}"`);

const cmp = prohibitedComparison();
console.log(`\nCom proibida ${p(cmp.withProhibited.refundRate)} vs sem ${p(cmp.withoutProhibited.refundRate)} → ${cmp.ratio?.toFixed(1)}x`);

const k = creatorKpis(DEMO_CREATOR_ID);
console.log(`\nKPIs Ana: vendas ${k.sales} · taxa ${p(k.refundRate)} · vendas que ficam ${k.keptSales} · comissão R$ ${k.commissionKept.toFixed(0)} preservada / R$ ${k.commissionLost.toFixed(0)} perdida`);

const ops = opsKpis();
console.log(`KPIs Operações: vendas que ficam ${ops.keptSales} · taxa ${p(ops.refundRate)} · expectativa ${p(ops.expectationShare)} · fila ${ops.queueSize}`);
console.log(`KPIs Studio Viral: fila ${opsKpis({ producer: "Studio Viral" }).queueSize}`);

console.log("\nTipos de frustração");
for (const f of frustrationBreakdown()) console.log(`  ${f.label.padEnd(26)} ${f.count}`);

console.log("\nFila de escalonamento");
const queue = getEscalationQueue();
for (const c of queue)
  console.log(`  ${c.feedback.id.padEnd(8)} ${c.buyer} · ${c.product.name} · ${c.creator.name}/${c.content.id} · ${c.hoursWithoutResponse}h`);

const demo = queue.find((c) => c.feedback.id === DEMO_FEEDBACK_ID);
console.log("");
check("caso da demo na fila", !!demo);
check(`caso da demo com ${DEMO_CASE_HOURS}h sem resposta`, demo?.hoursWithoutResponse === DEMO_CASE_HOURS);
check("relatedClaim do caso da demo é a promessa de R$10k", /10 mil/.test(demo?.feedback.classification.relatedClaim ?? ""));
check("conteúdos com proibida ~3x (2.5–3.6)", !!cmp.ratio && cmp.ratio >= 2.5 && cmp.ratio <= 3.6);
check("payload IA 3 creator", getCreatorInsightData(DEMO_CREATOR_ID)?.conteudos.length === 3);
check("payload IA 3 case", getCaseData(DEMO_FEEDBACK_ID)?.horasSemRespostaDoProdutor === DEMO_CASE_HOURS);

if (failures) process.exitCode = 1;
