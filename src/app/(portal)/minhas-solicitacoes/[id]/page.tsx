import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentTenant } from "@/shared/lib/tenant-map";
import { getSessionCidadao } from "@/shared/lib/portal-session";
import { getByIdDaConta } from "@/shared/repos/solicitacao-repo";
import { SituacaoBadge } from "../SituacaoBadge";

export default async function SolicitacaoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [tenant, cidadao] = await Promise.all([currentTenant(), getSessionCidadao()]);
  if (!cidadao) redirect("/entrar");
  const s = tenant ? await getByIdDaConta(id, cidadao.id, tenant.municipio) : null;
  if (!s) notFound();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <nav className="text-xs text-gray-500">
        <Link href="/minhas-solicitacoes" className="hover:text-blue-600"><i className="fas fa-arrow-left mr-1.5" />Minhas Solicitações</Link>
      </nav>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-gray-100">
          <div>
            <h1 className="text-lg font-bold text-gray-800">{s.servicoTitulo}</h1>
            <p className="text-xs text-gray-400 mt-1">Protocolo <strong className="text-gray-600">{s.protocolo}</strong> · aberta em {new Date(s.criadoEm).toLocaleDateString("pt-BR")}</p>
          </div>
          <SituacaoBadge situacao={s.situacao} />
        </div>

        <dl className="mt-4 space-y-3 text-sm">
          {s.contato && <Campo rotulo="Contato" valor={s.contato} />}
          {s.mensagem && <Campo rotulo="Descrição" valor={s.mensagem} />}
          <Campo rotulo="Processo (tramitação)" valor={s.gedProcessoNumero ?? "Aguardando encaminhamento"} />
        </dl>
      </div>

      <p className="text-[11px] text-gray-400"><i className="fas fa-circle-info mr-1" />A tramitação e a decisão do processo acontecem no sistema de processos do município.</p>
    </div>
  );
}

function Campo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">{rotulo}</dt>
      <dd className="text-gray-700 whitespace-pre-line mt-0.5">{valor}</dd>
    </div>
  );
}
