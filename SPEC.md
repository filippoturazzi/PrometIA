# SPEC — PrometIA (protótipo MVP)
 
> **Para o agente de código:** este documento é a fonte de verdade do protótipo. Siga a ordem de tarefas da seção 12. Não implemente nada da seção 11 (fora do escopo). Em caso de dúvida, priorize que a **história da demo (seção 2)** rode do início ao fim sem travar.
 
---
 
## 1. Visão geral
 
**PrometIA** é uma camada de IA para o ecossistema da YouShop que confere se **o que é prometido na divulgação** (creator / página do produtor) bate com **o que o comprador recebe**, e fecha o ciclo quando não bate.
 
- **Antes de postar:** o creator passa o roteiro pelo checador, que extrai as promessas, classifica cada uma e sugere reescrita. Cada conteúdo checado ganha um **link exclusivo** (link do creator + id do conteúdo). O **produtor** também checa a própria página de vendas: cola a URL e a IA mostra quais promessas podem gerar reembolso.
- **Depois da venda:** o comprador declara a expectativa (página de obrigado), responde um check-in (card no YouClass) e, se pedir reembolso, diz o que esperava e o que recebeu. A IA classifica.
- **Ciclo de aprendizado:** painéis mostram quais conteúdos e promessas geram reembolso, e uma fila de escalonamento mostra os casos antes de virarem reclamação pública.
É um **protótipo de demonstração**: dados fictícios, IA real em 4 pontos, sem login, sem integração real com a YouShop.
 
---
 
## 2. História da demo (o critério de sucesso)
 
O protótipo precisa rodar este roteiro de 2–3 minutos sem falhas:
 
1. **Creator "Ana Reels"** abre o *Checador*, escolhe o produto **"Renda com Reels"** e cola o roteiro de demo (seção 6.4). O PrometIA retorna as promessas:
   - ❌ "você vai faturar R$10 mil já no primeiro mês" → ganho garantido, a página não sustenta
   - ⚠️ "é só postar 1 vídeo por dia e o algoritmo faz o resto" → exagero, o curso fala em 3 meses de prática
   - ✅ "são 6 módulos com aulas práticas de edição" → sustentada pela página
   Cada promessa mostra evidência, motivo e reescrita. Ana clica em **"Gerar link deste conteúdo"** → `youshop.co/r/ana-reels/renda-reels?c=ct_013`.
2. Troca para **Comprador**: página de obrigado → marca a expectativa "Faturar rápido" → card do YouClass → responde 👎 → abre **Solicitar reembolso** → escreve "comprei achando que ia ganhar 10 mil no primeiro mês, mas o curso é só edição básica" → a IA classifica ao vivo: *expectativa desalinhada, gravidade alta, promessa relacionada: ganho garantido*. O botão **"Continuar com o reembolso"** está sempre visível.
3. Troca para **Creator → Meus conteúdos**: os conteúdos da Ana com a promessa "R$10k" têm taxa de reembolso ~3x maior. Card de insight gerado por IA.
4. Troca para **Operações (YouShop)**: painel *Saúde da Promessa* + **fila de escalonamento** com o caso do passo 2 (frustração alta + produtor sem resposta há 52h), com resumo do caso e ação sugerida.
---
 
## 3. Stack
 
- **Next.js 14+ (App Router) + TypeScript**
- **Tailwind CSS + shadcn/ui** (Card, Table, Badge, Button, Tabs, Textarea, Select, Dialog, Progress)
- **Recharts** para os gráficos
- **Dados:** arquivos JSON em `/data` (lidos no servidor). Sem banco.
- **IA:** Groq via SDK oficial `groq-sdk`, chamado **apenas em Route Handlers do servidor**. Chave em `GROQ_API_KEY` (`.env.local`). Modelo em `GROQ_MODEL` (padrão: `openai/gpt-oss-20b`, o mais rápido e barato com structured outputs estritos; se a qualidade em português não bastar, usar `openai/gpt-oss-120b`). Nível de raciocínio em `GROQ_REASONING_EFFORT` (padrão: `medium`; com `low` o 20b gerou JSON fora do schema nos testes). Plano gratuito: 8.000 tokens/min, por isso o cache da seção 9 é essencial na demo.
- **Deploy:** Vercel.
---
 
## 4. Estrutura de pastas
 
