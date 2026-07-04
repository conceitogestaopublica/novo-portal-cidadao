import { NextResponse } from "next/server";
import { z } from "zod";
import { currentTenant } from "@/shared/lib/tenant-map";
import { TributarioAdapter } from "@/shared/adapters/tributario.adapter";
import { contaByDocumento, verificarSenha } from "@/shared/repos/conta-repo";
import { writeSession } from "@/shared/lib/portal-session";

const schema = z.object({ documento: z.string().min(11), senha: z.string().min(1) });

/** Login por documento + senha (conta registrada do Atendimento ao Contribuinte). */
export async function POST(req: Request) {
  const tenant = await currentTenant();
  if (!tenant) return NextResponse.json({ message: "Município não encontrado" }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Dados inválidos" }, { status: 400 });
  const documento = parsed.data.documento.replace(/\D/g, "");

  const conta = await contaByDocumento(documento, tenant.municipio);
  if (!conta || !(await verificarSenha(conta, parsed.data.senha))) {
    // Genérico (não revela se o documento tem conta).
    return NextResponse.json({ message: "Documento ou senha inválidos." }, { status: 401 });
  }

  const adapter = new TributarioAdapter(tenant);
  let tokenRes;
  try {
    tokenRes = await adapter.emitirToken(conta.contribuinteId!);
  } catch {
    return NextResponse.json({ message: "Falha ao autenticar. Tente novamente." }, { status: 502 });
  }

  await writeSession({
    conta: { id: conta.contribuinteId!, nome: conta.nome },
    municipio: tenant.municipio,
    tributarioToken: tokenRes.accessToken,
    tributarioTokenExp: Math.floor(Date.now() / 1000) + (tokenRes.expiresIn ?? 900),
  });

  return NextResponse.json({ ok: true });
}
