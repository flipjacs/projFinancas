/**
 * Money/percentage formatters used across pages. Defaults to en-US to match
 * the API's Decimal serialization; swap the locale here if you ever localize.
 */
const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const percent = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatCurrency(value: number | string): string {
  const n = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(n) ? currency.format(n) : "-";
}

export function formatPercentage(value: number | string): string {
  const n = (typeof value === "string" ? Number(value) : value) / 100;
  return Number.isFinite(n) ? percent.format(n) : "-";
}