```
prometia/
├─ app/
│  ├─ layout.tsx                 # header com logo + seletor de perfil
│  ├─ page.tsx                   # landing curta: o que é o PrometIA + botões para cada perfil
│  ├─ creator/
│  │  ├─ checador/page.tsx       # M1
│  │  └─ conteudos/page.tsx      # M3
│  ├─ comprador/
│  │  ├─ obrigado/page.tsx       # M2b
│  │  ├─ youclass/page.tsx       # M2b (card check-in)
│  │  └─ reembolso/page.tsx      # M2a
│  ├─ operacoes/page.tsx         # M4 (YouShop)
│  ├─ produtor/page.tsx          # M4 (visão do produtor, mesmo componente filtrado)
│  ├─ produtor/checador/page.tsx # M5 (Checador da página de vendas)
│  ├─ paginavendas/page.tsx      # página de vendas fictícia (demo do M5)
│  └─ api/
│     ├─ check-claims/route.ts   # IA 1
│     ├─ classify-feedback/route.ts # IA 2
│     ├─ insight/route.ts        # IA 3
│     └─ check-page/route.ts     # IA 4
├─ components/                   # ClaimCard, StatusBadge, RoleSwitcher, PhoneFrame, EscalationQueue, ...
├─ lib/
│  ├─ groq.ts                    # cliente + helper generateJSON(prompt, schema)
│  ├─ prompts.ts                 # os 4 prompts (seção 8)
│  ├─ schemas.ts                 # os 4 response schemas (seção 8)
│  ├─ page-scan.ts               # leitura segura da URL da página de vendas (IA 4)
│  ├─ demo-page.ts               # texto da página de vendas fictícia
│  ├─ data.ts                    # leitura dos JSON + funções de agregação
│  ├─ cache.ts                   # cache das respostas da IA (seção 9)
│  └─ types.ts                   # tipos da seção 5
├─ data/
│  ├─ products.json
│  ├─ creators.json
│  ├─ contents.json
│  ├─ sales.json
│  ├─ feedback.json
│  └─ ai-cache.json              # respostas salvas para a demo
└─ scripts/
   └─ generate-seed.ts           # gera sales.json e feedback.json (seção 7)
```
 
---
 
## 5. Tipos (`lib/types.ts`)
 
```ts
export type ProductType = "curso" | "suplemento" | "mentoria";
 
export interface Product {
  id: string;                 // "p_reels"
  name: string;
  type: ProductType;
  producer: string;           // nome do produtor
  price: number;
  salesPageText: string;      // texto da página de vendas (fonte de "promessa oficial")
  contentOutline?: string[];  // módulos/conteúdo real (só se hasYouClass)
  hasYouClass: boolean;
  expectationChips: string[]; // opções da página de obrigado
}
 
export type CreatorStyle = "cauteloso" | "misto" | "exagerado";
 
export interface Creator {
  id: string;                 // "c_ana"
  name: string;
  handle: string;             // "ana-reels"
  niche: string;
  style: CreatorStyle;
}
 
export type ClaimStatus = "sustentada" | "exagerada" | "proibida";
 
export interface Claim {
  text: string;               // trecho literal do roteiro
  status: ClaimStatus;
  evidence: string;           // trecho da página/conteúdo que sustenta ou contradiz ("" se nada)
  reason: string;             // explicação curta
  rewrite?: string;           // só para exagerada/proibida
  category: "ganho_financeiro" | "resultado_saude" | "prazo" | "conteudo" | "garantia" | "outro";
}
 
export interface Content {
  id: string;                 // "ct_013"
  creatorId: string;
  productId: string;
  title: string;              // "Reels: como saí do zero"
  channel: "tiktok" | "instagram" | "youtube";
  publishedAt: string;        // ISO
  script: string;
  claims: Claim[];            // pré-calculadas para o seed
  linkId: string;             // "ct_013"
}
 
export interface Sale {
  id: string;
  contentId: string;
  productId: string;
  creatorId: string;
  createdAt: string;
  expectation?: string;       // chip marcado na página de obrigado
  checkin?: "positivo" | "neutro" | "negativo";
  refunded: boolean;
  chargeback: boolean;
}
 
export type FrustrationType =
  | "expectativa_desalinhada"
  | "acesso_tecnico"
  | "qualidade_conteudo"
  | "entrega_logistica"
  | "arrependimento_pessoal";
 
export interface Feedback {
  id: string;
  saleId: string;
  text: string;               // o que o comprador escreveu no reembolso
  classification: {
    type: FrustrationType;
    severity: "baixa" | "media" | "alta";
    relatedClaim?: string;    // promessa relacionada, se houver
    summary: string;
  };
  producerRespondedHours?: number | null; // null = produtor não respondeu
  createdAt: string;
}
```
 
---
 
## 6. Dados de seed fixos (escrever à mão em `/data`)
 
### 6.1 Produtos (`products.json`)
 
