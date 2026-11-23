import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { POST } from "../app/api/check-page/route";
import { DEMO_PRINT_PATHS } from "../lib/demo";
import { DEMO_PAGE } from "../lib/demo-page";
import { cleanCheckPage } from "../lib/schemas";

// sem chave: a chamada ao Groq falha e a rota usa o fallback (ou devolve erro)
delete process.env.GROQ_API_KEY;

const post = (body: unknown) =>
  POST(new Request("http://app.test/api/check-page", { method: "POST", body: JSON.stringify(body) }));

test("cleanCheckPage converte rewrite vazio e mantém refundRisk", () => {
  const r = cleanCheckPage({
    overallRisk: "alto",
    summary: " x ",
    claims: [
      { text: " a ", status: "sustentada", category: "conteudo", refundRisk: "baixo", evidence: "", reason: "r", rewrite: "z" },
      { text: "b", status: "proibida", category: "resultado_saude", refundRisk: "alto", evidence: "", reason: "r", rewrite: " " },
    ],
  });
  assert.equal(r.claims[0].text, "a");
  assert.equal(r.claims[0].rewrite, undefined);
  assert.equal(r.claims[0].refundRisk, "baixo");
  assert.equal(r.claims[1].rewrite, undefined);
  assert.equal(r.summary, "x");
});

test("texto da página de exemplo cai no fallback da demo", async () => {
  const text = `${DEMO_PAGE.headline}\n${DEMO_PAGE.bullets.join("\n")}`;
  const res = await post({ productId: "p_slim", text });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.source, "fallback");
  assert.equal(data.overallRisk, "alto");
  assert.ok(data.summary.length > 0);
  assert.equal(data.claims.filter((c: { status: string }) => c.status === "proibida").length, 5);
  assert.equal(data.claims.filter((c: { status: string }) => c.status === "exagerada").length, 2);
  assert.equal(data.claims.filter((c: { status: string }) => c.status === "sustentada").length, 2);
  assert.equal(data.pageText, text);
});

test("url interna é bloqueada com 422", async () => {
  const res = await post({ productId: "p_slim", url: "http://169.254.169.254/latest" });
  assert.equal(res.status, 422);
  const data = await res.json();
  assert.equal(data.code, "blocked");
  assert.equal(data.error, "Esse endereço não pode ser lido por segurança.");
});

test("url inválida volta 422 invalid_url", async () => {
  const res = await post({ productId: "p_slim", url: "javascript:alert(1)" });
  assert.equal(res.status, 422);
  assert.equal((await res.json()).code, "invalid_url");
});

test("validações de entrada", async () => {
  assert.equal((await post({ productId: "nope", text: "x".repeat(100) })).status, 404);
  assert.equal((await post({ productId: "p_slim" })).status, 400);
  assert.equal((await post({ productId: "p_slim", text: "curto" })).status, 400);
  assert.equal((await post({ productId: "p_slim", text: "a ".repeat(4000) })).status, 400);
});

const demoPrints = DEMO_PRINT_PATHS.map(
  (p) => `data:image/jpeg;base64,${readFileSync(join("public", p)).toString("base64")}`,
);

test("prints de exemplo: OCR e análise caem no plano B", async () => {
  const res = await post({ productId: "p_slim", images: demoPrints });
  assert.equal(res.status, 200);
  const data = await res.json();
  // o texto do plano B do OCR é igual ao lido pela URL: a análise reaproveita o cache da página
  assert.ok(["cache", "fallback"].includes(data.source), data.source);
  assert.equal(data.overallRisk, "alto");
  assert.ok(data.pageText.toLowerCase().includes(DEMO_PAGE.headline.toLowerCase()));
});

test("plano B reconhece a página de exemplo com título em caixa alta (texto de OCR)", async () => {
  const text = [DEMO_PAGE.headline.toUpperCase(), ...DEMO_PAGE.bullets, "POR QUE O TERMOSLIM FUNCIONA"].join("\n");
  const res = await post({ productId: "p_slim", text });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).source, "fallback");
});

test("prints inválidos → 400 com mensagem", async () => {
  const res = await post({ productId: "p_slim", images: ["data:image/gif;base64,R0lGODlh"] });
  assert.equal(res.status, 400);
  assert.ok((await res.json()).error);
});

test("print fora da demo sem IA → erro, não resultado inventado", async () => {
  const res = await post({ productId: "p_slim", images: ["data:image/png;base64,iVBORw0KGgo="] });
  assert.ok(res.status >= 500, `status ${res.status}`);
});

test("texto sem plano B e sem IA devolve erro, não resultado inventado", async () => {
  const text = "Um texto qualquer de página de vendas que não é o exemplo da demo. Ajuda na disposição para treinar.";
  const res = await post({ productId: "p_slim", text });
  assert.ok(res.status >= 500, `status ${res.status}`);
});
