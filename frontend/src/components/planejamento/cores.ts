import type { TipoCategoria } from "@/types/planejamento";

// Paleta usada nos cards e no gráfico — pensada para funcionar em dark mode
// e ser distinguível entre as categorias.
export const CORES_TIPO_CATEGORIA: Record<TipoCategoria, string> = {
  Fixo: "#6366f1",
  Reserva: "#10b981",
  "Fundo Viagem": "#06b6d4",
  "Objetivos Tech": "#8b5cf6",
  Lazer: "#ec4899",
  Transporte: "#0ea5e9",
  Educacao: "#f97316",
  Saude: "#ef4444",
  Outros: "#64748b",
};

export const LABEL_TIPO_CATEGORIA: Record<TipoCategoria, string> = {
  Fixo: "Fixo",
  Reserva: "Reserva",
  "Fundo Viagem": "Fundo Viagem",
  "Objetivos Tech": "Objetivos Tech",
  Lazer: "Lazer",
  Transporte: "Transporte",
  Educacao: "Educação",
  Saude: "Saúde",
  Outros: "Outros",
};

export function corDoTipo(tipo: string): string {
  return CORES_TIPO_CATEGORIA[tipo as TipoCategoria] ?? CORES_TIPO_CATEGORIA.Outros;
}

export function labelDoTipo(tipo: string): string {
  return LABEL_TIPO_CATEGORIA[tipo as TipoCategoria] ?? tipo;
}
