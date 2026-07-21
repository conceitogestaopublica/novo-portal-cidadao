"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Calculator,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileSignature,
  Gavel,
  Info as InfoIcon,
  Receipt,
  UserLock,
} from "lucide-react";
import { postJson, requestJsonOrError } from "@/shared/lib/client-api";
import { isSessaoExpirada } from "@/shared/lib/http-client";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const money = (v: unknown) => (Number.isFinite(Number(v)) ? BRL.format(Number(v)) : "—");
const dateBR = (v: unknown) => {
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? String(v ?? "—") : d.toLocaleDateString("pt-BR");
};

type Programa = { id: string; nome: string; fundamentoLegal?: string | null; maxParcelas: number; entradaPercentual: number; valorMinimoParcela: number; textoConfissao?: string | null };
type Debito = { inscricaoId: string; numero: string; saldoAtualizado: number; elegivel: boolean; motivoInelegivel?: string; valorPrincipal?: number; valorMulta?: number; valorJuros?: number; valorCorrecao?: number; valorEncargoLegal?: number };
type ResumoSit = { quantidade: number; valorInscrito: number };
type DebitosResp = { debitos: Debito[]; naoParcelavel?: { jaParceladas?: ResumoSit; ajuizadas?: ResumoSit } };
type Parcela = { numero: number; dataVencimento: string; valor: number };
type Simulacao = { parametroNome?: string; valorConsolidado?: number; entradaValor?: number; honorariosValor?: number; valorTotal?: number; qtdParcelas?: number; parcelas?: Parcela[] };
type Resultado = { id: string; numero: string; valorTotal: number };

