# Checador do Produtor — prints (OCR) — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O produtor envia a página de vendas por link **ou** por até 3 prints; um modelo de visão transcreve os prints e o texto segue pela mesma IA 4.

**Architecture:** `POST /api/check-page` ganha a entrada `images` (data URLs). O servidor valida (`lib/page-images.ts`), transcreve com `runPageOcr` (modelo de visão, cache `page-ocr` + fallback para os prints de exemplo) e entrega o texto ao fluxo atual da IA 4. Na tela, o campo de colar texto dá lugar a uma área de prints; o navegador redimensiona as imagens antes de enviar.

**Tech Stack:** Next.js 16, React 19, Groq (`qwen/qwen3.8-27b` para visão), `node:test` via tsx, PowerShell/System.Drawing só para gerar os prints de exemplo.

**Spec:** `docs/superpowers/specs/2026-11-23-checador-produtor-prints-design.md` (complementa `2026-11-23-checador-produtor-design.md`)

## Global Constraints

- Todo texto de interface em pt-BR, com acentuação correta.
- Chamadas de IA só no servidor; `GROQ_API_KEY` nunca no client.
- Imagens: de 1 a 3; data URL `image/png` | `image/jpeg` | `image/webp`; até **1,5 MB** de base64 cada; até **4 MB** no total.
- Redimensionamento no navegador: máx. **1280 px** de largura e **2400 px** de altura, JPEG qualidade **0,85**.
- Modelo de visão: `GROQ_VISION_MODEL`, padrão `qwen/qwen3.8-27b`.
- Schemas strict: tudo em `required`, `additionalProperties: false`.
- Ao fim de cada tarefa: `npm test`, `npm run build` e commit terminando com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Prints de exemplo reencodados no navegador** mudam os bytes e quebram o cache e o fallback. Por isso o botão de exemplo envia os arquivos **sem** redimensionar. *(teste na Task 1: o fallback compara com os bytes dos arquivos em `public/demo`)*
2. **Imagem gigante ou tipo errado** (PDF, GIF, SVG, data URL malformada) → `400` com mensagem clara, sem chegar ao modelo. *(teste na Task 1)*
3. **O modelo de visão recusa `reasoning_effort: "medium"`** (o qwen tem valores próprios) → o `generateJSON` precisa poder omitir esse parâmetro. *(conferido ao vivo na Task 3)*
4. **Prints sem texto legível** (foto de produto, print em branco) → `422` "Não conseguimos ler texto nesses prints." *(teste na Task 1)*
5. **Um ou outro na tela:** enviar prints com uma URL preenchida não pode mandar os dois; a última escolha vale. *(conferido no navegador na Task 2)*

---

### Task 1: Servidor — validação de imagens, OCR e entrada `images`

**Files:**
- Create: `lib/page-images.ts`, `tests/page-images.test.ts`
- Create: `public/demo/paginavendas-1.jpg`, `-2.jpg`, `-3.jpg` (Step 1)
- Modify: `lib/groq.ts`, `lib/schemas.ts`, `lib/prompts.ts`, `lib/ai.ts`, `lib/fallbacks.ts`, `lib/demo.ts`, `app/api/check-page/route.ts`, `tests/check-page.test.ts`, `scripts/try-ai.ts`

**Interfaces:**
- Produces:
  - `lib/demo.ts`: `DEMO_PRINT_PATHS = ["/demo/paginavendas-1.jpg", "/demo/paginavendas-2.jpg", "/demo/paginavendas-3.jpg"]`.
  - `lib/page-images.ts`:
    - `MAX_IMAGES = 3`, `MAX_IMAGE_B64 = 1_500_000`, `MAX_TOTAL_B64 = 4_000_000`.
    - `validateImages(input: unknown): { ok: true; images: string[] } | { ok: false; error: string }`.
  - `lib/groq.ts`: `generateJSON<T>(prompt: string | ChatCompletionContentPart[], schema, name, opts?: { timeoutMs?: number; model?: string; reasoning?: boolean })`. Com `reasoning: false`, o `reasoning_effort` não é enviado. Atualizar as chamadas existentes; hoje só a IA 4 e o `try-ai` passam modelo.
  - `groqVisionModel = () => process.env.GROQ_VISION_MODEL ?? "qwen/qwen3.8-27b"`.
  - `lib/schemas.ts`: `pageOcrSchema` (`{ text: string }`) e `PageOcrRaw`.
  - `lib/prompts.ts`: `PAGE_OCR_PROMPT: string`, com o texto do design.
  - `lib/ai.ts`: `runPageOcr(images: string[]): Promise<string>`. Envia `[{type:"text"}, ...images como image_url]` com `reasoning: false` e devolve o texto normalizado (linhas sem espaços repetidos, sem linhas vazias).
  - `lib/fallbacks.ts`:
    - `DEMO_PRINTS_TEXT: string`: as linhas de `DEMO_PAGE` em ordem de leitura (headline, subheadline, título "Por que o TermoSlim funciona", bullets, depoimentos, preço, CTA, garantia).
    - `pageOcrFallback(images: string[]): string | null`: devolve `DEMO_PRINTS_TEXT` quando `images` é exatamente a lista dos 3 arquivos de `public/demo`, em data URL `image/jpeg` base64, lidos uma vez com `fs`.
  - Rota: corpo `{ productId, images }` → validar (`400` com o `error`) → `withAICache({ route: "page-ocr", input: { images }, call: runPageOcr, fallback: pageOcrFallback })` → se o texto normalizado tiver menos de 80 caracteres, `422 { error: "Não conseguimos ler texto nesses prints.", code: "unreadable" }` → depois, o fluxo atual (texto > 6000 é cortado em 6000, não dá erro). A resposta inclui `pageText`, o texto do OCR.

