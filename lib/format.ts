// Formatação pt-BR compartilhada (client e server).

export const pct = (x: number, digits = 1) =>
  `${(x * 100).toLocaleString("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`;

export const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export const int = (v: number) => v.toLocaleString("pt-BR");

export const times = (x: number) => `${x.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}x`;

/** "1 reembolso", "8 reembolsos" */
export const plural = (n: number, singular: string, pluralForm = `${singular}s`) =>
  `${n.toLocaleString("pt-BR")} ${n === 1 ? singular : pluralForm}`;
