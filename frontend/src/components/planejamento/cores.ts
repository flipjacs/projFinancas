import type { TipoCategoria } from "@/types/planejamento";

// Paleta usada nos cards e no gráfico — pensada para funcionar em dark mode
// e ser distinguível entre as categorias.
export const CORES_TIPO_CATEGORIA: Record<TipoCategoria, string> = {
  Fixo: "var(--category-housing)",
  Reserva: "var(--category-savings)",
  Alimentacao: "var(--category-shopping)",
  Lazer: "var(--category-entertainment)",
  Transporte: "var(--category-utilities)",
  Educacao: "var(--category-food)",
  Saude: "var(--category-health)",
  Objetivos: "var(--category-education)",
  Outros: "var(--category-other)",
};

export const LABEL_TIPO_CATEGORIA: Record<TipoCategoria, string> = {
  Fixo: "Fixo",
  Reserva: "Reserva",
  Alimentacao: "Alimentação",
  Lazer: "Lazer",
  Transporte: "Transporte",
  Educacao: "Educação",
  Saude: "Saúde",
  Objetivos: "Objetivos",
  Outros: "Outros",
};

// Cores legadas para tipo_categoria que vieram de bases antigas.
const CORES_LEGADAS: Record<string, string> = {
  "Fundo Viagem": "var(--category-transport)",
  "Objetivos Tech": "var(--category-education)",
};

export function corDoTipo(tipo: string): string {
  return (
    CORES_TIPO_CATEGORIA[tipo as TipoCategoria] ??
    CORES_LEGADAS[tipo] ??
    CORES_TIPO_CATEGORIA.Outros
  );
}

export function labelDoTipo(tipo: string): string {
  return LABEL_TIPO_CATEGORIA[tipo as TipoCategoria] ?? tipo;
}
