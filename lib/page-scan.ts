import "server-only";

// Leitura segura da página de vendas do produtor (IA 4).
// 1. parsePageUrl: só http(s); bloqueia endereços internos, exceto o próprio app (para a página de exemplo).
// 2. fetchPageText: timeout, limite de tamanho, só html, redirects revalidados a cada salto.
// 3. extractVisibleText: tira scripts, estilos e trechos marcados com data-prometia-ignore.
//
// Limitação aceita no protótipo: não resolve DNS. Um domínio público que aponte para um IP interno passa.

export const FETCH_TIMEOUT_MS = 8000;
export const MAX_PAGE_BYTES = 1_000_000;
export const MAX_TEXT_CHARS = 6000;
export const MIN_TEXT_CHARS = 80;
const MAX_REDIRECTS = 3;

export type PageScanErrorCode = "invalid_url" | "blocked" | "fetch_failed" | "not_html" | "too_large" | "unreadable";

export class PageScanError extends Error {
  code: PageScanErrorCode;
  constructor(code: PageScanErrorCode, message?: string) {
    super(message ?? code);
    this.name = "PageScanError";
    this.code = code;
  }
}

// ---------------------------------------------------------------------------
// URL
// ---------------------------------------------------------------------------
function isPrivateIPv4(host: string) {
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return false;
  const [a, b] = [Number(m[1]), Number(m[2])];
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) // CGNAT
  );
}

function isPrivateIPv6(host: string) {
  if (!host.startsWith("[")) return false;
  const h = host.slice(1, -1).toLowerCase();
  if (h === "::" || h === "::1") return true;
  if (/^f[cd][0-9a-f]{0,2}:/.test(h)) return true; // fc00::/7
  if (/^fe[89ab][0-9a-f]?:/.test(h)) return true; // fe80::/10
  const mapped = h.match(/^::ffff:(.+)$/); // IPv4 mapeado
  if (mapped) {
    const v4 = mapped[1].includes(".")
      ? mapped[1]
      : (() => {
          const [hi, lo] = mapped[1].split(":").map((x) => parseInt(x, 16));
          return [hi >> 8, hi & 255, lo >> 8, lo & 255].join(".");
        })();
    return isPrivateIPv4(v4);
  }
  return false;
}

function isBlockedHost(hostname: string) {
  const h = hostname.toLowerCase();
  return h === "localhost" || h.endsWith(".localhost") || isPrivateIPv4(h) || isPrivateIPv6(h);
}

/** Valida e normaliza a URL digitada. `appHost` (host:porta do próprio app) é sempre liberado. */
export function parsePageUrl(input: string, appHost: string): URL {
  const raw = input.trim();
  if (!raw) throw new PageScanError("invalid_url");
  // "loja.com/x" e "localhost:3000/x" não têm esquema; "ftp:", "javascript:" têm
  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw) && !/^[^:/]+:\d/.test(raw);
  let url: URL;
  try {
    url = new URL(hasScheme ? raw : `https://${raw}`);
  } catch {
    throw new PageScanError("invalid_url");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new PageScanError("invalid_url");
  if (url.host === appHost) return url;
  if (isBlockedHost(url.hostname)) throw new PageScanError("blocked");
  return url;
}

// ---------------------------------------------------------------------------
// Extração de texto
// ---------------------------------------------------------------------------
const VOWEL_ENTITIES: Record<string, string> = {};
for (const [suffix, map] of Object.entries({
  acute: { a: "á", e: "é", i: "í", o: "ó", u: "ú" },
  grave: { a: "à" },
  circ: { a: "â", e: "ê", o: "ô" },
  tilde: { a: "ã", o: "õ" },
  cedil: { c: "ç" },
  uml: { u: "ü" },
})) {
  for (const [letter, char] of Object.entries(map)) {
    VOWEL_ENTITIES[`${letter}${suffix}`] = char;
    VOWEL_ENTITIES[`${letter.toUpperCase()}${suffix}`] = char.toUpperCase();
  }
}

const NAMED_ENTITIES: Record<string, string> = {
  ...VOWEL_ENTITIES,
  nbsp: " ",
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  mdash: "—",
  ndash: "–",
  hellip: "…",
  laquo: "«",
  raquo: "»",
  ldquo: "“",
  rdquo: "”",
  lsquo: "‘",
  rsquo: "’",
  bull: "•",
  middot: "·",
  copy: "©",
  reg: "®",
  trade: "™",
  ordm: "º",
  ordf: "ª",
  deg: "°",
};

