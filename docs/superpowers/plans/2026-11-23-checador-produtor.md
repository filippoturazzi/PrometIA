# Checador do Produtor — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O produtor cola a URL da página de vendas, o PrometIA lê os textos e mostra quais promessas podem gerar reembolso, com uma página de vendas fictícia (`/paginavendas`) para a demo.

**Architecture:** Uma lib pura (`lib/page-scan.ts`) valida a URL, faz o fetch com limites e extrai o texto visível. Uma 4ª chamada de IA (`POST /api/check-page`) reusa `withAICache` + fallback, como as outras três. A tela `/produtor/checador` segue o visual do Checador do creator. A página fictícia usa o layout raiz, mas o header, o rodapé e o tour do PrometIA ficam escondidos nela.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind 4, shadcn/ui, Groq (`groq-sdk`), testes com `node:test` via `tsx` (sem dependência nova).

**Spec:** `docs/superpowers/specs/2026-11-23-checador-produtor-design.md` (e `SPEC.md`, seções 8, 9, 10, 14 e 15)

## Global Constraints

- Todo texto de interface em português do Brasil, com acentuação correta.
- `GROQ_API_KEY` nunca no client; a chamada de IA só no Route Handler.
- Schemas do Groq no modo strict: todo campo em `required` e `additionalProperties: false` em todo objeto; campos "opcionais" vêm como `""` e viram `undefined` no `clean*`.
- Fetch da URL: só `http:`/`https:`, timeout de **8 s**, limite de **1 MB**, só `text/html`, texto extraído cortado em **6000** caracteres, mínimo de **80** caracteres para considerar a página legível.
- Bloquear `localhost`, loopback, IPs privados e link-local, **exceto** o próprio host do app (`new URL(req.url).host`).
- O rodapé de aviso continua em todas as telas do PrometIA; a página fictícia tem a sua própria faixa de aviso, marcada com `data-prometia-ignore`.
- Ao terminar cada tarefa: `npm run build` sem erros e um commit com mensagem clara (CLAUDE.md).
- Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **URL sem esquema** ("minhaloja.com.br/oferta") → tratar como `https://`. *(teste na Task 1)*
2. **Entidades HTML e acentos** (`&nbsp;`, `&amp;`, `&#233;`, `&atilde;`) → texto extraído legível em português. *(teste na Task 1)*
3. **Redirect para endereço interno** (página pública que redireciona para `http://127.0.0.1`) → bloquear; cada salto é revalidado, no máximo 3. *(teste na Task 1)*
4. **Página montada por JavaScript** (HTML quase vazio) → `422` com `code: "unreadable"`, e a tela abre o campo de colar texto. *(testes nas Tasks 1 e 3)*
5. **Contador regressivo da página fictícia** mudando o texto a cada segundo → a chave do cache tem que ser estável; o contador fica em `data-prometia-ignore`. *(teste na Task 2)*

---

### Task 1: `lib/page-scan.ts` — validar URL, buscar e extrair texto

**Files:**
- Create: `lib/page-scan.ts`
- Create: `tests/page-scan.test.ts`
- Modify: `package.json` (script `test`)

**Interfaces:**
- Produces:
  - `type PageScanErrorCode = "invalid_url" | "blocked" | "fetch_failed" | "not_html" | "too_large" | "unreadable"`
  - `class PageScanError extends Error { code: PageScanErrorCode }`
  - `parsePageUrl(input: string, appHost: string): URL`: completa com `https://` quando falta o esquema; lança `invalid_url` ou `blocked`.
  - `extractVisibleText(html: string): string`: remove `script`, `style`, `noscript`, `svg`, `head`, comentários e qualquer elemento com o atributo `data-prometia-ignore` (com o conteúdo); troca as tags de bloco por quebra de linha; decodifica entidades nomeadas comuns em pt-BR e as numéricas; colapsa os espaços; corta em 6000 caracteres.
  - `fetchPageText(url: URL, opts: { appHost: string; fetchImpl?: typeof fetch; timeoutMs?: number; maxBytes?: number }): Promise<string>`: `redirect: "manual"`, segue até 3 redirects revalidando cada `Location` com `parsePageUrl`; lê o corpo em stream e aborta acima de `maxBytes`; lança `unreadable` se o texto tiver menos de 80 caracteres.
  - Constantes exportadas: `FETCH_TIMEOUT_MS = 8000`, `MAX_PAGE_BYTES = 1_000_000`, `MAX_TEXT_CHARS = 6000`, `MIN_TEXT_CHARS = 80`.

