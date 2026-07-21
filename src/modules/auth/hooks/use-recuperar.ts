"use client";

import { useMutation } from "@tanstack/react-query";
import { recuperar } from "../services/recuperar.service";

export function useRecuperar() {
  return useMutation({ mutationFn: recuperar });
}