**p_reels — "Renda com Reels"** (curso, R$ 297, YouClass: sim, produtor: "Studio Viral")
- *Página de vendas:* "Aprenda a editar Reels que prendem a atenção. 6 módulos práticos: roteiro, gravação com celular, edição no CapCut, legendas, ganchos e postagem. Para iniciantes. Resultados dependem da sua dedicação; a maioria dos alunos começa a ver crescimento de seguidores após 3 meses de prática constante. Não garantimos ganhos financeiros."
- *Conteúdo real:* ["M1 Roteiro em 3 atos", "M2 Gravação com celular", "M3 Edição no CapCut", "M4 Legendas e ritmo", "M5 Ganchos dos 3 primeiros segundos", "M6 Calendário de postagem"]
- *Chips:* ["Aprender a editar", "Crescer seguidores", "Faturar rápido", "Virar freelancer de edição"]
**p_slim — "TermoSlim"** (suplemento, R$ 149, YouClass: não, produtor: "NutriMax")
- *Página:* "Suplemento termogênico com cafeína e chá verde. Auxilia no foco e na disposição para treinos. Deve ser associado a alimentação equilibrada e exercícios. Não substitui orientação médica. Este produto não é medicamento."
- *Chips:* ["Mais disposição", "Emagrecer", "Foco nos treinos", "Resultado rápido"]
**p_mentor — "Mentoria Loja Lucrativa"** (mentoria, R$ 997, YouClass: sim, produtor: "Rafa Commerce")
- *Página:* "8 encontros ao vivo em grupo sobre como estruturar uma loja online: escolha de nicho, fornecedores, precificação, tráfego pago básico e atendimento. Inclui gravações e planilhas. Não é um serviço de montagem de loja."
- *Conteúdo real:* ["Encontro 1 Nicho", "Encontro 2 Fornecedores", "Encontro 3 Precificação", "Encontro 4 Loja na prática", "Encontro 5 Tráfego básico", "Encontro 6 Criativos", "Encontro 7 Atendimento", "Encontro 8 Plano de 90 dias"]
- *Chips:* ["Montar minha loja", "Primeiras vendas", "Renda extra", "Largar o emprego"]
### 6.2 Creators (`creators.json`)
 
| id | nome | handle | nicho | estilo |
|---|---|---|---|---|
| c_ana | Ana Reels | ana-reels | renda online | exagerado |
| c_bruno | Bruno Edita | bruno-edita | edição de vídeo | cauteloso |
| c_carla | Carla Fit | carla-fit | fitness | exagerado |
| c_diego | Diego Treino | diego-treino | fitness | cauteloso |
| c_eva | Eva Empreende | eva-empreende | e-commerce | misto |
 
### 6.3 Conteúdos (`contents.json`) — ~12
 
Distribuir: Ana (3, p_reels), Bruno (2, p_reels), Carla (2, p_slim), Diego (2, p_slim), Eva (3, p_mentor). Escrever roteiros curtos (60–120 palavras) coerentes com o estilo. Pré-preencher `claims` (pode rodar a IA 1 uma vez e salvar). Exemplos de promessas por estilo:
- **exagerado:** "fature R$10k no primeiro mês", "seca 5kg em 2 semanas sem dieta", "renda garantida"
- **misto:** "muita gente faz as primeiras vendas no primeiro mês", "você sai com a loja pronta" (contradiz a página)
- **cauteloso:** "6 módulos práticos", "ajuda na disposição pro treino", "resultados dependem de você"
### 6.4 Roteiro da demo (deixar como botão "Usar roteiro de exemplo" no Checador)
 
> "Gente, eu era CLT e hoje vivo de Reels. Com o curso Renda com Reels você vai faturar R$10 mil já no primeiro mês, sério. É só postar 1 vídeo por dia e o algoritmo faz o resto. São 6 módulos com aulas práticas de edição, do roteiro até a postagem. Link na bio, corre que é por tempo limitado!"
 
---
 
## 7. Geração de dados (`scripts/generate-seed.ts`)
 
Script determinístico (seed fixa de aleatoriedade, ex. `seedrandom("prometia")`) que gera `sales.json` (~300) e `feedback.json` (~60) a partir de products/creators/contents.
 
**Padrões obrigatórios** (o painel precisa mostrá-los):
- Taxa de reembolso por estilo: **exagerado ~18–22%**, misto ~9–11%, cauteloso ~4–6%.
- Conteúdos com promessa `proibida` de categoria `ganho_financeiro` ou `resultado_saude` → taxa ~3x a média do produto.
- Expectativa marcada: vendas de conteúdo exagerado marcam mais "Faturar rápido" / "Resultado rápido" / "Emagrecer" / "Largar o emprego".
- Check-in: negativo correlacionado com reembolso (~70% dos reembolsos tiveram check-in negativo antes).
- Chargeback: ~10% dos reembolsos.
- Datas: últimos 60 dias.
- `producerRespondedHours`: 70% respondem em <24h, 15% entre 24–72h, 15% `null` (não respondeu).
**Textos de feedback:** usar ~25 templates por tipo de frustração, variando produto e promessa. Devem soar como reclamações reais, ex.:
- expectativa: "Comprei achando que ia ganhar dinheiro rápido, mas é só aula de edição básica." / "Falaram que eu ia secar sem dieta, a embalagem diz que precisa de dieta e treino." / "Achei que a mentoria montava a loja pra mim."
- acesso: "Não consigo acessar os módulos, aparece bloqueado."
- qualidade: "São só PDFs sem contexto."
- entrega: "Já faz 20 dias e não chegou nem o código de rastreio."
- arrependimento: "Comprei por impulso e preciso do dinheiro."
A classificação dos feedbacks do seed é preenchida pelo próprio script (é dado fictício); a IA 2 só roda ao vivo no fluxo de reembolso.
 
