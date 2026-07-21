"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  CalendarPlus,
  CheckCircle2,
  ClipboardList,
  FileText,
  FileWarning,
  Plus,
  Send,
  Trash2,
  UserLock,
} from "lucide-react";
import Link from "next/link";
import { postJson, requestJsonOrError, requestNoContentOrError } from "@/shared/lib/client-api";
import { isSessaoExpirada } from "@/shared/lib/http-client";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const money = (v: unknown) => (Number.isFinite(Number(v)) ? BRL.format(Number(v)) : "—");
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const competenciaLabel = (ano: number, mes: number) => `${MESES[mes - 1]}/${ano}`;

type Empresa = { economicoId: string; inscricaoMunicipal: string; ativo: boolean };
type ItemServico = { id: string; itemServicoId: string; codigo: string; descricao: string };
type Item = {
  id: string;
  codigo: string;
  descricao: string;
  baseCalculo: number;
  aliquota: number;
  valorIss: number;
  retido: boolean;
  tomadorDocumento: string | null;
};
type Dms = {
  id: string;
  competenciaAno: number;
  competenciaMes: number;
  situacao: string;
  dataEntrega: string | null;
  totalBase: number;
  totalIss: number;
  qtdItens?: number;
  itens?: Item[];
};

const SITUACAO_COR: Record<string, string> = {
  RASCUNHO: "bg-amber-100 text-amber-700",
  ENTREGUE: "bg-green-100 text-green-700",
  CANCELADA: "bg-gray-100 text-gray-600",
};

/** Vencimento sugerido: dia 10 do mês seguinte ao de hoje. */
function vencimentoPadrao(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 10).toISOString().slice(0, 10);
}

