import { test } from "node:test";
import assert from "node:assert/strict";
import { DEMO_PAGE, DEMO_PAGE_SIGNATURE } from "../lib/demo-page";
import { extractVisibleText } from "../lib/page-scan";

test("a página de exemplo tem a mistura planejada de promessas", () => {
  const all = [
    DEMO_PAGE.headline,
    DEMO_PAGE.subheadline,
    ...DEMO_PAGE.bullets,
    DEMO_PAGE.guarantee,
    ...DEMO_PAGE.testimonials.map((t) => t.text),
  ].join("\n");
  for (const p of [
    /10 ?kg em 15 dias/i,
    /sem dieta/i,
    /enquanto (você )?dorme/i,
    /garantid/i,
    /aprovado por médicos/i,
    /substitui a academia/i,
    /energia o dia inteiro/i,
    /metabolismo em até 3x/i,
    /cafeína e chá verde/i,
    /foco e .*disposição/i,
  ])
    assert.match(all, p);
  assert.equal(DEMO_PAGE_SIGNATURE, DEMO_PAGE.headline);
});

test("o texto extraído da página não inclui a faixa nem o contador", () => {
  const html = `<div data-prometia-ignore>Página fictícia criada para a demonstração</div>
    <div data-prometia-ignore><span>00:14:59</span></div><h1>${DEMO_PAGE.headline}</h1>`;
  const t = extractVisibleText(html);
  assert.ok(t.includes(DEMO_PAGE.headline));
  assert.doesNotMatch(t, /fictícia|00:14:59/);
});
