import { proxyPortalMePost } from "@/shared/adapters/portal-me-client";

/** Gerar a guia do ISS que eu devo: tudo junto ou só as notas escolhidas. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  return proxyPortalMePost("/tomadas/prestei/guia", body);
}