- [ ] **Step 1: Gerar os prints de exemplo**

Em `http://localhost:3000/paginavendas` (ou num `next start`), esconder a faixa de aviso e o contador (`[data-prometia-ignore]` no topo → `display:none`). Tirar 3 capturas que cubram, sem buracos: (1) topo até os bullets, (2) depoimentos, (3) preço, CTA e garantia. Converter com PowerShell/System.Drawing para JPEG 0,85, largura ≤ 1280. Conferir: os 3 arquivos têm < 1,5 MB em base64 e ≤ 4 MB somados.

- [ ] **Step 2: Escrever os testes que falham**

`tests/page-images.test.ts`:
```ts
const png = "data:image/png;base64,iVBORw0KGgo=";
test("aceita de 1 a 3 data URLs de imagem", () => assert.deepEqual(validateImages([png]), { ok: true, images: [png] }));
test("recusa lista vazia, mais de 3 e o que não é lista", () => {
  for (const v of [[], [png, png, png, png], "x", null, undefined]) assert.equal(validateImages(v).ok, false);
});
test("recusa tipos fora de png/jpeg/webp e data URL malformada", () => {
  for (const v of ["data:image/gif;base64,R0lG", "data:image/svg+xml;base64,PHN2Zz4=", "data:application/pdf;base64,JVBERi0=",
                   "https://x.com/a.png", "data:image/png,naobase64", "data:image/png;base64,***"])
    assert.equal(validateImages([v]).ok, false, v);
});
test("recusa imagem acima de 1,5 MB e total acima de 4 MB", () => {
  const big = `data:image/jpeg;base64,${"A".repeat(MAX_IMAGE_B64 + 4)}`;
  assert.equal(validateImages([big]).ok, false);
  const mid = `data:image/jpeg;base64,${"A".repeat(1_400_000)}`;
  assert.equal(validateImages([mid, mid, mid]).ok, false);
});
test("mensagens de erro em português", () => {
  const r = validateImages([]); assert.ok(!r.ok && /print/i.test(r.error));
});
```
Em `tests/check-page.test.ts` (sem `GROQ_API_KEY`):
```ts
const demoPrints = DEMO_PRINT_PATHS.map((p) => `data:image/jpeg;base64,${readFileSync(join("public", p)).toString("base64")}`);
test("prints de exemplo: OCR e análise caem no plano B", async () => {
  const res = await post({ productId: "p_slim", images: demoPrints });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.source, "fallback"); assert.equal(data.overallRisk, "alto");
  assert.ok(data.pageText.includes(DEMO_PAGE.headline));
});
test("prints inválidos → 400", async () => {
  assert.equal((await post({ productId: "p_slim", images: ["data:image/gif;base64,R0lG"] })).status, 400);
});
test("print fora da demo sem IA → erro, não resultado inventado", async () => {
  const res = await post({ productId: "p_slim", images: ["data:image/png;base64,iVBORw0KGgo="] });
  assert.ok(res.status >= 500);
});
```
Teste unitário do texto curto: `checkPageFromText`/rota com OCR que devolve "ok" não é exercitável sem a IA. Cobrir com um teste de `normalizeOcrText` se a rota usar um helper exportado (`lib/page-images.ts`: `ocrTextOrNull(text: string): string | null`, que devolve `null` abaixo de 80 caracteres):
```ts
test("texto de OCR curto demais vira null", () => { assert.equal(ocrTextOrNull(" oi \n "), null); });
test("texto de OCR é normalizado", () => { assert.equal(ocrTextOrNull("  A   b \n\n" + "x".repeat(90)), "A b\n" + "x".repeat(90)); });
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npm test` → FAIL (módulos e entrada `images` ainda não existem).

- [ ] **Step 4: Implementar** conforme os Interfaces acima.

- [ ] **Step 5: Rodar e ver passar**

Run: `npm test` → PASS, incluindo os 31 testes anteriores.

- [ ] **Step 6: Build e commit**

