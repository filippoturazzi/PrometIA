/**
 * Avalia a consistência da IA 1 e da IA 2 com chamadas reais (sem cache).
 * Uso: npm run eval-demo [-- N [filtro]]   (N = repetições; filtro = trecho do nome do caso)
 *
 * Respeita o limite do plano gratuito do Groq (8.000 tokens/min) espaçando as chamadas
 * e esperando quando recebe 429.
 */
import Groq from "groq-sdk";
import { runCheckClaims, runClassifyFeedback } from "../lib/ai";
import { getContent, getProduct } from "../lib/data";
import { DEMO_CONTENT_ID, DEMO_REFUND_TEXT, DEMO_SCRIPT } from "../lib/demo";
import { groqModel } from "../lib/groq";
import type { CheckClaimsResult, ClassifyFeedbackResult } from "../lib/schemas";
import type { ClaimStatus } from "../lib/types";

const N = Number(process.argv[2] ?? 6);
const FILTER = process.argv[3]?.toLowerCase();
const selected = (label: string) => !FILTER || label.toLowerCase().includes(FILTER);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function withRateLimit<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (err instanceof Groq.APIError && err.status === 429 && attempt < 3) {
        process.stdout.write(" [429, aguardando 25s]");
        await sleep(25_000);
        continue;
      }
      throw err;
    }
  }
}

type Check<T> = (r: T) => string[]; // devolve a lista de problemas

interface Case<T> {
  label: string;
  runs: number;
  gapMs: number;
  run: () => Promise<T>;
  check: Check<T>;
  show: (r: T) => string;
}

const expectClaims =
  (expected: [RegExp, ClaimStatus][], forbid: ClaimStatus[] = []): Check<CheckClaimsResult> =>
  (r) => [
    ...expected
      .filter(([re, st]) => !r.claims.some((c) => re.test(c.text) && c.status === st))
      .map(([re, st]) => `faltou ${re} como ${st}`),
    ...forbid.filter((st) => r.claims.some((c) => c.status === st)).map((st) => `não devia ter ${st}`),
  ];

const showClaims = (r: CheckClaimsResult) =>
  `${r.overallRisk} | ` + r.claims.map((c) => `${c.status[0].toUpperCase()}:${c.text.slice(0, 34)}`).join(" | ");

const showFeedback = (r: ClassifyFeedbackResult) =>
  `${r.type} · ${r.severity} · rel=${r.relatedClaim ? `"${r.relatedClaim.slice(0, 30)}…"` : "—"} · ajuda=${r.helpOffer ? `"${r.helpOffer.slice(0, 60)}"` : "não"}`;

const reels = getProduct("p_reels")!;
const slim = getProduct("p_slim")!;
const mentor = getProduct("p_mentor")!;
const demoContent = getContent(DEMO_CONTENT_ID)!;

const ia1: Case<CheckClaimsResult>[] = [
  {
    label: "IA 1 · roteiro da demo",
    runs: N,
    gapMs: 12_000,
    run: () => runCheckClaims(reels, DEMO_SCRIPT),
    check: expectClaims([
      [/10 mil/i, "proibida"],
      [/algoritmo/i, "exagerada"],
      [/6 módulos/i, "sustentada"],
    ]),
    show: showClaims,
  },
  {
    label: "IA 1 · Carla (seca 5kg)",
    runs: FILTER ? N : 2,
    gapMs: 12_000,
    run: () => runCheckClaims(slim, getContent("ct_006")!.script),
    check: expectClaims([[/5 ?kg/i, "proibida"]]),
    show: showClaims,
  },
  {
    label: "IA 1 · Eva (loja pronta)",
    runs: FILTER ? N : 2,
    gapMs: 12_000,
    run: () => runCheckClaims(mentor, getContent("ct_010")!.script),
    check: expectClaims([[/loja pronta/i, "proibida"]]),
    show: showClaims,
  },
  {
    label: "IA 1 · Bruno (cauteloso)",
    runs: FILTER ? N : 2,
    gapMs: 12_000,
    run: () => runCheckClaims(reels, getContent("ct_004")!.script),
    check: expectClaims([[/6 módulos/i, "sustentada"]], ["proibida"]),
    show: showClaims,
  },
];