- [ ] **Step 1: Adicionar o script de teste**

Em `package.json`: `"test": "tsx --conditions=react-server --tsconfig tsconfig.json --test tests/*.test.ts"`.

- [ ] **Step 2: Escrever os testes que falham** em `tests/page-scan.test.ts` (`node:test` + `node:assert/strict`):

```ts
test("parsePageUrl completa https quando falta o esquema", () => {
  assert.equal(parsePageUrl("minhaloja.com.br/oferta", "app.test").href, "https://minhaloja.com.br/oferta");
});
test("parsePageUrl recusa esquemas que não são http(s)", () => {
  for (const u of ["ftp://x.com", "file:///etc/passwd", "javascript:alert(1)"])
    assert.throws(() => parsePageUrl(u, "app.test"), { code: "invalid_url" });
});
test("parsePageUrl bloqueia endereços internos", () => {
  for (const u of ["http://localhost:3000/x", "http://127.0.0.1/", "http://10.0.0.5/", "http://192.168.1.1/",
                   "http://172.16.0.1/", "http://169.254.169.254/latest", "http://[::1]/", "http://0.0.0.0/"])
    assert.throws(() => parsePageUrl(u, "app.test"), { code: "blocked" });
});
test("parsePageUrl libera o próprio host do app, mesmo local", () => {
  assert.equal(parsePageUrl("http://localhost:3000/paginavendas", "localhost:3000").pathname, "/paginavendas");
});
test("extractVisibleText remove scripts, estilos e data-prometia-ignore", () => {
  const html = `<html><head><title>T</title><style>.a{}</style></head><body>
    <div data-prometia-ignore>Página fictícia</div><script>var x=1</script>
    <h1>Seque rápido</h1><p>Sem dieta</p><span data-prometia-ignore="">00:14:59</span></body></html>`;
  const t = extractVisibleText(html);
  assert.match(t, /Seque rápido/); assert.match(t, /Sem dieta/);
  assert.doesNotMatch(t, /fictícia|var x|\.a\{|00:14:59|<|T\n/);
});
test("extractVisibleText decodifica entidades e acentos", () => {
  assert.equal(extractVisibleText("<p>Caf&eacute;&nbsp;&amp; ch&#225; verde &atilde;o</p>"), "Café & chá verde ão");
});
test("extractVisibleText corta em MAX_TEXT_CHARS", () => {
  assert.ok(extractVisibleText(`<p>${"a ".repeat(10000)}</p>`).length <= MAX_TEXT_CHARS);
});
test("fetchPageText devolve o texto de uma página html", async () => {
  const fetchImpl = fakeFetch({ "https://loja.test/": html200(`<p>${"Promessa forte. ".repeat(10)}</p>`) });
  assert.match(await fetchPageText(new URL("https://loja.test/"), { appHost: "app.test", fetchImpl }), /Promessa forte/);
});
test("fetchPageText bloqueia redirect para endereço interno", async () => {
  const fetchImpl = fakeFetch({ "https://loja.test/": redirect("http://127.0.0.1/admin") });
  await assert.rejects(fetchPageText(new URL("https://loja.test/"), { appHost: "app.test", fetchImpl }), { code: "blocked" });
});
test("fetchPageText: página só com JS vira unreadable", async () => {
  const fetchImpl = fakeFetch({ "https://spa.test/": html200(`<div id="root"></div><script>app()</script>`) });
  await assert.rejects(fetchPageText(new URL("https://spa.test/"), { appHost: "app.test", fetchImpl }), { code: "unreadable" });
});
test("fetchPageText recusa conteúdo que não é html e corpo grande demais", async () => {
  const pdf = fakeFetch({ "https://x.test/": new Response("%PDF", { headers: { "content-type": "application/pdf" } }) });
  await assert.rejects(fetchPageText(new URL("https://x.test/"), { appHost: "a", fetchImpl: pdf }), { code: "not_html" });
  const big = fakeFetch({ "https://x.test/": html200("a".repeat(2000)) });
  await assert.rejects(fetchPageText(new URL("https://x.test/"), { appHost: "a", fetchImpl: big, maxBytes: 1000 }), { code: "too_large" });
});
test("fetchPageText: timeout vira fetch_failed", async () => {
  const slow: typeof fetch = (_u, init) => new Promise((_, rej) => init?.signal?.addEventListener("abort", () => rej(new Error("abort"))));
  await assert.rejects(fetchPageText(new URL("https://x.test/"), { appHost: "a", fetchImpl: slow, timeoutMs: 50 }), { code: "fetch_failed" });
});
```