```bash
git add lib app/api/check-page tests public/demo scripts/try-ai.ts
git commit -m "feat: checagem da página de vendas por prints (OCR com modelo de visão)"
```

---

### Task 2: Tela — link **ou** prints

**Files:**
- Create: `lib/image-resize.ts` (client)
- Modify: `app/produtor/checador/PageChecker.tsx`, `app/produtor/checador/page.tsx`

**Interfaces:**
- Consumes: rota da Task 1 (`images`), `DEMO_PRINT_PATHS`.
- Produces:
  - `resizeImage(file: File, maxW = 1280, maxH = 2400, quality = 0.85): Promise<string>`, que devolve a data URL JPEG (`createImageBitmap` + canvas).
  - `PageChecker` recebe `examplePrints: string[]` (os caminhos de `DEMO_PRINT_PATHS`).

- [ ] **Step 1: Trocar o textarea pela área de prints**

- Depois do campo de URL vem o divisor "ou" (mesmo do creator) e a área **"Enviar prints da página"**:
  - `input type=file accept="image/png,image/jpeg,image/webp" multiple` escondido, acionado por clique e por drag and drop;
  - miniaturas com botão "Remover";
  - contador "x de 3";
  - dica "Até 3 prints. Para páginas longas, tire um print por parte da página.";
  - link **"Usar prints de exemplo"**, que busca os arquivos com `fetch`, converte com `FileReader.readAsDataURL` **sem redimensionar**, seleciona TermoSlim e limpa a URL.
- Um ou outro:
  - adicionar prints limpa a URL;
  - digitar na URL limpa os prints;
  - o corpo enviado é `{ productId, url }` ou `{ productId, images }`, nunca os dois.
- Arquivo inválido (tipo, mais de 3): `toast.error` em pt-BR, e a lista não muda.
- Para cada arquivo enviado pelo usuário: `resizeImage`. Se a imagem redimensionada ainda passar de 1,5 MB, avisar e descartar.
- `422` da URL: aviso "Não conseguimos ler essa página. Envie prints dela." acima da área de prints. A área ganha destaque (borda âmbar) e recebe o foco.
- `422` dos prints: o mesmo aviso, com a mensagem do servidor.
- Remover tudo que era do texto colado: o estado `pastedText`, a lógica do textarea e o botão "Checar texto colado".
- Etapas de carregamento com prints: "Lendo os prints", "Extraindo promessas", "Estimando risco de reembolso".
- Texto do estado vazio: "Cole a URL da sua página ou envie prints dela."

- [ ] **Step 2: Conferir no navegador** (build de produção na porta 3100)

Esperado:
- (a) "Usar prints de exemplo" → 3 miniaturas → "Checar página" → resultado com risco alto, vindo do cache ou do plano B;
- (b) URL de exemplo continua funcionando;
- (c) com prints e depois digitando uma URL, os prints somem (e vice-versa);
- (d) um 4º arquivo dá aviso;
- (e) `http://192.168.0.1` mostra o aviso apontando para os prints;
- (f) a 375 px de largura, sem scroll horizontal.

- [ ] **Step 3: Lint, build e commit**

```bash
git add lib/image-resize.ts app/produtor/checador
git commit -m "feat: tela do Checador do Produtor aceita link ou prints"
```

---

### Task 3: IA ao vivo, cache, tour e documentação

**Files:**
- Modify: `data/ai-cache.json`, `components/Tour.tsx`, `SPEC.md`, `README.md`

- [ ] **Step 1: Rodar ao vivo e popular o cache**

Com `.env.local` e `NODE_ENV=development`, rodar o OCR dos 3 prints de exemplo e depois a IA 4 sobre o texto lido. Usar um script temporário fora do repo, chamando `withAICache` como a rota faz. Esperado:
- o OCR transcreve todas as promessas planejadas;
- a IA 4 dá risco alto;
- o `ai-cache.json` ganha uma entrada `page-ocr` e uma `check-page`.

Se o qwen recusar algum parâmetro, ajustar com `reasoning: false` (Review Focus 3).

- [ ] **Step 2: Tour**

O passo 7 passa a dizer: "Ele cola a URL da <strong>página de vendas</strong> ou envia <strong>prints</strong>, e a IA mostra quais promessas viram reembolso."

- [ ] **Step 3: SPEC e README**

- SPEC: a IA 4 ganha "entrada por prints (OCR)" (fluxo, limites e `GROQ_VISION_MODEL`); o M5 descreve a tela "link ou prints"; a seção 11 diz "upload e transcrição de **vídeo**; prints da página de vendas entram via M5".
- README: a tela do produtor, a tabela de rotas, a variável `GROQ_VISION_MODEL` e a linha de `npm test`.

- [ ] **Step 4: Testes, build e commit**

```bash
git add data/ai-cache.json components/Tour.tsx SPEC.md README.md
git commit -m "docs: prints (OCR) no Checador do Produtor — SPEC, README, tour e cache da demo"
```
