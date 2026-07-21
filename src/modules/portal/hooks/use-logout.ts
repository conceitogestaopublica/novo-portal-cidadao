import { useMutation } from "@tanstack/react-query";
import { logoutCidadao } from "../services/logout.service";

export function useLogoutCidadao() {
  return useMutation({ mutationFn: logoutCidadao });
}