Helpers no próprio arquivo de teste: `fakeFetch(map: Record<string, Response>): typeof fetch` (URL desconhecida → rejeita), `html200(body)` (content-type `text/html; charset=utf-8`), `redirect(location)` (status 302).

- [ ] **Step 3: Rodar e ver falhar**

Run: `npm test`
Expected: FAIL (`Cannot find module '../lib/page-scan'`).

- [ ] **Step 4: Implementar `lib/page-scan.ts`** com as assinaturas acima. Extração por regex, sem dependência nova. Para remover `data-prometia-ignore`, casar a tag de abertura com o atributo até o fechamento da mesma tag; os elementos marcados são simples, sem aninhamento da mesma tag. Detecção de IP: IPv4 literal (10/8, 127/8, 169.254/16, 172.16/12, 192.168/16, 0/8) e IPv6 `::1`, `fc00::/7`, `fe80::/10`. Não resolve DNS (é limitação aceita no protótipo; deixar um comentário dizendo isso).

- [ ] **Step 5: Rodar e ver passar**

Run: `npm test`
Expected: todos os testes PASS.

- [ ] **Step 6: Build e commit**

Run: `npm run build` → sem erros.
```bash
git add lib/page-scan.ts tests/page-scan.test.ts package.json
git commit -m "feat: leitura segura de página de vendas (validação de URL, fetch e extração de texto)"
```

---

### Task 2: Página de vendas fictícia `/paginavendas`

**Files:**
- Create: `lib/demo-page.ts`
- Create: `app/paginavendas/page.tsx` (e componentes locais se precisar, ex.: `app/paginavendas/Countdown.tsx`)
- Create: `components/AppChrome.tsx`
- Modify: `app/layout.tsx`
- Modify: `lib/demo.ts` (constantes da demo do produtor)
- Test: `tests/demo-page.test.ts`

**Interfaces:**
- Consumes: `extractVisibleText` (Task 1).
- Produces:
  - `lib/demo.ts`: `DEMO_PRODUCER_PRODUCT_ID = "p_slim"`, `DEMO_SALES_PAGE_PATH = "/paginavendas"`.
  - `lib/demo-page.ts`: `DEMO_PAGE` (objeto com o texto da página: `headline`, `subheadline`, `bullets: string[]`, `testimonials: { name: string; text: string }[]`, `guarantee`, `cta`) e `DEMO_PAGE_SIGNATURE: string` (= `DEMO_PAGE.headline`, usado pelo fallback da Task 3).
  - `components/AppChrome.tsx`: `HideOnStandalone({ children }: { children: ReactNode })`, um client component que devolve `null` quando `usePathname()` está em `STANDALONE_ROUTES = ["/paginavendas"]`.

- [ ] **Step 1: Escrever o teste que falha** em `tests/demo-page.test.ts`:

