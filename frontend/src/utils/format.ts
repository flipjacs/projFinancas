// Formatadores de moeda e porcentagem usados em toda a aplicação.
// Usamos pt-BR + BRL porque o app é em português; trocar o locale aqui
// reflete em todas as telas.
const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 2,
});

const percent = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatCurrency(value: number | string): string {
  const n = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(n) ? currency.format(n) : "-";
}

export function formatPercentage(value: number | string): string {
  // O backend já manda a porcentagem (ex: 35 = 35%), então dividimos por 100
  // antes de passar para o Intl, que espera frações (0.35).
  const n = (typeof value === "string" ? Number(value) : value) / 100;
  return Number.isFinite(n) ? percent.format(n) : "-";
}
