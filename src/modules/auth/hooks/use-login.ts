"use client";

import { useMutation } from "@tanstack/react-query";
import { loginSenha, loginStart, loginVerify } from "../services/login.service";

export function useLoginSenha() {
  return useMutation({ mutationFn: loginSenha });
}

export function useLoginStart() {
  return useMutation({ mutationFn: loginStart });
}

export function useLoginVerify() {
  return useMutation({ mutationFn: loginVerify });
}