```ts
test("a página de exemplo tem a mistura planejada de promessas", () => {
  const all = [DEMO_PAGE.headline, DEMO_PAGE.subheadline, ...DEMO_PAGE.bullets, DEMO_PAGE.guarantee,
               ...DEMO_PAGE.testimonials.map((t) => t.text)].join("\n");
  for (const p of [/10 ?kg em 15 dias/i, /sem dieta/i, /enquanto (você )?dorme/i, /garantid/i,
                   /aprovado por médicos/i, /substitui a academia/i, /energia o dia inteiro/i,
                   /metabolismo em até 3x/i, /cafeína e chá verde/i, /foco e .*disposição/i])
    assert.match(all, p);
  assert.equal(DEMO_PAGE_SIGNATURE, DEMO_PAGE.headline);
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test` → FAIL (módulo `lib/demo-page` não existe).

- [ ] **Step 3: Escrever `lib/demo-page.ts` e as constantes em `lib/demo.ts`**

A copy é livre, desde que tenha as frases dos padrões acima. Marca: NutriMax / TermoSlim (do seed). Nada de marcas, logos ou pessoas reais; os depoimentos usam primeiro nome + inicial ("Juliana M.").

- [ ] **Step 4: Rodar e ver passar** → `npm test` PASS.

- [ ] **Step 5: `HideOnStandalone` e layout**

Em `app/layout.tsx`, envolver `<Header />`, `<DisclaimerFooter />` e `<Tour />` com `<HideOnStandalone>`. O `Header` e o `DisclaimerFooter` continuam server components e passam como `children`.

- [ ] **Step 6: Montar `app/paginavendas/page.tsx`**

- Server component que renderiza `DEMO_PAGE`. Visual "infoproduto apelativo", bem diferente do PrometIA: fundo quase preto, vermelho e amarelo, headline enorme em caixa alta, selo de garantia, depoimentos, botão de CTA grande (sem ação real; rola para o topo).
- `metadata.title`: "TermoSlim — Oferta especial (página fictícia)".
- Faixa fixa no topo, pequena: "Página fictícia criada para a demonstração do PrometIA · todos os dados são fictícios", com `data-prometia-ignore` e link "voltar ao PrometIA" (`/produtor/checador`).
- Contador regressivo: client component dentro de um elemento com `data-prometia-ignore`, valor inicial fixo no SSR ("00:14:59").
- Responsivo no celular (gutter de 16 px, sem scroll horizontal).

- [ ] **Step 7: Teste da extração estável** (adicionar em `tests/demo-page.test.ts`)

```ts
test("o texto extraído da página não inclui a faixa nem o contador", () => {
  const html = `<div data-prometia-ignore>Página fictícia criada para a demonstração</div>
    <div data-prometia-ignore><span>00:14:59</span></div><h1>${DEMO_PAGE.headline}</h1>`;
  const t = extractVisibleText(html);
  assert.ok(t.includes(DEMO_PAGE.headline));
  assert.doesNotMatch(t, /fictícia|00:14:59/);
});
```

Run: `npm test` → PASS.

- [ ] **Step 8: Conferir no navegador**

Run: `npm run dev` e abrir `http://localhost:3000/paginavendas`. Esperado: sem o header, o rodapé e o tour do PrometIA; faixa de aviso visível; layout ok a 375 px. Abrir `/` e conferir que o header e o rodapé continuam lá.

- [ ] **Step 9: Build e commit**

```bash
git add lib/demo-page.ts lib/demo.ts app/paginavendas components/AppChrome.tsx app/layout.tsx tests/demo-page.test.ts
git commit -m "feat: página de vendas fictícia do TermoSlim para a demo do produtor"
```

---

### Task 3: IA 4 — `POST /api/check-page`

**Files:**
- Modify: `lib/schemas.ts`, `lib/prompts.ts`, `lib/ai.ts`, `lib/fallbacks.ts`
- Create: `app/api/check-page/route.ts`
- Test: `tests/check-page.test.ts`

