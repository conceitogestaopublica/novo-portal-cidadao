"use client";

import { useMutation } from "@tanstack/react-query";
import { cadastrar } from "../services/cadastro.service";

export function useCadastro() {
  return useMutation({ mutationFn: cadastrar });
}
