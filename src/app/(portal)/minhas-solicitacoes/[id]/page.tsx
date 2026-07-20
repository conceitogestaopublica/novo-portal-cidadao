import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentTenant } from "@/shared/lib/tenant-map";
import { getSessionCidadao } from "@/shared/lib/portal-session";
import { getByIdDaConta } from "@/shared/repos/solicitacao-repo";
import { protocoloConfigDe, consultarProtocoloGpe2, type TimelineEvento } from "@/shared/adapters/gpe2.adapter";
import { SituacaoBadge } from "../SituacaoBadge";
import { ResponderForm } from "./ResponderForm";

const ESTILO: Record<string, { icon: string; cor: string }> = {
  abertura: { icon: "fa-flag", cor: "bg-blue-100 text-blue-600" },
  tramite: { icon: "fa-share", cor: "bg-amber-100 text-amber-600" },
  parecer: { icon: "fa-comment-dots", cor: "bg-gray-100 text-gray-500" },
  exigencia: { icon: "fa-circle-question", cor: "bg-violet-100 text-violet-600" },
  resposta: { icon: "fa-reply", cor: "bg-indigo-100 text-indigo-600" },
  encerramento: { icon: "fa-flag-checkered", cor: "bg-green-100 text-green-600" },
};

function fmt(d?: string | null): string {
  if (!d) return "";
  const dt = new Date(d.includes("T") ? d : d.replace(" ", "T"));
  return isNaN(dt.getTime()) ? "" : dt.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export default async function SolicitacaoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [tenant, cidadao] = await Promise.all([currentTenant(), getSessionCidadao()]);
  if (!cidadao) redirect("/entrar");
  const s = tenant ? await getByIdDaConta(id, cidadao.id, tenant.municipio) : null;
  if (!s) notFound();

  // Linha do tempo real, buscada no PAE central (gpe2), quando há protocolo.
  const cfg = tenant ? protocoloConfigDe(tenant) : null;
  const detalhe = cfg && s.protocoloId ? await consultarProtocoloGpe2(cfg, Number(s.protocoloId)) : null;
  // Só usar o corpo do gpe2 se `ok` — um erro HTTP com JSON residual não pode
  // virar situação/eventos válidos na tela do cidadão.
  const detalheValido = detalhe?.ok === true;
  const eventos: TimelineEvento[] = detalheValido ? (detalhe?.eventos ?? []) : [];
  const aguardandoVoce = (detalheValido && detalhe?.situacao === "aguardando") || s.situacao === "AGUARDANDO_VOCE";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <nav className="text-xs text-gray-500">
        <Link href="/minhas-solicitacoes" className="hover:text-blue-600"><i className="fas fa-arrow-left mr-1.5" />Minhas Solicitações</Link>
      </nav>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-gray-100">
          <div>
            <h1 className="text-lg font-bold text-gray-800">{s.servicoTitulo}</h1>
            <p className="text-xs text-gray-400 mt-1">
              Protocolo <strong className="text-gray-600">{s.protocolo}</strong>
              {s.protocoloNumero && <> · Processo <strong className="text-gray-600">{s.protocoloNumero}</strong></>}
              {" "}· aberta em {new Date(s.criadoEm).toLocaleDateString("pt-BR")}
            </p>
          </div>
          <SituacaoBadge situacao={s.situacao} />
        </div>

        <dl className="mt-4 space-y-3 text-sm">
          {s.contato && <Campo rotulo="Contato" valor={s.contato} />}
          {s.mensagem && <Campo rotulo="Descrição" valor={s.mensagem} />}
        </dl>
      </div>

      {/* Ação pendente: o município pediu informações ao cidadão */}
      {aguardandoVoce && (
        <div className="bg-violet-50 border border-violet-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 text-violet-800 font-semibold text-sm">
            <i className="fas fa-circle-question" /> O município pediu mais informações
          </div>
          {(() => {
            const pedido = [...eventos].reverse().find((e) => e.tipo === "exigencia");
            return pedido?.texto ? <p className="text-sm text-violet-900 mt-2 whitespace-pre-line">{pedido.texto}</p> : null;
          })()}
          <ResponderForm id={s.id} />
        </div>
      )}

      {/* Linha do tempo do processo */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-sm font-bold text-gray-700 mb-4"><i className="fas fa-timeline mr-2 text-gray-400" />Andamento do processo</h2>
        {eventos.length === 0 ? (
          <p className="text-sm text-gray-400">
            {s.protocoloNumero
              ? "Ainda não há movimentações registradas."
              : "Solicitação registrada. Assim que for protocolada, o andamento aparece aqui."}
          </p>
        ) : (
          <ol className="relative border-l-2 border-gray-100 ml-3 space-y-5">
            {eventos.map((e, i) => {
              const st = ESTILO[e.tipo] ?? ESTILO.parecer;
              return (
                <li key={i} className="ml-5">
                  <span className={`absolute -left-[15px] w-7 h-7 rounded-full border-4 border-white flex items-center justify-center ${st.cor}`}>
                    <i className={`fas ${st.icon} text-[11px]`} />
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-800">{e.titulo}</p>
                    {e.data && <span className="text-[11px] text-gray-400">{fmt(e.data)}</span>}
                  </div>
                  {e.tipo === "tramite" && (e.de || e.para) && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {e.de ?? "—"} <i className="fas fa-arrow-right mx-1 text-gray-300" /> {e.para ?? "—"}
                    </p>
                  )}
                  {e.texto && <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{e.texto}</p>}
                </li>
              );
            })}
          </ol>
        )}
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
