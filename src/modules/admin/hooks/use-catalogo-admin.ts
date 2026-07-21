"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AdminCatalogo } from "@/shared/catalogo/catalogo-admin-repo";
import { excluirCatalogo, fetchCatalogoAdmin, salvarCatalogo } from "../services/catalogo.service";

const CATALOGO_ADMIN_KEYS = {
  all: ["admin", "catalogo"] as const,
};

/** Catálogo completo do console admin. `initialData` vem do Server Component — evita um GET redundante no primeiro render. */
export function useCatalogoAdmin(dadosIniciais: AdminCatalogo) {
  return useQuery({
    queryKey: CATALOGO_ADMIN_KEYS.all,
    queryFn: fetchCatalogoAdmin,
    initialData: dadosIniciais,
  });
}

/** Cria/edita um ambiente, categoria ou serviço — a URL varia por tipo, decidida pelo chamador. */
export function useSalvarCatalogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ url, body }: { url: string; body: unknown }) => salvarCatalogo(url, body),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: CATALOGO_ADMIN_KEYS.all }),
  });
}

/** Exclui um ambiente, categoria ou serviço — a URL varia por tipo, decidida pelo chamador. */
export function useExcluirCatalogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (url: string) => excluirCatalogo(url),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: CATALOGO_ADMIN_KEYS.all }),
  });
}