export function FiscalDms() {
  const qc = useQueryClient();
  const [economicoId, setEconomicoId] = useState("");
  const [abertaId, setAbertaId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const hoje = new Date();
  const [ano, setAno] = useState(String(hoje.getFullYear()));
  const [mes, setMes] = useState(String(hoje.getMonth() + 1));

  // Formulário do item
  const [itemServicoId, setItemServicoId] = useState("");
  const [base, setBase] = useState("");
  const [retido, setRetido] = useState(false);
  const [tomadorDoc, setTomadorDoc] = useState("");

  const empresas = useQuery<Empresa[]>({
    queryKey: ["dms", "empresas"],
    queryFn: () => requestJsonOrError<Empresa[]>("/api/fiscal/nfse/economicos"),
  });
  const ativas = useMemo(() => (empresas.data ?? []).filter((e) => e.ativo), [empresas.data]);
  const empresaId = economicoId || ativas[0]?.economicoId || "";

  const lista = useQuery<Dms[]>({
    queryKey: ["dms", "lista", empresaId],
    queryFn: () => requestJsonOrError<Dms[]>(`/api/fiscal/dms?economicoId=${empresaId}`),
    enabled: !!empresaId,
  });
  const detalhe = useQuery<Dms>({
    queryKey: ["dms", "detalhe", abertaId],
    queryFn: () => requestJsonOrError<Dms>(`/api/fiscal/dms/${abertaId}`),
    enabled: !!abertaId,
  });
  const itens = useQuery<ItemServico[]>({
    queryKey: ["dms", "itens-servico", empresaId],
    queryFn: () => requestJsonOrError<ItemServico[]>(`/api/fiscal/nfse/itens-servico?economicoId=${empresaId}`),
    enabled: !!empresaId,
  });

  const semSessao = [empresas, lista].some((q) => isSessaoExpirada(q.error));
  if (semSessao) {
    return (
      <div className="max-w-md mx-auto text-center bg-white rounded-2xl border border-gray-200 p-8">
        <UserLock className="size-8 text-gray-300 mb-3" aria-hidden="true" />
        <p className="text-sm text-gray-600 mb-4">Sua sessão expirou. Entre novamente.</p>
        <Link href="/entrar" className="inline-block px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700">
          Entrar
        </Link>
      </div>
    );
  }

  function recarregar() {
    void qc.invalidateQueries({ queryKey: ["dms", "lista", empresaId] });
    if (abertaId) void qc.invalidateQueries({ queryKey: ["dms", "detalhe", abertaId] });
  }

  async function acao(fn: () => Promise<unknown>) {
    setErro(null);
    setOcupado(true);
    try {
      await fn();
      recarregar();
      return true;
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro.");
      return false;
    } finally {
      setOcupado(false);
    }
  }

  async function abrirCompetencia() {
    const r = (await acao(async () => {
      const d = await postJson<{ id: string }>(
        "/api/fiscal/dms",
        {
          economicoId: empresaId,
          competenciaAno: Number(ano),
          competenciaMes: Number(mes),
        },
        "Falha na operação.",
      );
      setAbertaId(d.id);
      return d;
    })) as boolean;
    return r;
  }

  async function escriturar() {
    if (!abertaId) return;
    const ok = await acao(() =>
      postJson(
        `/api/fiscal/dms/${abertaId}/itens`,
        {
          itemServicoLc116Id: itemServicoId,
          baseCalculo: Number(base.replace(",", ".")),
          retido,
          tomadorDocumento: tomadorDoc.replace(/\D/g, "") || null,
        },
        "Falha na operação.",
      ),
    );
    if (ok) {
      setBase("");
      setTomadorDoc("");
      setRetido(false);
    }
  }

  async function entregar() {
    if (!abertaId || !d) return;
    if (
      !window.confirm(
        `Entregar a declaração de ${competenciaLabel(d.competenciaAno, d.competenciaMes)}?\n\n` +
          "Depois de entregue ela não pode mais ser alterada, e a guia do ISS é gerada.",
      )
    )
      return;
    await acao(() =>
      postJson(
        `/api/fiscal/dms/${abertaId}/entregar`,
        {
          dataVencimento: vencimentoPadrao(),
        },
        "Falha na operação.",
      ),
    );
  }

  const d = detalhe.data;
  const rascunho = d?.situacao === "RASCUNHO";
  // O backend recusa entregar competência sem item — não ofereça o que ele nega.
  const vazia = (d?.itens ?? []).length === 0;
  const podeEscriturar =
    rascunho && !!itemServicoId && Number(base.replace(",", ".")) > 0;

  if (empresas.isSuccess && ativas.length === 0) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Cabecalho />
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <FileWarning className="size-8 text-gray-300 mb-3" aria-hidden="true" />
          <p className="text-sm text-gray-600">
            Você não tem empresa ativa no cadastro econômico do município.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Se você é contador, use <strong>&quot;atuar como&quot;</strong> para escolher o cliente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Cabecalho />

      {erro && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
          <AlertCircle className="size-4 mr-1.5" aria-hidden="true" />
          {erro}
        </div>
      )}

      {ativas.length > 1 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            Empresa
          </label>
          <select
            value={empresaId}
            onChange={(e) => {
              setEconomicoId(e.target.value);
              setAbertaId(null);
            }}
            className="mt-1 w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {ativas.map((e) => (
              <option key={e.economicoId} value={e.economicoId}>
                Inscrição {e.inscricaoMunicipal}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Abrir competência */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h2 className="text-sm font-bold text-gray-800 mb-3">
          <CalendarPlus className="size-4 text-blue-600 mr-2" />
          Abrir competência
        </h2>
        <div className="flex flex-wrap items-end gap-2">
          <div className="w-28">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Mês</label>
            <select value={mes} onChange={(e) => setMes(e.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm">
              {MESES.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div className="w-28">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Ano</label>
            <input value={ano} onChange={(e) => setAno(e.target.value)} inputMode="numeric" className="mt-1 w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm" />
          </div>
          <button onClick={() => void abrirCompetencia()} disabled={ocupado} className="px-5 py-2.5 rounded-xl bg-gray-800 text-white font-bold text-sm hover:bg-gray-900 disabled:opacity-60">
            Abrir
          </button>
        </div>
        <p className="text-[11px] text-gray-400 mt-2">
          Abra a competência, escriture os serviços prestados e entregue.
        </p>
      </div>

      {/* Declarações */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-800">
            <ClipboardList className="size-4 text-gray-400 mr-2" />
            Minhas declarações
          </h2>
        </div>
        {lista.isLoading ? (
          <p className="px-5 py-6 text-sm text-gray-400">Carregando…</p>
        ) : (lista.data ?? []).length === 0 ? (
          <p className="px-5 py-6 text-sm text-gray-500">Nenhuma declaração ainda.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {(lista.data ?? []).map((x) => (
              <li key={x.id}>
                <button
                  type="button"
                  onClick={() => setAbertaId(x.id === abertaId ? null : x.id)}
                  className={`w-full flex items-center justify-between px-5 py-3 text-sm hover:bg-gray-50 ${x.id === abertaId ? "bg-blue-50/40" : ""}`}
                >
                  <span className="flex items-center gap-3">
                    <strong className="text-gray-800">{competenciaLabel(x.competenciaAno, x.competenciaMes)}</strong>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${SITUACAO_COR[x.situacao] ?? "bg-gray-100 text-gray-600"}`}>
                      {x.situacao}
                    </span>
                    <span className="text-xs text-gray-400">{x.qtdItens ?? 0} serviço(s)</span>
                  </span>
                  <span className="text-gray-700">
                    base {money(x.totalBase)} · ISS <strong>{money(x.totalIss)}</strong>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Detalhe da declaração aberta */}
      {abertaId && d && (
        <div className="bg-white rounded-2xl border border-blue-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-blue-50/50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-800">
              <FileText className="size-4 text-blue-600 mr-2" />
              {competenciaLabel(d.competenciaAno, d.competenciaMes)}
              <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-semibold ${SITUACAO_COR[d.situacao] ?? ""}`}>
                {d.situacao}
              </span>
            </h2>
            <span className="text-sm text-gray-600">
              ISS <strong>{money(d.totalIss)}</strong>
            </span>
          </div>

          {/* Itens */}
          <div className="px-5 py-3">
            {(d.itens ?? []).length === 0 ? (
              <p className="text-sm text-gray-500 py-2">
                Nenhum serviço escriturado{rascunho ? " — adicione abaixo para poder entregar." : "."}
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-gray-400 text-xs uppercase">
                  <tr>
                    <th className="text-left py-1">Serviço</th>
                    <th className="text-right py-1">Base</th>
                    <th className="text-right py-1">Alíq.</th>
                    <th className="text-right py-1">ISS</th>
                    <th className="py-1" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(d.itens ?? []).map((i) => (
                    <tr key={i.id}>
                      <td className="py-2 text-gray-700">
                        {i.codigo}
                        <span className="text-gray-400 text-xs"> — {i.descricao}</span>
                        {i.retido && <span className="ml-1 text-[10px] text-amber-600">retido</span>}
                      </td>
                      <td className="py-2 text-right text-gray-600">{money(i.baseCalculo)}</td>
                      <td className="py-2 text-right text-gray-500">{i.aliquota}%</td>
                      <td className="py-2 text-right font-semibold text-gray-800">{money(i.valorIss)}</td>
                      <td className="py-2 text-right">
                        {rascunho && (
                          <button
                            type="button"
                            disabled={ocupado}
                            onClick={() =>
                              void acao(() =>
                                requestNoContentOrError(
                                  `/api/fiscal/dms/${abertaId}/itens/${i.id}`,
                                  { method: "DELETE" },
                                  "Falha na operação.",
                                ),
                              )
                            }
                            className="text-gray-300 hover:text-red-600"
                            title="Remover"
                          >
                            <Trash2 className="size-3" aria-hidden="true" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {rascunho ? (
            <>
              {/* Escriturar */}
              <div className="px-5 py-4 border-t border-gray-100 space-y-3">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Escriturar serviço
                </p>
                <select value={itemServicoId} onChange={(e) => setItemServicoId(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm">
                  <option value="">Selecione o serviço…</option>
                  {(itens.data ?? []).map((i) => (
                    <option key={i.id} value={i.itemServicoId}>
                      {i.codigo} — {i.descricao}
                    </option>
                  ))}
                </select>
                <div className="grid sm:grid-cols-3 gap-3">
                  <input value={base} onChange={(e) => setBase(e.target.value)} inputMode="decimal" placeholder="Valor do serviço" className="px-3 py-2.5 rounded-xl border border-gray-300 text-sm" />
                  <input value={tomadorDoc} onChange={(e) => setTomadorDoc(e.target.value)} inputMode="numeric" placeholder="CPF/CNPJ do tomador (opcional)" className="px-3 py-2.5 rounded-xl border border-gray-300 text-sm" />
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input type="checkbox" checked={retido} onChange={(e) => setRetido(e.target.checked)} className="rounded border-gray-300" />
                    ISS retido pelo tomador
                  </label>
                </div>
                <button onClick={() => void escriturar()} disabled={!podeEscriturar || ocupado} className="px-4 py-2 rounded-xl bg-gray-800 text-white font-bold text-sm hover:bg-gray-900 disabled:opacity-60">
                  <Plus className="size-4 mr-1.5" />
                  Adicionar
                </button>
                <p className="text-[11px] text-gray-400">
                  O ISS sai da alíquota vigente do serviço. Marcando <strong>retido</strong>, o
                  imposto é devido pelo tomador e não entra na sua guia.
                </p>
              </div>

              {/* Entregar */}
              <div className="px-5 py-4 border-t border-gray-100">
                <button onClick={() => void entregar()} disabled={ocupado || vazia} className="w-full px-5 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-60">
                  <Send className="size-4 mr-2" />
                  {ocupado ? "Entregando…" : "Entregar declaração"}
                </button>
                <p className="text-[11px] text-gray-400 mt-2 text-center">
                  {vazia
                    ? "Escriture ao menos um serviço para entregar a competência."
                    : "Depois de entregue não dá para alterar. A guia do ISS é gerada na hora e aparece em Meus Débitos."}
                </p>
              </div>
            </>
          ) : (
            <div className="px-5 py-4 border-t border-gray-100 text-sm text-gray-600">
              <CheckCircle2 className="size-4 text-green-600 mr-1.5" />
              Entregue{d.dataEntrega ? ` em ${new Date(d.dataEntrega).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}` : ""}. A
              guia do ISS está em <Link href="/fiscal" className="text-blue-600 font-semibold">Meus Débitos</Link>.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Cabecalho() {
  return (
    <>
      <nav className="text-xs text-gray-500">
        <Link href="/fiscal" className="hover:text-blue-600">
          <ArrowLeft className="size-4 mr-1.5" />
          Área fiscal
        </Link>
      </nav>
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Declaração mensal (DMS)</h1>
        <p className="text-sm text-gray-500">
          Escriture os serviços prestados no mês e entregue a competência — a guia do
          ISS é gerada na entrega.
        </p>
      </div>
    </>
  );
}
