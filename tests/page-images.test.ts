import { test } from "node:test";
import assert from "node:assert/strict";
import { MAX_IMAGE_B64, ocrTextOrNull, validateImages } from "../lib/page-images";

const png = "data:image/png;base64,iVBORw0KGgo=";

test("aceita de 1 a 3 data URLs de imagem", () => {
  assert.deepEqual(validateImages([png]), { ok: true, images: [png] });
  assert.equal(validateImages([png, png, png]).ok, true);
  assert.equal(validateImages(["data:image/jpeg;base64,/9j/4AAQ", "data:image/webp;base64,UklGRg=="]).ok, true);
});

test("recusa lista vazia, mais de 3 e o que não é lista", () => {
  for (const v of [[], [png, png, png, png], "x", null, undefined, [123]]) assert.equal(validateImages(v).ok, false);
});

test("recusa tipos fora de png/jpeg/webp e data URL malformada", () => {
  for (const v of [
    "data:image/gif;base64,R0lGODlh",
    "data:image/svg+xml;base64,PHN2Zz4=",
    "data:application/pdf;base64,JVBERi0=",
    "https://x.com/a.png",
    "data:image/png,naobase64",
    "data:image/png;base64,***",
    "data:image/png;base64,",
  ])
    assert.equal(validateImages([v]).ok, false, v);
});

test("recusa imagem acima de 1,5 MB e total acima de 4 MB", () => {
  const big = `data:image/jpeg;base64,${"A".repeat(MAX_IMAGE_B64 + 4)}`;
  assert.equal(validateImages([big]).ok, false);
  const mid = `data:image/jpeg;base64,${"A".repeat(1_400_000)}`;
  assert.equal(validateImages([mid, mid]).ok, true);
  assert.equal(validateImages([mid, mid, mid]).ok, false);
});

test("mensagens de erro em português", () => {
  const empty = validateImages([]);
  assert.ok(!empty.ok && /print/i.test(empty.error));
  const gif = validateImages(["data:image/gif;base64,R0lGODlh"]);
  assert.ok(!gif.ok && /PNG|JPG|WEBP/.test(gif.error));
});

test("texto de OCR curto demais vira null", () => {
  assert.equal(ocrTextOrNull(" oi \n "), null);
});

test("texto de OCR é normalizado", () => {
  assert.equal(ocrTextOrNull("  A   b \n\n" + "x".repeat(90)), "A b\n" + "x".repeat(90));
});