**Interfaces:**
- Consumes: `parsePageUrl`, `fetchPageText`, `PageScanError` (Task 1); `DEMO_PAGE_SIGNATURE`, `DEMO_PRODUCER_PRODUCT_ID` (Task 2); `withAICache`, `aiErrorResponse`, `readJSONBody`, `str`, `getProduct`.
- Produces:
  - `lib/schemas.ts`: `checkPageSchema`. Igual ao `checkClaimsSchema`, mas cada claim ganha `refundRisk: enum ["baixo","medio","alto"]` (logo após `category`) e o topo ganha `summary: string`. Tipos `CheckPageRaw` e `CheckPageResult` (claims de `CheckClaimsResult` + `refundRisk: OverallRisk`; `overallRisk`; `summary`). `cleanCheckPage(raw: CheckPageRaw): CheckPageResult`.
  - `lib/prompts.ts`: `checkPagePrompt(product: Product, pageText: string): string`, com o texto do rascunho do design doc, mais as mesmas regras "SEMPRE proibida" do `checkClaimsPrompt` e "Liste TODAS as afirmações, inclusive as sustentadas".
  - `lib/ai.ts`: `runCheckPage(product: Product, pageText: string): Promise<CheckPageResult>`.
  - `lib/fallbacks.ts`: `DEMO_CHECK_PAGE: CheckPageResult` e `checkPageFallback(productId: string, pageText: string): CheckPageResult | null` (devolve `DEMO_CHECK_PAGE` quando `productId === DEMO_PRODUCER_PRODUCT_ID` e `pageText` contém `DEMO_PAGE_SIGNATURE`).
  - Rota: corpo `{ productId: string; url?: string; text?: string }`. Respostas:
    - `200` → `{ claims, overallRisk, summary, pageText, source, notice }`
    - `400` → `{ error }` (produto ausente, sem url e sem texto, texto < 80 ou > 6000 caracteres)
    - `404` → produto não encontrado
    - `422` → `{ error, code }` com `code` ∈ `PageScanErrorCode` e mensagens em pt-BR:
      - `invalid_url`: "Esse endereço não parece uma URL válida."
      - `blocked`: "Esse endereço não pode ser lido por segurança."
      - `fetch_failed`, `not_html`, `too_large`, `unreadable`: "Não conseguimos ler essa página. Cole o texto dela abaixo."
  - Chave do cache: `{ productId, text: pageText }`. A mesma página lida por URL ou colada cai no mesmo cache.

- [ ] **Step 1: Escrever os testes que falham** em `tests/check-page.test.ts`. Rodar com `GROQ_API_KEY` vazia: o Groq falha e a rota cai no fallback.

```ts
const post = (body: unknown) => POST(new Request("http://app.test/api/check-page", { method: "POST", body: JSON.stringify(body) }));

test("cleanCheckPage converte rewrite vazio e mantém refundRisk", () => {
  const r = cleanCheckPage({ overallRisk: "alto", summary: " x ", claims: [
    { text: " a ", status: "sustentada", category: "conteudo", refundRisk: "baixo", evidence: "", reason: "r", rewrite: "z" }] });
  assert.equal(r.claims[0].rewrite, undefined); assert.equal(r.claims[0].refundRisk, "baixo"); assert.equal(r.summary, "x");
});
test("texto da página de exemplo cai no fallback da demo", async () => {
  delete process.env.GROQ_API_KEY;
  const text = `${DEMO_PAGE.headline}\n${DEMO_PAGE.bullets.join("\n")}`;
  const res = await post({ productId: "p_slim", text });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.source, "fallback"); assert.equal(data.overallRisk, "alto");
  assert.ok(data.claims.some((c: { status: string }) => c.status === "proibida"));
  assert.equal(data.pageText, text);
});
test("url interna é bloqueada com 422", async () => {
  const res = await post({ productId: "p_slim", url: "http://169.254.169.254/latest" });
  assert.equal(res.status, 422); assert.equal((await res.json()).code, "blocked");
});
test("validações de entrada", async () => {
  assert.equal((await post({ productId: "nope", text: "x".repeat(100) })).status, 404);
  assert.equal((await post({ productId: "p_slim" })).status, 400);
  assert.equal((await post({ productId: "p_slim", text: "curto" })).status, 400);
});
```

