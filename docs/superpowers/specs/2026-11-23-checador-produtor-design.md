# Design — Checador do Produtor (página de vendas)

Data: 23/11/2026 · Status: aprovado na conversa, aguardando revisão do documento

## Intenção e porquê

Hoje o PrometIA só checa o roteiro do creator. Mas o produtor também pode fazer promessas absurdas na própria página de vendas, e elas geram reembolso do mesmo jeito. O Checador do Produtor é uma ferramenta **para o produtor** testar a própria página: ele cola a URL, o PrometIA lê os textos e mostra quais promessas podem gerar reembolso, com sugestão de reescrita.

Premissa de mercado: as páginas públicas da YouShop confirmam que as vendas passam pelo checkout da YouShop. Não confirmam que o produtor tem uma página de vendas externa. É uma premissa plausível, comum no mercado, e fica assumida no protótipo.

## Metas

- O produtor cola a URL da página de vendas e recebe as promessas classificadas, com o risco de reembolso.
- A demo funciona sempre: existe uma página de vendas fictícia dentro do próprio app (`/paginavendas`) e um botão "Usar página de exemplo".
- Tudo em português do Brasil.

## Não-metas

- Renderizar páginas que montam o texto via JavaScript (sem navegador headless).
- Monitorar a página continuamente ou salvar histórico de checagens.
- Integração real com a YouShop ou cadastro de URL no produto.

## Anti-metas (seria um fracasso mesmo funcionando)

- A demo quebrar por falta de internet ou por erro do Groq.
- A página fictícia parecer uma página real de alguma marca existente, ou parecer parte do PrometIA.
- O fetch de URL virar uma porta para acessar endereços internos (SSRF).

## Restrições

- `GROQ_API_KEY` só no servidor; a chamada de IA fica em Route Handler.
- O rodapé de aviso é obrigatório em todas as telas (seção 14 do SPEC).
- Segue os padrões que já existem: `withAICache` (`lib/cache.ts`), fallbacks (`lib/fallbacks.ts`), prompts (`lib/prompts.ts`), schemas strict do Groq (`lib/schemas.ts`), `ClaimCard`/`StatusBadge`.

## Abordagens consideradas

1. **URL com fallback para texto colado (escolhida).** Fetch no servidor e extração do texto visível. Se o fetch falhar, a tela pede o texto colado. Botão "Usar página de exemplo" com cache. É um pouco mais de trabalho (segurança do fetch), mas mantém a ideia da URL e não quebra na demo.
2. **Só texto colado.** É mais simples e previsível, mas perde a parte da URL, que é o que torna a funcionalidade concreta.
3. **Navegador headless (descartada).** Pesado demais para um protótipo na Vercel.

O Filippo escolheu a 1 e definiu a página fictícia em `/paginavendas`, com identidade visual bem diferente do PrometIA.

## Design

### 1. Página fictícia `/paginavendas`

- Produto: **TermoSlim**, da NutriMax (`p_slim`). Foi escolhido porque as promessas de saúde mostram o lado ANVISA, que a demo do creator não cobre, e porque não contradiz a página-fonte do Renda com Reels usada no Checador do creator.
- Visual "infoproduto apelativo", bem diferente do PrometIA: fundo escuro, vermelho e amarelo, contador regressivo, depoimentos, selo de "garantia", botão grande de CTA (que não faz nada, ou rola até o topo).
- Layout próprio: sem o Header, o RoleSwitcher e o tour do PrometIA. Mantém uma faixa pequena "Página fictícia criada para a demonstração do PrometIA · dados fictícios", marcada com `data-prometia-ignore` para o scan ignorar.
- O texto da página tem uma mistura planejada de promessas (fica em `data/sales-page-demo.ts` ou junto da página):
  - **proibidas:** "seque 10 kg em 15 dias sem dieta", "queima gordura enquanto você dorme", "resultado garantido ou seu dinheiro de volta em dobro", "aprovado por médicos" (sem fonte), "substitui a academia";
  - **exageradas:** "energia o dia inteiro", "acelera o metabolismo em até 3x";
  - **sustentadas:** "cafeína e chá verde", "auxilia no foco e na disposição para treinos".
- Marca fictícia (NutriMax já é do seed). Sem logos ou nomes de marcas reais.

### 2. Tela `/produtor/checador`

- Subtítulo de 1 linha: "Teste a sua página de vendas antes de divulgar: promessas exageradas viram reembolso."
- Seletor de produto (produtos do produtor; o exemplo seleciona TermoSlim).
- Campo **URL da página de vendas** + botão "Checar página".
- Botão **"Usar página de exemplo"**: preenche `{origin}/paginavendas`, seleciona TermoSlim e tem um link "abrir a página" (nova aba) para o avaliador ver a página fictícia.
- Se o servidor não conseguir ler a URL: mensagem clara ("Não conseguimos ler essa página. Cole o texto dela abaixo.") e um textarea para colar o texto. O botão passa a checar o texto colado.
- Resultado, no mesmo visual do Checador do creator:
  - topo: risco geral (baixo/médio/alto), contagem ✅ / ⚠️ / ❌ e a frase "Promessas assim geram reembolso por expectativa desalinhada.";
  - um card por promessa: trecho literal, status, motivo, **risco de reembolso** (baixo/médio/alto), reescrita sugerida;
  - um trecho "Texto lido da página" (recolhido) para mostrar que o scan funcionou.
