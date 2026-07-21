import { useMutation } from "@tanstack/react-query";
import { logoutAdmin } from "../services/logout.service";

export function useLogoutAdmin() {
  return useMutation({ mutationFn: logoutAdmin });
}
