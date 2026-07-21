import { postJson, requestJsonOrError, requestNoContentOrError } from "@/shared/lib/client-api";
import type { AdminCatalogo } from "@/shared/catalogo/catalogo-admin-repo";

/** GET do catálogo completo (ambientes, categorias, serviços) para o console admin. */
export function fetchCatalogoAdmin() {
  return requestJsonOrError<AdminCatalogo>("/api/admin/catalogo", { cache: "no-store" });
}

/** POST de criação/edição — a URL varia por tipo (ambiente/categoria/serviço), montada pelo chamador. */
export function salvarCatalogo(url: string, body: unknown) {
  return postJson(url, body, "Falha ao salvar");
}

/** DELETE de um item do catálogo — a URL varia por tipo, montada pelo chamador. */
export function excluirCatalogo(url: string) {
  return requestNoContentOrError(url, { method: "DELETE" }, "Falha ao excluir");
}