---
 
## 8. As 4 chamadas de IA
 
Helper em `lib/groq.ts`:
 
```ts
import Groq from "groq-sdk";
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
 
export async function generateJSON<T>(prompt: string, schema: object, name: string): Promise<T> {
  const res = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL ?? "openai/gpt-oss-20b",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_schema", json_schema: { name, schema, strict: true } },
    temperature: 0.2,
  });
  return JSON.parse(res.choices[0]?.message.content ?? "{}") as T;
}
```

> Structured outputs do Groq (modo `strict`, suportado por `openai/gpt-oss-20b` e `openai/gpt-oss-120b`): **todo campo precisa estar em `required` e todo objeto precisa de `additionalProperties: false`**. Por isso os campos "opcionais" (`rewrite`, `relatedClaim`, `helpOffer`, `suggestedAction`) são obrigatórios nos schemas e vêm como `""` quando não se aplicam; o Route Handler converte `""` em `undefined` antes de devolver para a tela. Structured outputs não funcionam com streaming.
 
### IA 1 — `POST /api/check-claims`
**Entrada:** `{ productId, script }` → servidor busca `salesPageText` e `contentOutline`.
 
**Prompt:**
```
Você é um revisor de conformidade de divulgação de produtos para creators afiliados no Brasil.
Sua tarefa: extrair do ROTEIRO todas as promessas ou afirmações sobre o produto e verificar cada uma contra a FONTE OFICIAL (página de vendas e conteúdo real).
 
Classifique cada promessa:
- "sustentada": a fonte oficial confirma.
- "exagerada": tem base na fonte, mas aumenta resultado, prazo ou facilidade.
- "proibida": garante ganho financeiro, promete resultado de saúde/emagrecimento, contradiz a fonte, ou viola regras de publicidade (CONAR) ou de alegações de saúde (ANVISA).
 
Para cada promessa: copie o trecho literal do roteiro; cite o trecho da fonte que sustenta ou contradiz (string vazia se não houver); explique em 1 frase simples; se não for "sustentada", sugira uma reescrita persuasiva, no tom do creator, que seja verdadeira (string vazia se for "sustentada").
Não invente informações que não estejam na fonte. Ignore frases que não são afirmações sobre o produto (ex.: "link na bio").
 
FONTE OFICIAL — Página de vendas:
{salesPageText}
FONTE OFICIAL — Conteúdo real:
{contentOutline ou "não disponível"}
 
ROTEIRO:
{script}
```
 
**Schema:**
```ts
export const checkClaimsSchema = {
  type: "object",
  properties: {
    claims: { type: "array", items: { type: "object", properties: {
      text: { type: "string" },
      status: { type: "string", enum: ["sustentada", "exagerada", "proibida"] },
      evidence: { type: "string" },
      reason: { type: "string" },
      rewrite: { type: "string" },   // "" se sustentada
      category: { type: "string", enum: ["ganho_financeiro","resultado_saude","prazo","conteudo","garantia","outro"] }
    }, required: ["text","status","evidence","reason","rewrite","category"], additionalProperties: false } },
    overallRisk: { type: "string", enum: ["baixo","medio","alto"] }
  },
  required: ["claims","overallRisk"],
  additionalProperties: false
};
```
 
### IA 2 — `POST /api/classify-feedback`
**Entrada:** `{ productId, contentId, text }` → servidor busca a página do produto e as claims do conteúdo de origem.
 
**Prompt:**
```
Você analisa pedidos de reembolso em uma plataforma de vendas online.
Classifique o texto do COMPRADOR em um tipo de frustração:
expectativa_desalinhada | acesso_tecnico | qualidade_conteudo | entrega_logistica | arrependimento_pessoal.
Defina a gravidade (baixa/media/alta) considerando risco de reclamação pública.
Se for expectativa_desalinhada, indique qual PROMESSA DO CONTEÚDO DE ORIGEM provavelmente gerou a expectativa (texto literal da lista, ou vazio).
Indique se existe uma ajuda que pode resolver o problema sem reembolso (ex.: acesso travado), ou string vazia se não houver — nunca sugira dificultar o reembolso.
 
PRODUTO (página oficial): {salesPageText}
PROMESSAS DO CONTEÚDO DE ORIGEM: {claims[].text}
TEXTO DO COMPRADOR: {text}
```
 
