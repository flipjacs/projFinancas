// Decode only for expiry UX. Signature and ownership remain backend decisions.
export function tokenExpiresAt(token: string): number {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return 0;
    const encoded = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload: unknown = JSON.parse(atob(encoded));
    if (typeof payload !== "object" || payload === null || !("exp" in payload))
      return 0;
    const exp = payload.exp;
    return typeof exp === "number" && Number.isFinite(exp) && exp > 0
      ? exp * 1000
      : 0;
  } catch {
    return 0;
  }
}
const destinations = new Set([
  "/painel",
  "/gastos",
  "/planejamento",
  "/objetivos",
  "/parcelamentos",
  "/disciplina",
  "/posso-comprar",
  "/configuracoes",
  "/perfil",
]);
export function safeReturnPath(value: unknown): string {
  return typeof value === "string" && destinations.has(value)
    ? value
    : "/painel";
}