const ia2: Case<ClassifyFeedbackResult>[] = [
  {
    label: "IA 2 · reembolso da demo",
    runs: N,
    gapMs: 5_000,
    run: () => runClassifyFeedback(reels, demoContent, DEMO_REFUND_TEXT, "Não era o que eu esperava"),
    check: (r) => [
      ...(r.type === "expectativa_desalinhada" ? [] : [`tipo ${r.type}`]),
      ...(r.severity === "alta" ? [] : [`gravidade ${r.severity}`]),
      ...(/10 mil/i.test(r.relatedClaim ?? "") ? [] : ["sem a promessa de R$10 mil"]),
      ...(r.helpOffer ? ["não devia oferecer ajuda no lugar do reembolso"] : []),
    ],
    show: showFeedback,
  },
  {
    label: "IA 2 · acesso travado",
    runs: FILTER ? N : 2,
    gapMs: 5_000,
    run: () =>
      runClassifyFeedback(reels, demoContent, "Não consigo acessar os módulos, aparece tudo bloqueado.", "Não consigo acessar o conteúdo"),
    check: (r) => [
      ...(r.type === "acesso_tecnico" ? [] : [`tipo ${r.type}`]),
      ...(r.helpOffer ? [] : ["sem oferta de ajuda"]),
      ...(r.relatedClaim ? ["não devia ter promessa relacionada"] : []),
    ],
    show: showFeedback,
  },
  {
    label: "IA 2 · arrependimento",
    runs: FILTER ? N : 2,
    gapMs: 5_000,
    run: () => runClassifyFeedback(reels, demoContent, "Comprei por impulso e agora preciso do dinheiro.", "Me arrependi da compra"),
    check: (r) => [
      ...(r.type === "arrependimento_pessoal" ? [] : [`tipo ${r.type}`]),
      ...(r.severity === "alta" ? [`gravidade ${r.severity}`] : []),
    ],
    show: showFeedback,
  },
];

async function evaluate<T>(c: Case<T>) {
  console.log(`\n${c.label}`);
  let ok = 0;
  const times: number[] = [];
  for (let i = 0; i < c.runs; i++) {
    if (i) await sleep(c.gapMs);
    const t = Date.now();
    process.stdout.write(`  #${i + 1}`);
    try {
      const r = await withRateLimit(c.run);
      const ms = Date.now() - t;
      times.push(ms);
      const problems = c.check(r);
      if (!problems.length) ok++;
      console.log(` ${(ms / 1000).toFixed(1)}s ${problems.length ? "❌ " + problems.join("; ") : "✅"}  ${c.show(r)}`);
    } catch (err) {
      console.log(` ❌ erro: ${(err instanceof Error ? err.message : String(err)).slice(0, 120)}`);
    }
  }
  const avg = times.length ? times.reduce((a, b) => a + b, 0) / times.length / 1000 : 0;
  return { label: c.label, ok, runs: c.runs, avg };
}

async function main() {
  console.log(`modelo ${groqModel()} · reasoning_effort ${process.env.GROQ_REASONING_EFFORT ?? "medium"} · N=${N}`);
  const results = [];
  for (const c of ia1) if (selected(c.label)) results.push(await evaluate(c));
  for (const c of ia2) if (selected(c.label)) results.push(await evaluate(c));

  console.log("\nResumo");
  for (const r of results) {
    console.log(`  ${r.ok === r.runs ? "✅" : "❌"} ${r.label.padEnd(30)} ${r.ok}/${r.runs}  média ${r.avg.toFixed(1)}s`);
  }
  if (results.some((r) => r.ok < r.runs)) process.exitCode = 1;
}

main();