**Schema:**
```ts
export const classifyFeedbackSchema = {
  type: "object",
  properties: {
    type: { type: "string", enum: ["expectativa_desalinhada","acesso_tecnico","qualidade_conteudo","entrega_logistica","arrependimento_pessoal"] },
    severity: { type: "string", enum: ["baixa","media","alta"] },
    relatedClaim: { type: "string" }, // "" se não houver
    summary: { type: "string" },
    helpOffer: { type: "string" }   // "" se não houver
  },
  required: ["type","severity","relatedClaim","summary","helpOffer"],
  additionalProperties: false
};
```
 
### IA 3 — `POST /api/insight`
**Entrada:** `{ scope: "creator" | "case", id }` → servidor monta os agregados (`lib/data.ts`).
 
- **scope=creator:** agregados por conteúdo (vendas, reembolsos, taxa, claims com status) → insight para o creator.
- **scope=case:** feedback + venda + conteúdo + horas sem resposta do produtor → resumo do caso e ação sugerida para Operações.
**Prompt (creator):**
```
Você é um analista de performance para creators afiliados. Com base nos dados abaixo, escreva até 3 insights curtos e acionáveis (máx. 2 frases cada) mostrando quais promessas ou conteúdos estão ligados a mais reembolso e o que mudar. Tom: direto, amigável, sem julgar. Use números dos dados.
DADOS: {json}
```
**Prompt (case):**
```
Resuma este caso para a equipe de Operações em 2 frases e sugira 1 ação (ex.: acionar produtor, oferecer suporte de acesso, reembolsar proativamente, revisar conteúdo do creator). Não atribua culpa definitiva; indique a hipótese mais provável.
CASO: {json}
```
 
**Schema (ambos):**
```ts
export const insightSchema = {
  type: "object",
  properties: {
    items: { type: "array", items: { type: "object", properties: {
      title: { type: "string" }, body: { type: "string" }
    }, required: ["title","body"], additionalProperties: false } },
    suggestedAction: { type: "string" }   // "" no scope=creator
  },
  required: ["items","suggestedAction"],
  additionalProperties: false
};
```
 
---
 
### IA 4 — `POST /api/check-page`
**Entrada:** `{ productId, url }`, `{ productId, images }` (prints) ou `{ productId, text }`. Com `url`, o servidor (`lib/page-scan.ts`) valida (só `http(s)`; bloqueia localhost, IPs privados, loopback e link-local, exceto o próprio host do app), busca a página (timeout 8 s, até 1 MB, só `text/html`, até 3 redirects revalidados) e extrai o texto visível (sem `script`/`style` e sem elementos com `data-prometia-ignore`; corta em 6000 caracteres). Texto com menos de 80 caracteres → `422 { code: "unreadable" }` e a tela pede o texto colado.

**Fontes:** a ficha cadastrada do produto (`salesPageText`) + `contentOutline` + regras CONAR/ANVISA. Prompt em `checkPagePrompt` (`lib/prompts.ts`): mesmas regras de "SEMPRE proibida" da IA 1, depoimentos também contam como promessa, a reescrita usa só o que a ficha sustenta e nunca fica vazia em promessa não sustentada.

**Schema:** igual ao da IA 1, com `refundRisk` (`baixo|medio|alto`) em cada promessa e `summary` (1 frase) no topo. Modelo: `GROQ_PAGE_MODEL` (padrão `openai/gpt-oss-120b`; o 20b gerou JSON inválido com este schema).

**Prints (OCR):** `images` = 1 a 3 data URLs PNG/JPEG/WEBP (até 1,5 MB de base64 cada, 4 MB no total; `lib/page-images.ts`), já reduzidas no navegador (até 1280 × 2400 px, JPEG 0,85). O modelo de visão (`GROQ_VISION_MODEL`, padrão `qwen/qwen3.8-27b`, em preview; no plano gratuito, 7.000 tokens de entrada/min, e 3 prints ≈ 6.300) só transcreve o texto (`PAGE_OCR_PROMPT`, schema `{ text }`, cache `page-ocr` pelo conteúdo das imagens, plano B para os prints de exemplo). O texto segue para a mesma análise. Menos de 80 caracteres → `422 { code: "unreadable" }`.

**Resposta:** `{ claims, overallRisk, summary, pageText, source, notice }`. Chave do cache: `{ productId, text }` (URL ou texto colado caem no mesmo cache). Fallback: `DEMO_CHECK_PAGE` para o texto da página de exemplo.

---
 
## 9. Cache e plano B da demo (`lib/cache.ts`)
 
- Chave do cache = hash de (`rota` + entrada normalizada).
- Fluxo: se a chave existe em `data/ai-cache.json` → retorna o cache (com um pequeno delay artificial de 600–900 ms, para parecer ao vivo). Senão → chama o Groq; se der certo, salva em memória (em dev, também grava no arquivo).
- Se o Groq falhar ou passar de 15 s → retorna uma resposta de fallback pré-escrita para os inputs da demo e mostra um toast discreto ("modo demonstração").
- Antes de gravar a demo: rodar a história inteira uma vez em dev para popular o `ai-cache.json` e commitar.
---
 
