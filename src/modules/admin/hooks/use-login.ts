import { useMutation } from "@tanstack/react-query";
import { loginAdmin } from "../services/login.service";

export function useLoginAdmin() {
  return useMutation({ mutationFn: loginAdmin });
}