function decodeEntities(s: string) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, body: string) => {
    if (body[0] === "#") {
      const code = body[1] === "x" || body[1] === "X" ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : whole;
    }
    return NAMED_ENTITIES[body] ?? whole;
  });
}

/** Remove cada elemento com data-prometia-ignore, com o conteúdo, respeitando tags aninhadas iguais. */
function removeIgnored(html: string) {
  const open = /<([a-z][a-z0-9-]*)\b[^>]*\sdata-prometia-ignore\b[^>]*>/i;
  let out = html;
  for (let m = out.match(open); m && m.index != null; m = out.match(open)) {
    const tag = m[1].toLowerCase();
    const start = m.index;
    const tagRe = new RegExp(`<(/?)${tag}\\b[^>]*>`, "gi");
    tagRe.lastIndex = start + m[0].length;
    let depth = 1;
    let end = out.length;
    for (let t = tagRe.exec(out); t; t = tagRe.exec(out)) {
      depth += t[1] ? -1 : t[0].endsWith("/>") ? 0 : 1;
      if (depth === 0) {
        end = t.index + t[0].length;
        break;
      }
    }
    out = out.slice(0, start) + " " + out.slice(end);
  }
  return out;
}

const BLOCK_TAGS =
  "address|article|aside|blockquote|br|button|dd|div|dl|dt|figcaption|figure|footer|form|h[1-6]|header|hr|li|main|nav|ol|p|pre|section|table|td|th|tr|ul";

export function extractVisibleText(html: string): string {
  let s = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(head|script|style|noscript|svg|template|iframe)\b[\s\S]*?<\/\1\s*>/gi, " ");
  s = removeIgnored(s);
  s = s
    .replace(new RegExp(`<\\/?(?:${BLOCK_TAGS})\\b[^>]*>`, "gi"), "\n")
    .replace(/<[^>]+>/g, "");
  s = decodeEntities(s);
  const text = s
    .split("\n")
    .map((line) => line.replace(/[\s ]+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
  return text.slice(0, MAX_TEXT_CHARS);
}

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------
interface FetchOptions {
  appHost: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  maxBytes?: number;
}

async function readLimited(res: Response, maxBytes: number) {
  const declared = Number(res.headers.get("content-length"));
  if (declared > maxBytes) throw new PageScanError("too_large");
  if (!res.body) return "";
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => {});
      throw new PageScanError("too_large");
    }
    chunks.push(value);
  }
  const buf = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    buf.set(c, offset);
    offset += c.byteLength;
  }
  return new TextDecoder("utf-8").decode(buf);
}

/** Busca a página e devolve o texto visível. Lança PageScanError com o motivo. */
export async function fetchPageText(url: URL, opts: FetchOptions): Promise<string> {
  const { appHost, fetchImpl = fetch, timeoutMs = FETCH_TIMEOUT_MS, maxBytes = MAX_PAGE_BYTES } = opts;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let current = url;
    let res: Response;
    for (let hop = 0; ; hop++) {
      try {
        res = await fetchImpl(current.href, {
          redirect: "manual",
          signal: controller.signal,
          headers: { "user-agent": "PrometIA/0.1 (prototipo)", accept: "text/html,application/xhtml+xml" },
        });
      } catch {
        throw new PageScanError("fetch_failed");
      }
      const location = res.headers.get("location");
      if (res.status >= 300 && res.status < 400 && location) {
        if (hop >= MAX_REDIRECTS) throw new PageScanError("fetch_failed", "redirects demais");
        current = parsePageUrl(new URL(location, current).href, appHost);
        continue;
      }
      break;
    }
    if (!res.ok) throw new PageScanError("fetch_failed", `status ${res.status}`);
    const type = res.headers.get("content-type") ?? "";
    if (!/text\/html|application\/xhtml\+xml/i.test(type)) throw new PageScanError("not_html");
    let html: string;
    try {
      html = await readLimited(res, maxBytes);
    } catch (err) {
      if (err instanceof PageScanError) throw err;
      throw new PageScanError("fetch_failed");
    }
    const text = extractVisibleText(html);
    if (text.length < MIN_TEXT_CHARS) throw new PageScanError("unreadable");
    return text;
  } finally {
    clearTimeout(timer);
  }
}