## 10. Telas
 
**Visual geral:** seguir o design system da seção 14 (paleta e tokens da YouShop). Status: ✅ verde (sustentada), ⚠️ âmbar (exagerada), ❌ vermelho (proibida). Logo textual "PrometIA" + tagline "O que prometia, entrega". Header com **RoleSwitcher** (Creator · Comprador · Produtor · Operações YouShop) e botão "?" que reabre o tour (seção 15). Toda tela tem um subtítulo de 1 linha explicando o que ela demonstra (ajuda na apresentação).
 
### Landing (`/`)
Uma frase do problema, uma frase da solução, um diagrama de 3 passos (Antes de postar → Depois da venda → Aprendizado) e 4 botões de perfil.
 
### M1 — Checador (`/creator/checador`) — P0
- Esquerda: Select do produto, Textarea do roteiro, botão "Usar roteiro de exemplo", botão **"Checar promessas"**.
- Direita: estado vazio → skeleton durante o carregamento → badge de risco geral + lista de **ClaimCard** (trecho do roteiro destacado, StatusBadge, evidência em citação, motivo, reescrita com botão "copiar").
- Rodapé do resultado: botão **"Gerar link deste conteúdo"** → mostra o link `youshop.co/r/{handle}/{slug-produto}?c={novoId}` com botão copiar + texto "Assim você vai saber exatamente quais vídeos vendem e quais geram reembolso."
- Banner fixo pequeno: "O PrometIA orienta, não bloqueia. A decisão de publicar é sua."
### M2a — Reembolso (`/comprador/reembolso`) — P0
- Dentro de um **PhoneFrame** (moldura de celular), imitando "Minhas Compras > Pedido > Solicitar reembolso".
- Pedido mostrado: Renda com Reels, R$ 297, comprado via conteúdo da Ana.
- Campos: motivo (select simples) + textarea "O que você esperava e o que recebeu?" (pré-preencher com o texto da demo via botão).
- Ao enviar → chama a IA 2 → mostra um card "Entendemos seu caso" com o resumo. Se `helpOffer` existir → oferece a ajuda **e** mostra o botão **"Continuar com o reembolso"** com o mesmo destaque. O reembolso nunca fica escondido.
- Painel lateral (fora do celular), "O que a YouShop vê": tipo, gravidade, promessa relacionada, conteúdo de origem.
### M2b — Obrigado + YouClass (`/comprador/obrigado`, `/comprador/youclass`) — P1
- Obrigado: "Pagamento aprovado 🎉" + pergunta "O que você espera conseguir com este produto?" com os chips do produto + "Pular". Ao marcar → vai para o YouClass.
- YouClass: mock da área de membros (lista de módulos) + card flutuante "Está sendo o que você esperava?" 👍 😐 👎. Ao clicar 👎 → link "Precisa de ajuda ou quer solicitar reembolso?" → M2a.
### M3 — Meus conteúdos (`/creator/conteudos`) — P1
- Filtro pela creator (padrão: Ana).
- KPIs no topo: vendas, taxa de reembolso, **"vendas que ficam"** (vendas − reembolsos − chargebacks), comissão preservada vs. perdida.
- Tabela: conteúdo, canal, vendas, reembolsos, taxa (com barra), promessa de maior risco (badge).
- Gráfico de barras: taxa de reembolso por conteúdo, colorida pelo pior status de promessa.
- Card **"Insights do PrometIA"** (IA 3, scope=creator).
### M4 — Saúde da Promessa (`/operacoes`, `/produtor`) — P0 (versão simples)
- KPIs: vendas que ficam, taxa de reembolso, % de reembolsos por expectativa desalinhada, casos na fila.
- Tabela por produto e por creator (taxa de reembolso, % expectativa, promessas proibidas ativas).
- Gráfico: tipos de frustração (barras).
- **Fila de escalonamento:** feedbacks com gravidade alta **e** (produtor sem resposta ou >48h). Cada linha: comprador (anonimizado), produto, creator/conteúdo, horas sem resposta, badge de gravidade, botão "Ver caso" → Dialog com o resumo da IA 3 (scope=case) + ação sugerida + botões mock ("Acionar produtor", "Reembolsar proativamente", "Revisar conteúdo").
- `/produtor` reaproveita os componentes, filtrando pelos produtos do produtor (sem a fila global; mostra "casos dos seus produtos").
---
 
