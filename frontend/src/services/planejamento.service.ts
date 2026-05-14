import { api } from "@/lib/api";
import type {
  AlertasResponse,
  Distribuicao,
  DistribuicaoCreate,
  DistribuicaoUpdate,
  Objetivo,
  ObjetivoCreate,
  ObjetivoUpdate,
  PlanejamentoResumo,
} from "@/types/planejamento";

export const planejamentoService = {
  // ----- Distribuição -----
  async listarDistribuicoes(): Promise<Distribuicao[]> {
    const { data } = await api.get<Distribuicao[]>("/planejamento/distribuicao");
    return data;
  },

  async criarDistribuicao(payload: DistribuicaoCreate): Promise<Distribuicao> {
    const { data } = await api.post<Distribuicao>(
      "/planejamento/distribuicao",
      payload,
    );
    return data;
  },

  async atualizarDistribuicao(
    id: number,
    payload: DistribuicaoUpdate,
  ): Promise<Distribuicao> {
    const { data } = await api.put<Distribuicao>(
      `/planejamento/distribuicao/${id}`,
      payload,
    );
    return data;
  },

  async removerDistribuicao(id: number): Promise<void> {
    await api.delete(`/planejamento/distribuicao/${id}`);
  },

  // ----- Objetivos -----
  async listarObjetivos(): Promise<Objetivo[]> {
    const { data } = await api.get<Objetivo[]>("/planejamento/objetivos");
    return data;
  },

  async criarObjetivo(payload: ObjetivoCreate): Promise<Objetivo> {
    const { data } = await api.post<Objetivo>(
      "/planejamento/objetivos",
      payload,
    );
    return data;
  },

  async atualizarObjetivo(id: number, payload: ObjetivoUpdate): Promise<Objetivo> {
    const { data } = await api.put<Objetivo>(
      `/planejamento/objetivos/${id}`,
      payload,
    );
    return data;
  },

  async removerObjetivo(id: number): Promise<void> {
    await api.delete(`/planejamento/objetivos/${id}`);
  },

  // ----- Análise -----
  async resumo(): Promise<PlanejamentoResumo> {
    const { data } = await api.get<PlanejamentoResumo>("/planejamento/resumo");
    return data;
  },

  async alertas(): Promise<AlertasResponse> {
    const { data } = await api.get<AlertasResponse>("/planejamento/alertas");
    return data;
  },
};
