import { test } from "node:test";
import assert from "node:assert/strict";
import { MAX_TEXT_CHARS, extractVisibleText, fetchPageText, parsePageUrl } from "../lib/page-scan";

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
function fakeFetch(map: Record<string, Response>): typeof fetch {
  return (async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const res = map[url];
    if (!res) throw new Error(`URL inesperada no teste: ${url}`);
    return res;
  }) as typeof fetch;
}
const html200 = (body: string) =>
  new Response(body, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } });
const redirect = (location: string) => new Response(null, { status: 302, headers: { location } });

// ---------------------------------------------------------------------------
// parsePageUrl
// ---------------------------------------------------------------------------
test("parsePageUrl completa https quando falta o esquema", () => {
  assert.equal(parsePageUrl("minhaloja.com.br/oferta", "app.test").href, "https://minhaloja.com.br/oferta");
});

test("parsePageUrl recusa esquemas que não são http(s)", () => {
  for (const u of ["ftp://x.com", "file:///etc/passwd", "javascript:alert(1)", ""])
    assert.throws(() => parsePageUrl(u, "app.test"), { code: "invalid_url" }, u);
});

test("parsePageUrl bloqueia endereços internos", () => {
  for (const u of [
    "http://localhost:3000/x",
    "http://127.0.0.1/",
    "http://10.0.0.5/",
    "http://192.168.1.1/",
    "http://172.16.0.1/",
    "http://169.254.169.254/latest",
    "http://[::1]/",
    "http://0.0.0.0/",
    "http://[fd00::1]/",
  ])
    assert.throws(() => parsePageUrl(u, "app.test"), { code: "blocked" }, u);
});

test("parsePageUrl libera o próprio host do app, mesmo local", () => {
  assert.equal(parsePageUrl("http://localhost:3000/paginavendas", "localhost:3000").pathname, "/paginavendas");
});

// ---------------------------------------------------------------------------
// extractVisibleText
// ---------------------------------------------------------------------------
test("extractVisibleText remove scripts, estilos e data-prometia-ignore", () => {
  const html = `<html><head><title>Título</title><style>.a{}</style></head><body>
    <div data-prometia-ignore>Página fictícia</div><script>var x=1</script>
    <h1>Seque rápido</h1><p>Sem dieta</p><span data-prometia-ignore="">00:14:59</span><!-- comentário --></body></html>`;
  const t = extractVisibleText(html);
  assert.match(t, /Seque rápido/);
  assert.match(t, /Sem dieta/);
  assert.doesNotMatch(t, /fictícia|var x|\.a\{|00:14:59|<|Título|comentário/);
});

test("extractVisibleText decodifica entidades e acentos", () => {
  assert.equal(
    extractVisibleText("<p>Caf&eacute;&nbsp;&amp; ch&#225; verde &atilde;o &#x2014; ok</p>"),
    "Café & chá verde ão — ok",
  );
});

test("extractVisibleText separa blocos em linhas", () => {
  assert.equal(extractVisibleText("<h1>Um</h1><p>Dois</p><li>Três</li>"), "Um\nDois\nTrês");
});

test("extractVisibleText corta em MAX_TEXT_CHARS", () => {
  assert.ok(extractVisibleText(`<p>${"a ".repeat(10000)}</p>`).length <= MAX_TEXT_CHARS);
});

// ---------------------------------------------------------------------------
// fetchPageText
// ---------------------------------------------------------------------------
test("fetchPageText devolve o texto de uma página html", async () => {
  const fetchImpl = fakeFetch({ "https://loja.test/": html200(`<p>${"Promessa forte. ".repeat(10)}</p>`) });
  const t = await fetchPageText(new URL("https://loja.test/"), { appHost: "app.test", fetchImpl });
  assert.match(t, /Promessa forte/);
});

test("fetchPageText segue redirect público", async () => {
  const fetchImpl = fakeFetch({
    "http://loja.test/": redirect("https://loja.test/oferta"),
    "https://loja.test/oferta": html200(`<p>${"Oferta especial. ".repeat(10)}</p>`),
  });
  assert.match(await fetchPageText(new URL("http://loja.test/"), { appHost: "app.test", fetchImpl }), /Oferta/);
});

test("fetchPageText bloqueia redirect para endereço interno", async () => {
  const fetchImpl = fakeFetch({ "https://loja.test/": redirect("http://127.0.0.1/admin") });
  await assert.rejects(fetchPageText(new URL("https://loja.test/"), { appHost: "app.test", fetchImpl }), {
    code: "blocked",
  });
});

test("fetchPageText: redirects demais viram fetch_failed", async () => {
  const fetchImpl = fakeFetch({
    "https://a.test/": redirect("https://a.test/1"),
    "https://a.test/1": redirect("https://a.test/2"),
    "https://a.test/2": redirect("https://a.test/3"),
    "https://a.test/3": redirect("https://a.test/4"),
  });
  await assert.rejects(fetchPageText(new URL("https://a.test/"), { appHost: "app.test", fetchImpl }), {
    code: "fetch_failed",
  });
});

test("fetchPageText: página só com JS vira unreadable", async () => {
  const fetchImpl = fakeFetch({ "https://spa.test/": html200(`<div id="root"></div><script>app()</script>`) });
  await assert.rejects(fetchPageText(new URL("https://spa.test/"), { appHost: "app.test", fetchImpl }), {
    code: "unreadable",
  });
});

test("fetchPageText recusa conteúdo que não é html", async () => {
  const fetchImpl = fakeFetch({
    "https://x.test/": new Response("%PDF", { headers: { "content-type": "application/pdf" } }),
  });
  await assert.rejects(fetchPageText(new URL("https://x.test/"), { appHost: "a", fetchImpl }), { code: "not_html" });
});

test("fetchPageText recusa corpo grande demais", async () => {
  const fetchImpl = fakeFetch({ "https://x.test/": html200("a".repeat(2000)) });
  await assert.rejects(fetchPageText(new URL("https://x.test/"), { appHost: "a", fetchImpl, maxBytes: 1000 }), {
    code: "too_large",
  });
});

test("fetchPageText: status de erro vira fetch_failed", async () => {
  const fetchImpl = fakeFetch({ "https://x.test/": new Response("nope", { status: 404 }) });
  await assert.rejects(fetchPageText(new URL("https://x.test/"), { appHost: "a", fetchImpl }), {
    code: "fetch_failed",
  });
});

test("fetchPageText: timeout vira fetch_failed", async () => {
  const slow = ((_u: unknown, init?: RequestInit) =>
    new Promise((_, rej) => init?.signal?.addEventListener("abort", () => rej(new Error("abort"))))) as typeof fetch;
  await assert.rejects(fetchPageText(new URL("https://x.test/"), { appHost: "a", fetchImpl: slow, timeoutMs: 50 }), {
    code: "fetch_failed",
  });
});
