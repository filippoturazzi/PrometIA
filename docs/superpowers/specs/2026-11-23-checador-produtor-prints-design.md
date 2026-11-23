# Design — Checador do Produtor: link **ou** prints

Data: 23/11/2026 · Status: aguardando aprovação · Complementa `2026-11-23-checador-produtor-design.md`

## Intenção e porquê

O produtor escolhe como enviar a página de vendas: pelo **link** (como hoje) **ou** por **prints** da página, um ou outro. É o mesmo formato do Checador do creator, que oferece "roteiro" ou "anexar vídeo". A diferença é que aqui os prints funcionam de verdade. O campo de colar texto sai da tela.

## Metas

- Enviar até 3 prints; um OCR lê o texto e as promessas passam pela mesma análise do link.
- A mesma página dá o mesmo resultado, venha do link ou dos prints, porque a análise é a mesma (IA 4).
- A demo funciona sem a IA: botão "Usar prints de exemplo", com o resultado salvo no cache.
- Quando o link não puder ser lido, a tela sugere enviar prints.

## Não-metas

- Vídeo continua fora do escopo (seção 11 do SPEC).
- Recortar automaticamente prints de página inteira muito altos.
- Guardar os prints: eles só existem durante a checagem.

## Anti-metas

- A demo quebrar porque o modelo de visão (em preview) mudou ou bateu limite.
- Um upload grande travar ou derrubar a função do servidor.

## Abordagens consideradas

1. **OCR com modelo de visão do Groq + a mesma IA 4 (escolhida pelo Filippo).** O `qwen/qwen3.8-27b` só transcreve o texto, e o texto segue pelo caminho atual (prompt, 120b, cache, "Texto lido da página"). São duas chamadas, uns 5 a 10 s a mais, e o modelo de visão está em preview.
2. **Uma chamada com o modelo de visão.** Seria mais rápida, mas a classificação viria de outro modelo, que pode discordar da análise do link, e não aproveitaria o cache por texto.
3. **Tesseract.js no navegador.** É grátis, mas erra em texto sobre imagem e em títulos estilizados, e baixa dados de idioma pesados.

## Design

### Tela `/produtor/checador`

- O seletor de produto continua igual.
- **URL da página de vendas**, com "Usar página de exemplo" (como hoje).
- Divisor "ou".
- **Enviar prints da página**: área de clicar ou arrastar, até 3 imagens (PNG, JPG ou WEBP), com miniaturas e botão de remover. Embaixo, o link **"Usar prints de exemplo"** e a dica "Até 3 prints. Para páginas longas, tire um print por parte da página."
- Um ou outro: escolher prints limpa a URL, e digitar uma URL limpa os prints.
- Quando a URL não pode ser lida (`422`), o aviso diz: "Não conseguimos ler essa página. Envie prints dela." O aviso fica acima da área de prints.
- Etapas de carregamento com prints: "Lendo os prints", "Extraindo promessas", "Estimando risco de reembolso".
- O resultado não muda. "Texto lido da página" mostra o texto que o OCR leu.
- O campo de colar texto sai da tela.

### Imagens no navegador (minha decisão)

- Cada print é redimensionado num canvas para no máximo 1280 px de largura e 2400 px de altura, mantendo a proporção. Depois vira JPEG com qualidade 0,85 e é enviado como data URL.
- O motivo é ficar bem abaixo do limite de envio das funções serverless (cerca de 4 a 6 MB) e do limite do modelo.

### API — `POST /api/check-page`

- Entrada nova: `{ productId, images: string[] }`, alternativa a `url`. O `text` continua aceito na API, porque os testes e o `try-ai` usam, mas a tela não oferece mais.
- Validação, que devolve `400` com mensagem em pt-BR:
  - de 1 a 3 imagens;
  - cada uma é uma data URL `image/png`, `image/jpeg` ou `image/webp`;
  - cada uma tem até 1,5 MB em base64, e o total fica em até 4 MB.
- Fluxo: `withAICache({ route: "page-ocr", input: { images } })` → texto → mesma validação de tamanho do texto. Se der menos de 80 caracteres, devolve `422` com "Não conseguimos ler texto nesses prints." Depois segue o fluxo atual da IA 4, com cache por `{ productId, text }`.
- A chave do cache do OCR é um hash do conteúdo das imagens. O `cacheKey` já faz sha256 da entrada, então não precisa mudar nada.

### OCR — `runPageOcr(images: string[]): Promise<string>` em `lib/ai.ts`

- Modelo `GROQ_VISION_MODEL`, com padrão `qwen/qwen3.8-27b`.
- Schema strict `{ text: string }`.
- Prompt (rascunho): "Transcreva TODO o texto visível nestas imagens de uma página de vendas, na ordem de leitura (de cima para baixo, imagem por imagem). Um bloco de texto por linha. Copie exatamente, sem resumir, traduzir ou comentar. Ignore só elementos de interface do navegador."
- O texto lido passa pela mesma normalização de linhas do texto da URL.
- Fallback: para os prints de exemplo, devolve o texto da página fictícia, montado a partir de `DEMO_PAGE`. Assim o fallback atual da IA 4 (que procura a assinatura) também funciona.

### Prints de exemplo

- Capturas da `/paginavendas` em 3 partes, sem a faixa de aviso e sem o contador, salvas em `public/demo/paginavendas-1.jpg`, `-2.jpg` e `-3.jpg`, já no tamanho e na qualidade do redimensionamento.
- "Usar prints de exemplo" carrega essas imagens pelo mesmo caminho de um upload. O OCR delas e a análise ficam no `ai-cache.json`.

### Documentação e tour

- SPEC: a IA 4 ganha a entrada por prints (OCR) e a seção 11 explica que vídeo continua fora e imagem entra. Atualizar também o README e o `try-ai`.
- Texto do passo 7 do tour: "Ele cola a URL da página de vendas **ou envia prints**, e a IA mostra quais promessas viram reembolso."

## Riscos

- O modelo de visão está em **preview** e não achei o limite dele no plano gratuito. Por isso o `GROQ_VISION_MODEL` é configurável, e a demo depende do cache e do fallback, não do modelo ao vivo.
- Cada imagem custa 2048 tokens. Com 3 prints e o prompt, são uns 7.000 tokens só no OCR.

## Decisões que ficaram para o builder

- Componente de upload (input nativo + drag and drop; sem dependência nova).
- Visual da área de prints, seguindo o "Anexar vídeo" do creator, mas ativo.
