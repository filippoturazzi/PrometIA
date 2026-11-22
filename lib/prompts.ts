// Os 3 prompts da seção 8 do SPEC (texto fiel; só a interpolação é código).

import type { Claim, Product } from "@/lib/types";

export function checkClaimsPrompt(product: Product, script: string) {
  const outline = product.contentOutline?.length
    ? product.contentOutline.join("\n")
    : "não disponível";
  return `Você é um revisor de conformidade de divulgação de produtos para creators afiliados no Brasil.
Sua tarefa: extrair do ROTEIRO todas as promessas ou afirmações sobre o produto e verificar cada uma contra a FONTE OFICIAL (página de vendas e conteúdo real).

Classifique cada promessa:
- "sustentada": a fonte oficial confirma.
- "exagerada": tem base na fonte, mas aumenta resultado, prazo ou facilidade.
- "proibida": garante ganho financeiro, promete resultado de saúde/emagrecimento, contradiz a fonte, ou viola regras de publicidade (CONAR) ou de alegações de saúde (ANVISA).
Atenção: promessa de emagrecimento, perda de peso ou efeito no corpo (ex.: "seca X kg", "derrete gordura") é SEMPRE "proibida", mesmo que o produto auxilie em algo parecido. Valor de ganho com prazo (ex.: "fature R$X no primeiro mês") também é SEMPRE "proibida". Se a fonte nega explicitamente a afirmação (ex.: a página diz "não é..." ou "não garantimos..."), a promessa é "proibida", não "exagerada".

Para cada promessa: copie o trecho literal do roteiro; cite o trecho da fonte que sustenta ou contradiz (string vazia se não houver); explique em 1 frase simples; se não for "sustentada", sugira uma reescrita persuasiva, no tom do creator, que seja verdadeira (string vazia se for "sustentada").
Não invente informações que não estejam na fonte. Ignore frases que não são afirmações sobre o produto (ex.: "link na bio").
Liste TODAS as afirmações sobre o produto, inclusive as sustentadas (ex.: quantidade de módulos, formato, temas das aulas) — elas também precisam aparecer, com status "sustentada".
Escreva motivo e reescrita em português do Brasil.

FONTE OFICIAL — Página de vendas:
${product.salesPageText}
FONTE OFICIAL — Conteúdo real:
${outline}

ROTEIRO:
${script}`;
}

export function classifyFeedbackPrompt(product: Product, claims: Claim[], text: string, reason?: string) {
  const claimList = claims.length ? claims.map((c) => `- ${c.text}`).join("\n") : "nenhuma";
  return `Você analisa pedidos de reembolso em uma plataforma de vendas online.
Classifique o texto do COMPRADOR em um tipo de frustração:
expectativa_desalinhada | acesso_tecnico | qualidade_conteudo | entrega_logistica | arrependimento_pessoal.
Defina a gravidade (baixa/media/alta) considerando risco de reclamação pública. Use "alta" quando a frustração vem de uma promessa de ganho financeiro garantido ou de resultado de saúde, ou quando o comprador se sente enganado.
Se for expectativa_desalinhada, indique qual PROMESSA DO CONTEÚDO DE ORIGEM provavelmente gerou a expectativa (texto literal da lista, ou vazio).
Indique se existe uma ajuda que pode resolver o problema sem reembolso (ex.: acesso travado), ou string vazia se não houver — nunca sugira dificultar o reembolso. Para expectativa_desalinhada e arrependimento_pessoal, helpOffer é sempre string vazia: nesses casos o caminho é o reembolso.
Escreva o resumo (summary) e a ajuda (helpOffer) em português do Brasil, em 1 frase cada.

PRODUTO (página oficial): ${product.salesPageText}
PROMESSAS DO CONTEÚDO DE ORIGEM:
${claimList}
${reason ? `MOTIVO SELECIONADO PELO COMPRADOR: ${reason}\n` : ""}TEXTO DO COMPRADOR: ${text}`;
}

export function creatorInsightPrompt(data: unknown) {
  return `Você é um analista de performance para creators afiliados. Com base nos dados abaixo, escreva até 3 insights curtos e acionáveis (máx. 2 frases cada) mostrando quais promessas ou conteúdos estão ligados a mais reembolso e o que mudar. Tom: direto, amigável, sem julgar. Use números dos dados (vírgula como separador decimal, ex.: 22,9%) e cite os conteúdos pelo título (nunca pelo id). Se houver "comparacao", o primeiro insight é sobre ela: quantas vezes mais reembolso os conteúdos com promessa proibida geram e qual promessa trocar. Descreva o status de cada promessa exatamente como está nos dados. Responda em português do Brasil. Cada insight tem um título curto e descritivo (até 6 palavras, sem "Insight 1"). Nunca sugira prometer mais, prazos menores ou resultados maiores do que a página do produto sustenta: o objetivo é reduzir reembolso com promessas verdadeiras. Se as promessas são sustentadas e a taxa é baixa, reconheça isso e recomende manter o tom. Deixe suggestedAction como string vazia.
DADOS: ${JSON.stringify(data)}`;
}

export function caseInsightPrompt(data: unknown) {
  return `Resuma este caso para a equipe de Operações em 2 frases e sugira 1 ação (ex.: acionar produtor, oferecer suporte de acesso, reembolsar proativamente, revisar conteúdo do creator). Não atribua culpa definitiva; indique a hipótese mais provável. A promessa que gerou a expectativa, quando existe, está no CONTEÚDO DO CREATOR (conteudoDeOrigem), não na página oficial do produto: não sugira mudar a página do produto. Considere as horas sem resposta do produtor. Responda em português do Brasil: o resumo vai em items (um item com título curto) e a ação em suggestedAction (1 frase, começando por um verbo).
CASO: ${JSON.stringify(data)}`;
}