- Link de entrada a partir de `/produtor` (card ou botão "Checar minha página de vendas").

### 3. IA 4 — `POST /api/check-page`

**Entrada:** `{ productId, url }` ou `{ productId, text }`.

**Fluxo:**
1. Se veio `url`: validar (só `http:`/`https:`; recusar `localhost`, IPs privados/loopback/link-local, **exceto** quando a URL aponta para o próprio host do app, para a página de exemplo funcionar em dev e em produção). Fetch com timeout de 8 s, limite de 1 MB, `User-Agent` genérico, só `text/html`.
2. Extrair o texto visível: remover `script`, `style`, `noscript`, `svg` e elementos com `data-prometia-ignore`; tirar as tags; normalizar os espaços; cortar em ~6000 caracteres. Sem dependência nova, se der para fazer com regex simples; senão, uma lib leve de parse de HTML.
3. Se o texto tiver menos de ~80 caracteres → erro `422` com `code: "unreadable"` (a tela mostra o textarea).
4. `withAICache({ route: "check-page", input: { productId, text }, ... })` com fallback pré-escrito para o texto da página de exemplo.

**Fontes no prompt:** a ficha cadastrada do produto (`salesPageText` do seed, que passa a ser lido como "descrição oficial cadastrada"), o `contentOutline` quando existir, e as regras CONAR/ANVISA.

**Prompt (rascunho):**
```
Você é um revisor de conformidade de páginas de vendas no Brasil e ajuda o PRODUTOR a evitar reembolsos.
Extraia da PÁGINA DE VENDAS todas as promessas ou afirmações sobre o produto e verifique cada uma contra a FICHA DO PRODUTO e as regras de publicidade (CONAR) e de alegações de saúde (ANVISA).

Classifique cada promessa:
- "sustentada": a ficha confirma e não viola regras.
- "exagerada": tem base na ficha, mas aumenta resultado, prazo ou facilidade.
- "proibida": garante ganho financeiro, promete resultado de saúde/emagrecimento, contradiz a ficha, ou viola CONAR/ANVISA.

Para cada promessa: copie o trecho literal; cite o trecho da ficha que sustenta ou contradiz (string vazia se não houver); explique em 1 frase simples; estime o risco de reembolso (baixo/médio/alto) pensando em um comprador que acredita na frase; se não for "sustentada", sugira uma reescrita persuasiva e verdadeira (string vazia se for "sustentada").
Ignore textos que não são afirmações sobre o produto (menus, rodapé, avisos legais).

FICHA DO PRODUTO:
{salesPageText}
CONTEÚDO REAL:
{contentOutline ou "não disponível"}

PÁGINA DE VENDAS:
{text}
```

**Schema:** o mesmo do `checkClaimsSchema`, com `refundRisk: enum ["baixo","medio","alto"]` em cada claim e um `summary` (1 frase) no topo. Tudo em `required`, `additionalProperties: false`.

**Resposta:** `{ claims, overallRisk, summary, pageText, source, notice }`. O `pageText` volta para a seção "Texto lido da página".

### 4. Atualizações de documentação e tour

- SPEC: a seção 8 passa a ter 4 chamadas de IA (IA 4), a seção 10 ganha `/paginavendas` e `/produtor/checador`, e a seção 4 ganha as pastas novas. O README é atualizado de acordo.
- Tour: um passo novo entre o 6 (comprador) e o 7 (operações), em `/produtor/checador`, destacando "Usar página de exemplo": **"O produtor também promete."** Ele cola a URL da página de vendas e a IA mostra quais promessas viram reembolso.
- Rodar o fluxo uma vez em dev para popular o `ai-cache.json` e commitar.

## Decisões que ficaram para o builder

- A lib de extração de HTML (regex simples ou lib leve): o critério é funcionar bem com a página de exemplo e não pesar no bundle do servidor.
- A cópia exata dos textos da página fictícia, desde que tenha a mistura de promessas descrita acima.
- Detalhes visuais da página fictícia, desde que fique claramente diferente do PrometIA.

## Chamadas que eu (Claude) fiz e o Filippo pode revisar

- Rota da tela: `/produtor/checador`; rota da IA: `/api/check-page`.
- Exceção de SSRF para o próprio host do app.
- `refundRisk` por promessa, além do status.
- Novo passo do tour na posição 7 (Operações vira o 8 e o "Pronto!" vira o 9).