O `DEMO_CHECK_PAGE` precisa ter um claim para cada promessa planejada da Task 2: 5 proibidas, 2 exageradas e 2 sustentadas. Cada uma com `refundRisk` (proibida → alto, exagerada → médio, sustentada → baixo), evidência tirada do `salesPageText` do `p_slim` e reescrita verdadeira. O `summary` é de 1 frase.

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test` → FAIL (`checkPageSchema`/rota inexistentes).

- [ ] **Step 3: Implementar** schema, cleaner, prompt, `runCheckPage`, fallback e a rota, seguindo o padrão de `app/api/check-claims/route.ts`. Na rota: `appHost = new URL(req.url).host`; se veio `url`, `parsePageUrl` + `fetchPageText`, e o `PageScanError` vira `422`; se veio `text`, normalizar os espaços e validar o tamanho.

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test` → PASS.

- [ ] **Step 5: Testar ao vivo** (com o `.env.local`)

Run: `npm run dev` e, em outro terminal:
`curl -s -X POST localhost:3000/api/check-page -H "content-type: application/json" -d "{\"productId\":\"p_slim\",\"url\":\"http://localhost:3000/paginavendas\"}"`
Esperado: `200`, `source: "live"` (ou `"cache"`), as promessas planejadas classificadas e `overallRisk: "alto"`. Isso grava a entrada no `data/ai-cache.json`.

- [ ] **Step 6: Build e commit**

```bash
git add lib/schemas.ts lib/prompts.ts lib/ai.ts lib/fallbacks.ts app/api/check-page tests/check-page.test.ts data/ai-cache.json
git commit -m "feat: IA 4 (check-page) — checa promessas da página de vendas do produtor"
```

---

### Task 4: Tela `/produtor/checador`

**Files:**
- Create: `app/produtor/checador/page.tsx`, `app/produtor/checador/PageChecker.tsx`
- Modify: `components/ClaimCard.tsx` (props opcionais)
- Modify: `lib/nav.ts` (subnav do produtor)
- Modify: `app/produtor/ProducerView.tsx` ou `app/produtor/page.tsx` (atalho para o checador)

**Interfaces:**
- Consumes: a rota da Task 3; `DEMO_PRODUCER_PRODUCT_ID`, `DEMO_SALES_PAGE_PATH` (Task 2); `ClaimCard`, `StatusBadge`, `RISK_META`, `toastAIError`, `toastDemoMode`.
- Produces:
  - `ClaimCard` ganha `evidenceLabel?: string` (padrão "Página do produto") e `refundRisk?: OverallRisk`. Quando vem, mostra o badge "Risco de reembolso: alto/médio/baixo" usando `RISK_META`.
  - `PageChecker({ products, defaultProductId }: { products: { id: string; name: string; producer: string }[]; defaultProductId: string })`.
  - Elemento `id="checador-produtor-entrada"` envolvendo o painel de entrada (alvo do tour na Task 5).

- [ ] **Step 1: Subnav e atalho**

Em `lib/nav.ts`, a subnav do produtor fica com `[{ href: "/produtor", label: "Saúde da promessa", icon: Activity }, { href: "/produtor/checador", label: "Checar página de vendas", icon: ScanSearch }]`. Em `/produtor`, um botão "Checar minha página de vendas" nas `actions` do `PageHeader` ou logo abaixo dele.

- [ ] **Step 2: `page.tsx`**

`PageHeader` com eyebrow "Produtor · Antes de divulgar", título "Checador da página de vendas" e subtítulo "Teste a sua página de vendas antes de divulgar: promessas exageradas viram reembolso." Ele renderiza `PageChecker` com todos os produtos (rótulo "Produto · Produtor").

- [ ] **Step 3: `PageChecker.tsx`**

