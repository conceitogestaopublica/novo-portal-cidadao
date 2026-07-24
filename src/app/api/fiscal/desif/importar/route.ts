import { proxyPortalMePost } from "@/shared/adapters/portal-me-client";

/**
 * Envia o arquivo DES-IF.
 *
 * O backend recusa arquivo cuja instituição não seja do contribuinte logado —
 * a instituição é identificada pelo CNPJ que vem DENTRO do arquivo, então essa
 * checagem é do servidor, não daqui.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  return proxyPortalMePost("/desif/importar", body);
}
