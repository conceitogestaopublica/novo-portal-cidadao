"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { checarTokenRedefinir, redefinir } from "../services/redefinir.service";

/**
 * Confere o link antes de mostrar o formulário: pedir a senha nova e só
 * depois dizer "link expirado" seria fazer a pessoa digitar à toa.
 */
export function useCheckTokenRedefinir(token: string) {
  return useQuery({
    queryKey: ["redefinir", token],
    queryFn: () => checarTokenRedefinir(token),
    enabled: Boolean(token),
    retry: false,
  });
}

export function useRedefinir() {
  return useMutation({ mutationFn: redefinir });
}