export function FiscalParcelamento() {
  const [programaId, setProgramaId] = useState("");
  const [qtdStr, setQtdStr] = useState("12");
  const [sim, setSim] = useState<Simulacao | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [verEntram, setVerEntram] = useState(false);
  const [verNaoEntram, setVerNaoEntram] = useState(false);

  const programas = useQuery<{ programas: Programa[] }>({ queryKey: ["parc", "programas"], queryFn: () => requestJsonOrError<{ programas: Programa[] }>("/api/fiscal/parcelamento/programas") });
  const debitos = useQuery<DebitosResp>({
    queryKey: ["parc", "debitos", programaId],
    queryFn: () => requestJsonOrError<DebitosResp>(`/api/fiscal/parcelamento/debitos?parametroId=${programaId}`),
    enabled: !!programaId,
  });

  const programa = programas.data?.programas.find((p) => p.id === programaId);
  const maxParcelas = programa?.maxParcelas ?? 240;
  // qtd (nº parcelas de fato usado) derivada do texto digitado, sem forçar o
  // valor enquanto o cidadão edita — clamped só ao simular/aderir.
  const qtd = Math.max(1, Math.min(maxParcelas, parseInt(qtdStr, 10) || 1));
  const elegiveis = useMemo(() => (debitos.data?.debitos ?? []).filter((d) => d.elegivel), [debitos.data]);
  const inelegiveis = useMemo(() => (debitos.data?.debitos ?? []).filter((d) => !d.elegivel), [debitos.data]);
  const totalElegivel = elegiveis.reduce((s, d) => s + Number(d.saldoAtualizado ?? 0), 0);
  const totalInelegivel = inelegiveis.reduce((s, d) => s + Number(d.saldoAtualizado ?? 0), 0);
  const inscritoElegivel = elegiveis.reduce((s, d) => s + Number(d.valorPrincipal ?? 0) + Number(d.valorMulta ?? 0) + Number(d.valorJuros ?? 0) + Number(d.valorCorrecao ?? 0) + Number(d.valorEncargoLegal ?? 0), 0);
  const atualizacaoConsolidado = (sim?.valorConsolidado ?? totalElegivel) - inscritoElegivel;
  const jaParceladas = debitos.data?.naoParcelavel?.jaParceladas;
  const ajuizadas = debitos.data?.naoParcelavel?.ajuizadas;

  // Ao trocar de programa, limpa a simulação e ajusta as parcelas ao máximo.
  function trocarPrograma(id: string) {
    setProgramaId(id);
    setSim(null);
    setResultado(null);
    setErro(null);
    const novo = programas.data?.programas.find((p) => p.id === id);
    if (novo && (parseInt(qtdStr, 10) || 1) > novo.maxParcelas) setQtdStr(String(novo.maxParcelas));
  }

  if ([programas, debitos].some((q) => isSessaoExpirada(q.error))) {
    return (
      <div className="max-w-md mx-auto text-center bg-white rounded-2xl border border-gray-200 p-8">
        <UserLock className="size-8 text-gray-300 mb-3" aria-hidden="true" />
        <p className="text-sm text-gray-600 mb-4">Sua sessão expirou. Entre novamente.</p>
        <Link href="/entrar" className="inline-block px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700">Entrar</Link>
      </div>
    );
  }

  const ids = elegiveis.map((d) => d.inscricaoId);

  async function simular() {
    if (!programaId || ids.length === 0) return;
    setErro(null); setOcupado(true); setSim(null);
    try {
      setSim(
        await postJson<Simulacao>(
          "/api/fiscal/parcelamento/simular",
          { parametroId: programaId, inscricaoIds: ids, qtdParcelas: qtd },
          "Falha na operação.",
        ),
      );
    } catch (e) { setErro(e instanceof Error ? e.message : "Erro ao simular."); } finally { setOcupado(false); }
  }

  async function aderir() {
    if (!programa) return;
    if (!window.confirm(`${programa.textoConfissao ?? "Ao aderir, você confessa o débito e se compromete a pagar as parcelas."}\n\nDeseja confirmar a adesão ao ${programa.nome}?`)) return;
    setErro(null); setOcupado(true);
    try {
      const r = await postJson<Resultado>(
        "/api/fiscal/parcelamento/aderir",
        { parametroId: programaId, inscricaoIds: ids, qtdParcelas: qtd },
        "Falha na operação.",
      );
      setResultado(r);
    } catch (e) { setErro(e instanceof Error ? e.message : "Erro ao aderir."); } finally { setOcupado(false); }
  }

  if (resultado) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl border border-green-200 p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4"><CheckCircle2 className="size-6" aria-hidden="true" /></div>
          <h1 className="text-xl font-bold text-gray-800">Parcelamento efetivado!</h1>
          <p className="text-sm text-gray-500 mt-1">Termo <strong>{resultado.numero}</strong> — total {money(resultado.valorTotal)}.</p>
          <div className="flex gap-2 justify-center mt-5">
            <a href={`/api/fiscal/parcelamento/${resultado.id}/termo`} target="_blank" rel="noreferrer" className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700"><FileSignature className="size-4 mr-2" />Baixar termo (PDF)</a>
            <Link href="/fiscal" className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50">Ver meus débitos</Link>
          </div>
          <p className="text-[11px] text-gray-400 mt-4">As guias das parcelas já estão disponíveis em “Meus Débitos”.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <nav className="text-xs text-gray-500"><Link href="/fiscal" className="hover:text-blue-600"><ArrowLeft className="size-4 mr-1.5" />Meus Débitos</Link></nav>
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Parcelamento de débitos</h1>
        <p className="text-sm text-gray-500">Parcele sua dívida ativa online: escolha o programa, simule e adira.</p>
      </div>

      {erro && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2"><AlertCircle className="size-4 mr-1.5" />{erro}</div>}

      {/* Programa */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <div>
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Programa</label>
          <select value={programaId} onChange={(e) => trocarPrograma(e.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Selecione um programa…</option>
            {programas.data?.programas.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
          {programa?.fundamentoLegal && <p className="text-[11px] text-gray-400 mt-1">{programa.fundamentoLegal}</p>}
        </div>

        {programaId && (
          debitos.isLoading ? (
            <p className="text-sm text-gray-400">Buscando seus débitos parceláveis…</p>
          ) : elegiveis.length === 0 ? (
            <p className="text-sm text-gray-500"><InfoIcon className="size-4 mr-1.5 text-blue-500" />Você não tem débitos elegíveis para este programa.</p>
          ) : (
            <>
              {/* O que ENTRA no parcelamento */}
              <div className="rounded-xl bg-green-50 border border-green-200 overflow-hidden">
                <button type="button" onClick={() => setVerEntram((v) => !v)} className="w-full flex items-center justify-between px-3 py-2.5 text-sm">
                  <span className="text-gray-700"><CheckCircle2 className="size-4 text-green-600 mr-1.5" /><strong>{elegiveis.length}</strong> inscrição(ões) entram — saldo atualizado <strong>{money(totalElegivel)}</strong></span>
                  {verEntram ? <ChevronUp className="size-3 text-gray-400" aria-hidden="true" /> : <ChevronDown className="size-3 text-gray-400" aria-hidden="true" />}
                </button>
                {verEntram && (
                  <div className="max-h-52 overflow-y-auto border-t border-green-100 divide-y divide-green-100 bg-white">
                    {elegiveis.map((d) => (
                      <div key={d.inscricaoId} className="flex items-center justify-between px-3 py-1.5 text-xs">
                        <span className="text-gray-600">Inscrição <strong className="text-gray-800">{d.numero}</strong></span>
                        <span className="font-semibold text-gray-800">{money(d.saldoAtualizado)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* O que NÃO entra (transparência) */}
              {(inelegiveis.length > 0 || (jaParceladas?.quantidade ?? 0) > 0 || (ajuizadas?.quantidade ?? 0) > 0) && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 overflow-hidden">
                  <button type="button" onClick={() => setVerNaoEntram((v) => !v)} className="w-full flex items-center justify-between px-3 py-2.5 text-sm">
                    <span className="text-gray-700"><InfoIcon className="size-4 text-amber-600 mr-1.5" />Débitos em aberto que <strong>não entram</strong> neste parcelamento</span>
                    {verNaoEntram ? <ChevronUp className="size-3 text-gray-400" aria-hidden="true" /> : <ChevronDown className="size-3 text-gray-400" aria-hidden="true" />}
                  </button>
                  {verNaoEntram && (
                    <div className="border-t border-amber-100 bg-white text-xs">
                      {(jaParceladas?.quantidade ?? 0) > 0 && (
                        <div className="flex items-center justify-between px-3 py-2 border-b border-amber-50">
                          <span className="text-gray-600"><FileSignature className="size-4 text-amber-500 mr-1.5" />Já em parcelamento ({jaParceladas!.quantidade}) — não pode parcelar de novo</span>
                          <span className="font-semibold text-gray-800">{money(jaParceladas!.valorInscrito)}</span>
                        </div>
                      )}
                      {(ajuizadas?.quantidade ?? 0) > 0 && (
                        <div className="flex items-center justify-between px-3 py-2 border-b border-amber-50">
                          <span className="text-gray-600"><Gavel className="size-4 text-amber-500 mr-1.5" />Em execução fiscal ({ajuizadas!.quantidade})</span>
                          <span className="font-semibold text-gray-800">{money(ajuizadas!.valorInscrito)}</span>
                        </div>
                      )}
                      {inelegiveis.map((d) => (
                        <div key={d.inscricaoId} className="flex items-center justify-between px-3 py-2 border-b border-amber-50">
                          <span className="text-gray-600">Inscrição <strong className="text-gray-800">{d.numero}</strong> — {d.motivoInelegivel ?? "não elegível"}</span>
                          <span className="font-semibold text-gray-800">{money(d.saldoAtualizado)}</span>
                        </div>
                      ))}
                      {totalInelegivel > 0 && inelegiveis.length > 1 && (
                        <div className="px-3 py-1.5 text-[11px] text-gray-400 text-right">Subtotal inelegíveis ativas: {money(totalInelegivel)}</div>
                      )}
                    </div>
                  )}
                  <p className="px-3 pb-2 text-[11px] text-amber-700/80">Esses valores continuam em aberto e aparecem em “Meus Débitos”, mas não podem ser incluídos neste parcelamento.</p>
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Número de parcelas (até {programa?.maxParcelas})</label>
                <input
                  type="number"
                  min={1}
                  max={maxParcelas}
                  value={qtdStr}
                  onChange={(e) => { setQtdStr(e.target.value); setSim(null); }}
                  onBlur={() => setQtdStr(String(qtd))}
                  className="mt-1 w-32 px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {programa && programa.entradaPercentual > 0 && <p className="text-[11px] text-gray-400 mt-1">Entrada de {programa.entradaPercentual}%. Parcela mínima {money(programa.valorMinimoParcela)}.</p>}
              </div>
              <button onClick={simular} disabled={ocupado} className="px-5 py-2.5 rounded-xl bg-gray-800 text-white font-bold text-sm hover:bg-gray-900 disabled:opacity-60"><Calculator className="size-4 mr-2" />{ocupado && !sim ? "Simulando…" : "Simular"}</button>
            </>
          )
        )}
      </div>

      {/* Simulação */}
      {sim && (
        <div className="bg-white rounded-2xl border border-blue-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-blue-50/50">
            <h2 className="text-sm font-bold text-gray-800"><Receipt className="size-4 text-blue-600 mr-2" />Simulação — {sim.parametroNome}</h2>
          </div>
          {/* Deixa explícito que o débito foi ATUALIZADO na consolidação. */}
          <div className="px-5 pt-4 text-sm">
            <div className="rounded-xl border border-gray-100 divide-y divide-gray-100">
              <Linha rotulo="Valor inscrito (original)" valor={money(inscritoElegivel)} />
              <Linha rotulo="Atualização (juros, multa e correção até hoje)" valor={`+ ${money(atualizacaoConsolidado)}`} destaque />
              <Linha rotulo="Valor consolidado" valor={money(sim.valorConsolidado)} negrito />
              {Number(sim.honorariosValor ?? 0) > 0 && <Linha rotulo="Honorários" valor={`+ ${money(sim.honorariosValor)}`} />}
              <Linha rotulo="Total a parcelar" valor={money(sim.valorTotal)} negrito />
            </div>
          </div>
          <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <Info titulo="Consolidado" valor={money(sim.valorConsolidado)} />
            <Info titulo="Entrada" valor={money(sim.entradaValor)} />
            <Info titulo="Honorários" valor={money(sim.honorariosValor)} />
            <Info titulo="Total" valor={money(sim.valorTotal)} destaque />
          </div>
          <div className="px-5 pb-2 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-gray-400 text-xs uppercase"><tr><th className="text-left py-1">Parcela</th><th className="text-left py-1">Vencimento</th><th className="text-right py-1">Valor</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {(sim.parcelas ?? []).map((p) => (
                  <tr key={p.numero}><td className="py-2 font-medium text-gray-700">{p.numero === 0 ? "Entrada" : `${p.numero}ª`}</td><td className="py-2 text-gray-600">{dateBR(p.dataVencimento)}</td><td className="py-2 text-right font-semibold text-gray-800">{money(p.valor)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-4 border-t border-gray-100">
            {erro && <div className="mb-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2"><AlertCircle className="size-4 mr-1.5" />{erro}</div>}
            <button onClick={aderir} disabled={ocupado} className="w-full px-5 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-60"><FileSignature className="size-4 mr-2" />{ocupado ? "Processando… (pode levar alguns segundos)" : "Aderir ao parcelamento"}</button>
            <p className="text-[11px] text-gray-400 mt-2 text-center">Ao aderir, você confessa o débito e gera o termo + as guias das parcelas.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function Linha({ rotulo, valor, destaque, negrito }: { rotulo: string; valor: string; destaque?: boolean; negrito?: boolean }) {
  return (
    <div className="flex items-center justify-between px-3 py-2">
      <span className={`text-xs ${destaque ? "text-amber-700" : "text-gray-500"}`}>{rotulo}</span>
      <span className={`text-sm ${negrito ? "font-bold text-gray-900" : destaque ? "font-semibold text-amber-700" : "text-gray-700"}`}>{valor}</span>
    </div>
  );
}

function Info({ titulo, valor, destaque }: { titulo: string; valor: string; destaque?: boolean }) {
  return (
    <div className={`rounded-xl p-3 ${destaque ? "bg-blue-600 text-white" : "bg-gray-50"}`}>
      <p className={`text-[10px] uppercase tracking-wider font-semibold ${destaque ? "text-blue-100" : "text-gray-400"}`}>{titulo}</p>
      <p className={`text-sm font-bold ${destaque ? "text-white" : "text-gray-800"}`}>{valor}</p>
    </div>
  );
}
