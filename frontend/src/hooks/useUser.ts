import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { userService } from "@/services/user.service";
import { useAuthStore } from "@/stores/authStore";
import type { UserUpdate } from "@/types/user";
import { ApiError } from "@/types/api";

export function useUpdateProfile() {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: (payload: UserUpdate) => userService.update(payload),
    onSuccess: (user) => {
      setUser(user);
      qc.invalidateQueries({ queryKey: ["balance"] });
      qc.invalidateQueries({ queryKey: ["financial"] });
      toast.success("Perfil atualizado.");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof ApiError ? error.message : "Não foi possível atualizar o perfil.";
      toast.error(message);
    },
  });
}
