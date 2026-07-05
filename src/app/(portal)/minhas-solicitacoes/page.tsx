import Link from "next/link";
import { redirect } from "next/navigation";
import { currentTenant } from "@/shared/lib/tenant-map";
import { getSessionCidadao } from "@/shared/lib/portal-session";
import { listByConta } from "@/shared/repos/solicitacao-repo";
import { SituacaoBadge } from "./SituacaoBadge";

export default async function MinhasSolicitacoesPage() {
  const [tenant, cidadao] = await Promise.all([currentTenant(), getSessionCidadao()]);
  if (!cidadao) redirect("/entrar");
  const itens = tenant ? await listByConta(cidadao.id, tenant.municipio) : [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Minhas Solicitações</h1>
        <p className="text-sm text-gray-500">Acompanhe os requerimentos que você abriu.</p>
      </div>

      {itens.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
          <i className="fas fa-inbox text-3xl text-gray-300 mb-3" />
          <p className="text-sm text-gray-500 mb-4">Você ainda não abriu nenhuma solicitação.</p>
          <Link href="/" className="inline-block px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700">Ver serviços</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {itens.map((s) => (
            <Link key={s.id} href={`/minhas-solicitacoes/${s.id}`} className="block bg-white rounded-2xl border border-gray-200 p-5 hover:border-blue-200 hover:ring-2 hover:ring-blue-100 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{s.servicoTitulo}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Protocolo <strong className="text-gray-600">{s.protocolo}</strong> · {new Date(s.criadoEm).toLocaleDateString("pt-BR")}</p>
                </div>
                <SituacaoBadge situacao={s.situacao} />
              </div>
              {s.protocoloNumero && <p className="text-[11px] text-gray-400 mt-2"><i className="fas fa-folder-open mr-1" />Protocolo {s.protocoloNumero}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
