type Part = string | { text: string; className?: string };

/** Quebra o texto em palavras para a variante data-reveal="words". */
export function RevealWords({ parts }: { parts: Part[] }) {
  let i = 0;
  const words = (text: string) =>
    text.split(/(\s+)/).map((w, k) =>
      !w ? null : /^\s+$/.test(w) ? (
        " "
      ) : (
        <span key={k} className="reveal-word" style={{ "--i": i++ } as React.CSSProperties}>
          {w}
        </span>
      ),
    );

  return (
    <>
      {parts.map((p, k) =>
        typeof p === "string" ? (
          <span key={k}>{words(p)}</span>
        ) : (
          <span key={k} className={p.className}>
            {words(p.text)}
          </span>
        ),
      )}
    </>
  );
}
