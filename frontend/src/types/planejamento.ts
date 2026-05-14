// Tipos espelhados da API de planejamento financeiro.
// Decimais chegam como string do backend (Pydantic serializa Decimal assim).

export const TIPOS_CATEGORIA = [
  "Fixo",
  "Reserva",
  "Fundo Viagem",
  "Objetivos Tech",
  "Lazer",
  "Transporte",
  "Educacao",
  "Saude",
  "Outros",
] as const;

export type TipoCategoria = (typeof TIPOS_CATEGORIA)[number];

export const TIPOS_DISTRIBUICAO = ["valor_fixo", "porcentagem"] as const;
export type TipoDistribuicao = (typeof TIPOS_DISTRIBUICAO)[number];

export interface Distribuicao {
  id: number;
  usuario_id: number;
  categoria: string;
  tipo_categoria: TipoCategoria;
  tipo_distribuicao: TipoDistribuicao;
  valor: string;
  porcentagem: string;
  limite_mensal: string;
  criado_em: string;
}

export interface DistribuicaoCreate {
  categoria: string;
  tipo_categoria: TipoCategoria;
  tipo_distribuicao: TipoDistribuicao;
  valor: number;
  porcentagem: number;
  limite_mensal: number;
}

export type DistribuicaoUpdate = Partial<DistribuicaoCreate>;

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
  tipo_distribuicao: string;
  valor_planejado: string;
  porcentagem_planejada: string;
  limite_mensal: string;
  gasto_atual: string;
  percentual_utilizado: string;
  excedido: boolean;
  proximo_do_limite: boolean;
}

export interface PlanejamentoResumo {
  salario: string;
  total_distribuido: string;
  porcentagem_comprometida: string;
  saldo_restante: string;
  total_gasto_mes: string;
  categorias: CategoriaResumo[];
}

export interface AlertaFinanceiro {
  categoria: string;
  tipo: "excedido" | "proximo_limite" | "reserva_baixa";
  mensagem: string;
}

export interface AlertasResponse {
  alertas: AlertaFinanceiro[];
}
