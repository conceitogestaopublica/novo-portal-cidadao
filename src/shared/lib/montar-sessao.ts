import "server-only";
import type { TenantConfig } from "@/shared/lib/tenant-map";
import { TributarioAdapter } from "@/shared/adapters/tributario.adapter";
import { writeSession, type PortalSession } from "@/shared/lib/portal-session";
import { contaByDocumento } from "@/shared/repos/conta-repo";
import type { Representacao } from "@/shared/types/portal";

/**
 * Monta e grava a sessão do portal após um login bem-sucedido (senha, OTP ou
 * cadastro). Aqui mora a lógica do modelo "uma pessoa, várias empresas":
 *
 * 1. busca no tributário as identidades que o documento pode atuar (titular +
 *    empresas representadas);
 * 2. define a identidade ATIVA inicial = o titular (a própria pessoa);
 * 3. emite o JWT CONTRIBUINTE dessa identidade ativa.
 *
 * Trocar de empresa (POST /api/auth/atuar-como) só reaproveita o passo 3 para
 * outra identidade da lista — sem novo login.
 *
 * Busca a `PortalConta` pelo documento (existe ou não, independente do
 * caminho de login usado hoje) e grava a `tokenVersion` vigente na sessão —
 * assim, se a pessoa tem conta e troca a senha depois, a sessão é revogada na
 * hora (`ensureToken`), mesmo que tenha entrado por OTP nesta vez.
 */
export async function montarSessaoLogada(input: {
  tenant: TenantConfig;
  documento: string;
  /** Fallback caso o tributário não retorne representações (ex.: só o titular). */
  contribuinteId: string;
  nome: string;
}): Promise<PortalSession> {
  const adapter = new TributarioAdapter(input.tenant);
  const conta = await contaByDocumento(input.documento, input.tenant.municipio);

  let representados: Representacao[] = [];
  try {
    const lista = await adapter.representacoes(input.documento);
    representados = lista.map((r) => ({
      id: r.contribuinteId,
      nome: r.nome,
      documento: r.documento,
      tipo: r.tipo,
      papel: r.papel ?? null,
    }));
  } catch {
    /* tributário indisponível para representações — segue só com o titular */
  }

  // Titular = a própria pessoa. Se a lista veio vazia, usa o contribuinte já resolvido.
  const titular =
    representados.find((r) => r.tipo === "titular") ??
    ({
      id: input.contribuinteId,
      nome: input.nome,
      documento: input.documento,
      tipo: "titular",
    } as Representacao);

  if (!representados.length) representados = [titular];

  // Identidade ativa inicial = o titular (o CPF da pessoa).
  const tokenRes = await adapter.emitirToken(titular.id, input.documento);

  const session: PortalSession = {
    conta: { id: titular.id, nome: titular.nome, documento: titular.documento ?? undefined },
    pessoa: { id: titular.id, nome: titular.nome, documento: titular.documento ?? undefined },
    representados,
    municipio: input.tenant.municipio,
    tributarioToken: tokenRes.accessToken,
    tributarioTokenExp: Math.floor(Date.now() / 1000) + (tokenRes.expiresIn ?? 900),
    ...(conta ? { contaId: conta.id, contaTokenVersion: conta.tokenVersion } : {}),
  };

  await writeSession(session);
  return session;
}
