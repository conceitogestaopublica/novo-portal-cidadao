import { NextResponse } from "next/server";
import { z } from "zod";
import { currentTenant } from "@/shared/lib/tenant-map";
import { contaByDocumento, verificarSenha } from "@/shared/repos/conta-repo";
import { montarSessaoLogada } from "@/shared/lib/montar-sessao";

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

  try {
    await montarSessaoLogada({
      tenant,
      documento,
      contribuinteId: conta.contribuinteId!,
      nome: conta.nome,
    });
  } catch {
    return NextResponse.json({ message: "Falha ao autenticar. Tente novamente." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