### M5 — Checador da página de vendas (`/produtor/checador`) + página fictícia (`/paginavendas`)
- Para o produtor testar a própria página antes de divulgar. **Link ou prints, um ou outro** (como o creator: roteiro ou vídeo). Campo **URL da página de vendas** com **"Usar página de exemplo"** (preenche `{origin}/paginavendas` e seleciona TermoSlim) e link para abrir a página; divisor "ou"; área **"Enviar prints da página"** (até 3, clicar ou arrastar, miniaturas removíveis) com **"Usar prints de exemplo"** (`public/demo/paginavendas-{1,2,3}.jpg`, enviados sem redimensionar para bater com o cache). Se a URL não puder ser lida → aviso "Envie prints dela" na área de prints.
- Resultado no visual do M1: risco geral, contagem por status, resumo da IA, "Promessas assim geram reembolso por expectativa desalinhada.", um `ClaimCard` por promessa (evidência rotulada "Ficha do produto" + badge de risco de reembolso) e "Texto lido da página" recolhido.
- `/paginavendas`: página de vendas **fictícia** do TermoSlim (NutriMax), visual de infoproduto apelativo, sem header/rodapé/tour do PrometIA, com faixa "Página fictícia criada para a demonstração do PrometIA" (fora da leitura). Mistura planejada: 5 promessas proibidas, 2 exageradas, 2 sustentadas (+ depoimentos).
- Atalho "Checar minha página de vendas" em `/produtor` e item na subnav do produtor.

---
 
## 11. Fora do escopo (não implementar)
 
Login e autenticação, banco de dados, integração com a API real da YouShop, envio real de WhatsApp/e-mail, pagamentos, upload e transcrição de vídeo (P2, só se sobrar tempo; prints da página de vendas entram via M5), testes automatizados extensivos, internacionalização.
 
---
 
## 12. Ordem de tarefas
 
**Dia 1 (sábado)**
1. Criar o projeto Next.js + Tailwind + shadcn/ui; aplicar o design system da seção 14 (globals.css + Inter); layout, RoleSwitcher, rodapé de aviso e landing.
2. `lib/types.ts`, `data/products.json`, `creators.json`, `contents.json` (seção 6).
3. `scripts/generate-seed.ts` → `sales.json`, `feedback.json`. Conferir no console se os padrões da seção 7 aparecem.
4. `lib/data.ts` com as agregações (por conteúdo, creator, produto; fila de escalonamento).
**Dia 2 (domingo)**
5. `lib/groq.ts`, `prompts.ts`, `schemas.ts`, `cache.ts`.
6. M1 Checador completo, com a IA 1.
7. M2a Reembolso completo, com a IA 2.
8. Rodar a história da demo e ajustar os prompts até o resultado da seção 2 sair consistente.
 
**Dia 3 (segunda)**
9. M4 Saúde da Promessa + fila + IA 3 (case).
10. M2b Obrigado + YouClass. M3 Meus conteúdos + IA 3 (creator).
10b. Tour de boas-vindas (seção 15) — por último, quando as telas já existem.
11. Popular o `ai-cache.json`, deploy na Vercel, testar o link público em aba anônima e no celular.
12. Gravar a demo (2–3 min) como garantia.
 
---
 
## 13. Critérios de aceite
 
- [ ] Link público abre sem login e sem erros no console.
- [ ] A história da seção 2 roda do início ao fim em < 3 min.
- [ ] O roteiro de demo gera sempre as 3 promessas esperadas (✅ ⚠️ ❌), via IA ou cache.
- [ ] O fluxo de reembolso sempre mostra "Continuar com o reembolso".
- [ ] O painel mostra claramente que conteúdos com promessa proibida têm taxa de reembolso ~3x maior.
- [ ] A fila de escalonamento contém o caso da demo.
- [ ] A chave do Groq nunca aparece no navegador.
- [ ] Funciona bem em tela de notebook (1366px+) e o PhoneFrame é legível.
- [ ] Visual coerente com a YouShop (verde-limão + azul-marinho, Inter), sem logo da YouShop e com o rodapé de aviso em todas as telas.
- [ ] O tour abre na primeira visita, pode ser pulado e reaberto pelo "?".
---
 
## 14. Design system (alinhado à YouShop)
 
Extraído do site youshop.co (21/11/2026). **A YouShop usa shadcn/ui com estas variáveis CSS**, então basta colar no `app/globals.css` e os componentes shadcn já ficam com a cara deles.
 
```css
:root {
  --font-size: 14px;
  --background: #ffffff;
  --foreground: oklch(0.145 0 0);
  --card: #ffffff;
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: #9fef14;              /* verde-limão: botões principais, destaques */
  --primary-foreground: #173359;   /* azul-marinho: texto sobre o verde */
  --secondary: #173359;            /* azul-marinho: hero, header escuro, seções de destaque */
  --secondary-foreground: #ffffff;
  --muted: #ececf0;
  --muted-foreground: #717182;
  --accent: #e9ebef;
  --accent-foreground: #030213;
  --destructive: #d4183d;
  --destructive-foreground: #ffffff;
  --border: #0000001a;
  --input: transparent;
  --input-background: #f3f3f5;
  --ring: oklch(0.708 0 0);
  --radius: 0.625rem;
}
html { font-size: var(--font-size); scroll-behavior: smooth; }
```
 
