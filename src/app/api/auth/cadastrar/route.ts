import { NextResponse } from "next/server";
import { z } from "zod";
import { currentTenant } from "@/shared/lib/tenant-map";
import { TributarioAdapter } from "@/shared/adapters/tributario.adapter";
import { contaByDocumento, criarConta } from "@/shared/repos/conta-repo";
import { writeSession } from "@/shared/lib/portal-session";

const schema = z.object({
  documento: z.string().min(11),
  nome: z.string().min(3),
  email: z.string().email().optional().or(z.literal("")),
  senha: z.string().min(6),
});

/**
 * Cadastro do cidadão no Atendimento ao Contribuinte: documento + senha. Só
 * permite cadastrar quem é contribuinte real do município (valida no tributário)
 * e vincula o contribuinteId à conta. Já deixa logado.
 */
export async function POST(req: Request) {
  const tenant = await currentTenant();
  if (!tenant) return NextResponse.json({ message: "Município não encontrado" }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Dados inválidos (senha mín. 6)." }, { status: 400 });
  const documento = parsed.data.documento.replace(/\D/g, "");

  if (await contaByDocumento(documento, tenant.municipio)) {
    return NextResponse.json({ message: "Já existe uma conta com este documento. Faça login." }, { status: 409 });
  }

  // Só contribuinte real do município pode se cadastrar no Atendimento.
  const adapter = new TributarioAdapter(tenant);
  let resolved;
  try {
    resolved = await adapter.resolver(documento);
  } catch {
    return NextResponse.json({ message: "Serviço indisponível. Tente novamente." }, { status: 502 });
  }
  if (!resolved) {
    return NextResponse.json({ message: "Documento não encontrado no cadastro do município." }, { status: 404 });
  }

  const conta = await criarConta({
    documento,
    nome: parsed.data.nome,
    email: parsed.data.email || null,
    senha: parsed.data.senha,
    contribuinteId: resolved.contribuinteId,
    municipio: tenant.municipio,
  });

  const tokenRes = await adapter.emitirToken(conta.contribuinteId!);
  await writeSession({
    conta: { id: conta.contribuinteId!, nome: conta.nome },
    municipio: tenant.municipio,
    tributarioToken: tokenRes.accessToken,
    tributarioTokenExp: Math.floor(Date.now() / 1000) + (tokenRes.expiresIn ?? 900),
  });

  return NextResponse.json({ ok: true });
}
