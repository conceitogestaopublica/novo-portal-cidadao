import { NextResponse } from "next/server";
import { currentTenant } from "@/shared/lib/tenant-map";
import { contaByDocumento, verificarSenha } from "@/shared/repos/conta-repo";
import { montarSessaoLogada } from "@/shared/lib/montar-sessao";
import { loginBloqueado, registrarFalha, registrarSucesso } from "@/shared/lib/login-lock";
import { loginSenhaSchema as schema } from "@/modules/auth/schemas/auth.schema";
import { INDISPONIVEL } from "@/shared/lib/mensagens";

/**
 * Login por documento + senha (conta registrada do Atendimento ao Contribuinte).
 *
 * Bloqueio por DOCUMENTO (não por IP): é a conta que precisa ficar protegida
 * de força bruta, não importa de quantos IPs diferentes o ataque venha.
 */
export async function POST(req: Request) {
  const tenant = await currentTenant();
  if (!tenant) return NextResponse.json({ message: "Município não encontrado" }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Dados inválidos" }, { status: 400 });
  const documento = parsed.data.documento.replace(/\D/g, "");

  if (await loginBloqueado("login-senha", documento)) {
    return NextResponse.json(
      { message: "Muitas tentativas. Aguarde alguns minutos e tente novamente." },
      { status: 429 },
    );
  }

  const conta = await contaByDocumento(documento, tenant.municipio);
  if (!conta || !(await verificarSenha(conta, parsed.data.senha))) {
    await registrarFalha("login-senha", documento);
    // Genérico (não revela se o documento tem conta).
    return NextResponse.json({ message: "Documento ou senha inválidos." }, { status: 401 });
  }
  await registrarSucesso("login-senha", documento);

  try {
    await montarSessaoLogada({
      tenant,
      documento,
      contribuinteId: conta.contribuinteId!,
      nome: conta.nome,
    });
  } catch {
    return NextResponse.json({ message: INDISPONIVEL.login }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
