import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { planejamentoService } from "@/services/planejamento.service";
import type {
  DistribuicaoCreate,
  DistribuicaoUpdate,
  ObjetivoCreate,
  ObjetivoUpdate,
} from "@/types/planejamento";
import { ApiError } from "@/types/api";

export const planejamentoKeys = {
  all: ["planejamento"] as const,
  distribuicoes: () => [...planejamentoKeys.all, "distribuicoes"] as const,
  objetivos: () => [...planejamentoKeys.all, "objetivos"] as const,
  resumo: () => [...planejamentoKeys.all, "resumo"] as const,
  alertas: () => [...planejamentoKeys.all, "alertas"] as const,
};

function reportError(action: string) {
  return (error: unknown) => {
    const message =
      error instanceof ApiError ? error.message : `Falha ao ${action}.`;
    toast.error(message);
  };
}

// ---------- Distribuições ----------

export function useDistribuicoes() {
  return useQuery({
    queryKey: planejamentoKeys.distribuicoes(),
    queryFn: () => planejamentoService.listarDistribuicoes(),
  });
}

export function useDistribuicaoMutations() {
  const qc = useQueryClient();

  function invalidate() {
    qc.invalidateQueries({ queryKey: planejamentoKeys.all });
  }

  const create = useMutation({
    mutationFn: (payload: DistribuicaoCreate) =>
      planejamentoService.criarDistribuicao(payload),
    onSuccess: () => {
      toast.success("Categoria adicionada.");
      invalidate();
    },
    onError: reportError("criar a categoria"),
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: DistribuicaoUpdate }) =>
      planejamentoService.atualizarDistribuicao(id, payload),
    onSuccess: () => {
      toast.success("Categoria atualizada.");
      invalidate();
    },
    onError: reportError("atualizar a categoria"),
  });

  const remove = useMutation({
    mutationFn: (id: number) => planejamentoService.removerDistribuicao(id),
    onSuccess: () => {
      toast.success("Categoria excluída.");
      invalidate();
    },
    onError: reportError("excluir a categoria"),
  });

  return { create, update, remove };
}

// ---------- Objetivos ----------

export function useObjetivos() {
  return useQuery({
    queryKey: planejamentoKeys.objetivos(),
    queryFn: () => planejamentoService.listarObjetivos(),
  });
}

export function useObjetivoMutations() {
  const qc = useQueryClient();

  function invalidate() {
    qc.invalidateQueries({ queryKey: planejamentoKeys.objetivos() });
  }

  const create = useMutation({
    mutationFn: (payload: ObjetivoCreate) =>
      planejamentoService.criarObjetivo(payload),
    onSuccess: () => {
      toast.success("Objetivo criado.");
      invalidate();
    },
    onError: reportError("criar o objetivo"),
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ObjetivoUpdate }) =>
      planejamentoService.atualizarObjetivo(id, payload),
    onSuccess: () => {
      toast.success("Objetivo atualizado.");
      invalidate();
    },
    onError: reportError("atualizar o objetivo"),
  });

  const remove = useMutation({
    mutationFn: (id: number) => planejamentoService.removerObjetivo(id),
    onSuccess: () => {
      toast.success("Objetivo removido.");
      invalidate();
    },
    onError: reportError("remover o objetivo"),
  });

  return { create, update, remove };
}

// ---------- Análise ----------

export function useResumoPlanejamento() {
  return useQuery({
    queryKey: planejamentoKeys.resumo(),
    queryFn: () => planejamentoService.resumo(),
  });
}

export function useAlertasPlanejamento() {
  return useQuery({
    queryKey: planejamentoKeys.alertas(),
    queryFn: () => planejamentoService.alertas(),
  });
}
