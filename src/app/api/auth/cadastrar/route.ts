import { NextResponse } from "next/server";
import { currentTenant } from "@/shared/lib/tenant-map";
import { TributarioAdapter } from "@/shared/adapters/tributario.adapter";
import { contaByDocumento, criarConta } from "@/shared/repos/conta-repo";
import { montarSessaoLogada } from "@/shared/lib/montar-sessao";
import { cadastroSchema as schema } from "@/modules/auth/schemas/auth.schema";
import { INDISPONIVEL } from "@/shared/lib/mensagens";

/**
 * Cadastro no Atendimento ao Contribuinte: documento + senha.
 *
 * Regra: só contribuinte real do município se cadastra — a conta é vinculada ao
 * `contribuinteId`. A exceção é o PRESTADOR DE FORA, que se identifica como tal
 * e tem a ficha criada no ato (é ele quem presta serviço aqui e deve o ISS).
 * Já deixa logado.
 */
export async function POST(req: Request) {
  const tenant = await currentTenant();
  if (!tenant) return NextResponse.json({ message: "Município não encontrado" }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }
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
    return NextResponse.json({ message: INDISPONIVEL.cadastro }, { status: 502 });
  }

  // Prestador de fora: a ficha dele nasce aqui. O backend valida o documento
  // (dígito verificador) e é idempotente — se um tomador já declarou nota dele,
  // reusa a ficha em vez de criar outra.
  let contribuinteId = resolved?.contribuinteId;
  if (!contribuinteId && parsed.data.prestadorExterno) {
    try {
      const criado = await adapter.cadastrarPrestadorExterno({
        documento,
        nome: parsed.data.nome,
      });
      contribuinteId = criado.contribuinteId;
    } catch {
      return NextResponse.json(
        { message: "Não foi possível criar seu cadastro. Confira o CPF/CNPJ." },
        { status: 422 },
      );
    }
  }

  if (!contribuinteId) {
    return NextResponse.json(
      {
        message:
          "Documento não encontrado no cadastro do município. Se você é prestador de fora e prestou serviço aqui, marque essa opção.",
      },
      { status: 404 },
    );
  }

  const conta = await criarConta({
    documento,
    nome: parsed.data.nome,
    email: parsed.data.email || null,
    senha: parsed.data.senha,
    contribuinteId,
    municipio: tenant.municipio,
  });

  await montarSessaoLogada({
    tenant,
    documento,
    contribuinteId: conta.contribuinteId!,
    nome: conta.nome,
  });

  return NextResponse.json({ ok: true });
}
