import { proxyPortalMe } from "@/shared/adapters/portal-me-client";

/** Histórico das minhas declarações. A posse da instituição é conferida no backend. */
export async function GET(req: Request) {
  const instituicaoId =
    new URL(req.url).searchParams.get("instituicaoId") ?? "";
  return proxyPortalMe(
    "/desif/declaracoes",
    new URLSearchParams({ instituicaoId }),
  );
}
