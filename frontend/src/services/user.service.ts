import { api } from "@/lib/api";
import type { User, UserUpdate } from "@/types/user";

export const userService = {
  async me(): Promise<User> {
    const { data } = await api.get<User>("/users/me");
    return data;
  },

  async update(payload: UserUpdate): Promise<User> {
    const { data } = await api.patch<User>("/users/me", payload);
    return data;
  },
};
