// Tipos espelhados da API de planejamento financeiro.
// Decimais chegam como string do backend (Pydantic serializa Decimal assim).

// Categorias *principais* — só as 7 que fazem sentido como envelope financeiro.
// Os valores legados ("Fundo Viagem", "Objetivos Tech") ainda são aceitos pelo
// backend para não quebrar dados antigos, mas não aparecem nos seletores.
export const TIPOS_CATEGORIA = [
  "Fixo",
  "Reserva",
  "Alimentacao",
  "Lazer",
  "Transporte",
  "Educacao",
  "Saude",
  "Objetivos",
  "Outros",
] as const;

export type TipoCategoria = (typeof TIPOS_CATEGORIA)[number];

export const CATEGORIAS_COMPORTAMENTAIS = [
  "essencial",
  "lazer",
  "crescimento",
  "sobrevivencia",
  "emocional",
] as const;

export type CategoriaComportamental =
  (typeof CATEGORIAS_COMPORTAMENTAIS)[number];

export const LABEL_COMPORTAMENTAL: Record<CategoriaComportamental, string> = {
  essencial: "Essencial",
  lazer: "Lazer",
  crescimento: "Crescimento",
  sobrevivencia: "Sobrevivência",
  emocional: "Emocional",
};

export const IMPACTOS = ["positivo", "neutro", "negativo"] as const;
export type ImpactoFinanceiro = (typeof IMPACTOS)[number];

export const TIPOS_DISTRIBUICAO = ["valor_fixo", "porcentagem"] as const;
export type TipoDistribuicao = (typeof TIPOS_DISTRIBUICAO)[number];

export interface Distribuicao {
  id: number;
  usuario_id: number;
  categoria: string;
  tipo_categoria: TipoCategoria;
  subcategoria: string | null;
  tipo_distribuicao: TipoDistribuicao;
  valor: string;
  porcentagem: string;
  limite_mensal: string;
  objetivo_relacionado_id: number | null;
  criado_em: string;
}

export interface ObjetivoInline {
  nome: string;
  valor_meta: number;
  valor_atual: number;
  prazo_meses: number;
}

export interface DistribuicaoCreate {
  categoria: string;
  tipo_categoria: TipoCategoria;
  subcategoria?: string | null;
  tipo_distribuicao: TipoDistribuicao;
  valor: number;
  porcentagem: number;
  limite_mensal: number;
  objetivo_relacionado_id?: number | null;
  objetivo?: ObjetivoInline | null;
}

export type DistribuicaoUpdate = Partial<
  Omit<DistribuicaoCreate, "objetivo">
>;

export interface Objetivo {
  id: number;
  usuario_id: number;
  nome: string;
  valor_meta: string;
  valor_atual: string;
  prazo_meses: number;
  valor_necessario_por_mes: string;
  progresso_percentual: string;
  criado_em: string;
}

export interface ObjetivoCreate {
  nome: string;
  valor_meta: number;
  valor_atual: number;
  prazo_meses: number;
}

export type ObjetivoUpdate = Partial<ObjetivoCreate>;

export interface CategoriaResumo {
  distribuicao_id: number;
  categoria: string;
  tipo_categoria: string;
  subcategoria: string | null;
  tipo_distribuicao: string;
  valor_planejado: string;
  porcentagem_planejada: string;
  limite_mensal: string;
  gasto_atual: string;
  percentual_utilizado: string;
  excedido: boolean;
  proximo_do_limite: boolean;
  objetivo_relacionado_id: number | null;
}

export interface ResumoComportamental {
  essencial: string;
  lazer: string;
  crescimento: string;
  sobrevivencia: string;
  emocional: string;
}

export interface GastoFixoItem {
  id: number;
  title: string;
  category: string;
  amount: string;
}

export interface PlanejamentoResumo {
  salario: string;
  total_distribuido: string;
  porcentagem_comprometida: string;
  saldo_restante: string;
  total_gasto_mes: string;
  total_gastos_fixos: string;
  composicao_fixos: GastoFixoItem[];
  categorias: CategoriaResumo[];
  comportamental: ResumoComportamental;
}

export interface AlertaFinanceiro {
  categoria: string;
  tipo: "excedido" | "proximo_limite" | "reserva_baixa";
  mensagem: string;
}

export interface AlertasResponse {
  alertas: AlertaFinanceiro[];
}
