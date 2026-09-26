import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { disciplineService } from "@/services/discipline.service";
export function useDiscipline() {
  return useQuery({
    queryKey: ["discipline"],
    queryFn: disciplineService.status,
  });
}
export function useDisciplineSettings() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: disciplineService.update,
    onSuccess: (data) => {
      client.setQueryData(["discipline"], data);
      toast.success("Limites atualizados.");
    },
    onError: () => toast.error("Não foi possível salvar seus limites."),
  });
}