Mesma grade e mesmo visual do `Checador.tsx` do creator (entrada à esquerda, resultado à direita).
- Entrada: select de produto; input "URL da página de vendas" (placeholder "https://sualoja.com.br/oferta"); botão "Usar página de exemplo", que seta o produto para `DEMO_PRODUCER_PRODUCT_ID` e a URL para `` `${window.location.origin}${DEMO_SALES_PAGE_PATH}` ``; link "Abrir a página de exemplo" (`target="_blank"`); botão "Checar página".
- Etapas de carregamento: "Lendo a página", "Extraindo promessas", "Estimando risco de reembolso".
- Resposta `422`: mostra um aviso com o `error` e um `textarea` "Cole o texto da página" (máx. 6000). O botão passa a enviar `{ productId, text }`. Os outros erros usam `toastAIError`.
- Resultado: badge do risco geral, contagem ✅ / ⚠️ / ❌, o `summary` da IA e a frase fixa "Promessas assim geram reembolso por expectativa desalinhada.". Os claims vêm ordenados com `compareByRisk` e renderizados com `ClaimCard` (`evidenceLabel="Ficha do produto"`, `refundRisk`). No fim, um `<details>` "Texto lido da página" com o `pageText`.
- Estado vazio: ilustração/texto curto "Cole a URL da sua página ou use a página de exemplo."

- [ ] **Step 4: Conferir no navegador**

Em `npm run dev`, abrir `/produtor/checador` → "Usar página de exemplo" → "Checar página". Esperado: o resultado com as promessas da página e o risco geral alto. Depois testar a URL `https://example.com` (texto curto) → aviso + textarea; colar um texto e checar → resultado. A 375 px de largura, sem scroll horizontal.

- [ ] **Step 5: Build e commit**

```bash
git add app/produtor components/ClaimCard.tsx lib/nav.ts
git commit -m "feat: tela do Checador da página de vendas para o produtor"
```

---

### Task 5: Tour, SPEC, README e cache

**Files:**
- Modify: `components/Tour.tsx`, `SPEC.md`, `README.md`, `scripts/try-ai.ts` (e `scripts/eval-demo.ts`, se ele percorrer as rotas de IA), `data/ai-cache.json`

**Interfaces:**
- Consumes: `#checador-produtor-entrada` (Task 4).

- [ ] **Step 1: Passo novo no tour**

Inserir entre "Depois, o comprador" e "E a YouShop enxerga antes":
```ts
{
  route: "/produtor/checador",
  selector: "#checador-produtor-entrada",
  side: "right",
  title: "O produtor também promete",
  description:
    "Ele cola a URL da <strong>página de vendas</strong> e a IA mostra quais promessas viram reembolso. Use a <strong>página de exemplo</strong> para testar.",
},
```
A barra de progresso passa a mostrar "x de 9" sozinha (ela usa `STEPS.length`; conferir).

- [ ] **Step 2: SPEC e README**

- SPEC: seção 1 (o produtor também checa a página), seção 4 (pastas novas), seção 8 (título "As 4 chamadas de IA" + bloco "IA 4 — `POST /api/check-page`" com entrada, prompt e schema), seção 10 (telas `/paginavendas` e `/produtor/checador`), seção 15 (tabela com o passo novo).
- README: "3 chamadas de IA" → "4", a tela nova, o script `npm test`.

- [ ] **Step 3: `try-ai`**

Adicionar a checagem da página de exemplo ao `scripts/try-ai.ts`, chamando `runCheckPage(getProduct("p_slim")!, texto)`, com o texto montado de `DEMO_PAGE`.

- [ ] **Step 4: Popular o cache e conferir a demo inteira**

Em `npm run dev`, rodar o tour completo uma vez e clicar em "Checar página" com a página de exemplo. Confirmar que o `data/ai-cache.json` ganhou a entrada `check-page`. Rodar `npm test` → PASS.

- [ ] **Step 5: Build e commit**

```bash
git add components/Tour.tsx SPEC.md README.md scripts data/ai-cache.json
git commit -m "docs: IA 4 e Checador do Produtor no SPEC, README e tour; cache da demo"
```