**Tipografia:** Inter (via `next/font/google`), pesos 400 e 500; títulos em 600–700.
 
**Padrões visuais observados no site:**
- **Hero/fundos de destaque:** gradiente azul-marinho `linear-gradient(to bottom right, #173359 0%, rgb(23 51 89 / .9) 50%, rgb(23 51 89 / .8) 100%)` com texto branco e **palavras-chave em verde-limão** (ex.: "A estrutura **360°** de vendas…").
- **Botões principais:** fundo `#9fef14`, texto `#173359`, raio ~6–7px, peso 500.
- **Selo/eyebrow acima dos títulos:** texto pequeno em maiúsculas, verde-limão, ou pill com fundo verde a 10% (`rgb(159 239 20 / .1)`).
- **Títulos de seção:** azul-marinho com parte da frase em verde (ex.: "A plataforma que **resolve todos os seus problemas**").
- **Cards:** brancos, raio ~12px, sombra suave, borda `#0000001a`.
- **Chips/pills:** totalmente arredondados (`rounded-full`).
- **Destaque sutil:** gradiente `to right` de verde 10% → transparente.
**Cores de status do PrometIA** (complementam a paleta):
- sustentada: verde `oklch(0.627 0.194 149.214)` (texto) / fundo verde 10%
- exagerada: âmbar `#d97706` / fundo `#fef3c7`
- proibida: `--destructive` `#d4183d` / fundo `#fde8ec`
**Regras de identidade (importante):**
- **Não usar o logo nem a marca "YouShop" como se o app fosse deles.** A marca do protótipo é **PrometIA**; pode aparecer "um conceito para o ecossistema YouShop".
- Rodapé fixo em todas as telas: *"Protótipo conceitual · Desafio de Inovação YouShop 2027 · não oficial · todos os dados são fictícios."*
- Telas que imitam fluxos da plataforma (página de obrigado, Minhas Compras, YouClass) levam um selo **"Simulação"** no canto e **não têm campos de login, senha ou pagamento**.
---
 
## 15. Tour de boas-vindas (onboarding de primeira visita)
 
**Biblioteca:** `driver.js` (leve, destaca elementos com spotlight e popover). Alternativa: `react-joyride`.
 
**Comportamento:**
- Abre automaticamente na primeira visita (flag `prometia_tour_done` no `localStorage`, dentro de try/catch; se falhar, simplesmente mostra o tour).
- Botões: "Próximo", "Voltar", "Pular tour". Barra de progresso ("3 de 9").
- Botão **"?"** no header reabre o tour a qualquer momento.
- Popovers com o visual da seção 14: fundo branco, título azul-marinho, botão "Próximo" verde-limão.
- Steps que apontam para outra página navegam antes de destacar (`router.push` + aguardar o elemento existir).
**Passos:**
 
| # | Onde | Destaque | Texto (curto) |
|---|---|---|---|
| 1 | Landing | Modal central (sem destaque) | **"Seja bem-vindo ao PrometIA 👋"** Este é o meu projeto para o Desafio de Inovação do Programa de Estágio YouShop 2027. Em 2 minutos eu te mostro como ele funciona. — *Filippo* |
| 2 | Landing | Bloco do problema | **O problema:** o que é prometido na divulgação e o que o comprador recebe nunca são conferidos. A diferença só aparece no fim, como reembolso, chargeback ou reclamação pública. |
| 3 | Landing | Diagrama de 3 passos | **A solução:** checar a promessa antes de postar, ouvir o comprador depois da venda e transformar isso em aprendizado. |
| 4 | Header | RoleSwitcher | **Troque de perspectiva aqui.** Creator, Comprador, Produtor e Operações YouShop. Cada um vê o mesmo problema de um ângulo. |
| 5 | /creator/checador | Botão "Usar roteiro de exemplo" + "Checar promessas" | **Comece pelo creator.** Use o roteiro de exemplo e veja a IA classificar cada promessa. |
| 6 | /comprador/reembolso | PhoneFrame | **Depois, o comprador.** Simulação do pedido de reembolso: a IA entende o motivo e liga ao conteúdo que gerou a venda. O reembolso nunca é escondido. |
| 7 | /produtor/checador | Painel de entrada | **O produtor também promete.** Ele cola a URL da página de vendas ou envia prints, e a IA mostra quais promessas viram reembolso. |
| 8 | /operacoes | Fila de escalonamento | **E a YouShop enxerga antes.** Casos com frustração alta e produtor sem resposta aparecem aqui antes de virarem reclamação pública. |
| 9 | Header | Botão "?" | **Pronto!** Explore livremente. Você pode rever este tour pelo "?". Todos os dados são fictícios. |
 
**Bônus (P1):** na landing, um botão **"Ver a demo guiada"** que roda a história da seção 2 passo a passo (o mesmo tour, mas preenchendo os exemplos automaticamente). Útil se o avaliador não quiser clicar em nada.
 