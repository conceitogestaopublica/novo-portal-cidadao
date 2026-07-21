"use client";

import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { isSessaoExpirada } from "@/shared/lib/http-client";
import { Button } from "@/components/ui/button";
import {
  useAbrirCompetenciaDms,
  useDmsDetalhe,
  useDmsLista,
  useEmpresasEconomico,
  useEntregarDms,
  useEscriturarItemDms,
  useItensServicoDms,
  useRemoverItemDms,
} from "../hooks/use-fiscal-dms";
import type { Empresa } from "../services/fiscal-dms.service";
import {
  escriturarItemFormSchema,
  type EscriturarItemFormInput,
  type EscriturarItemFormOutput,
} from "../schemas/dms.schema";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const money = (v: unknown) => (Number.isFinite(Number(v)) ? BRL.format(Number(v)) : "—");
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const competenciaLabel = (ano: number, mes: number) => `${MESES[mes - 1]}/${ano}`;

const SITUACAO_COR: Record<string, string> = {
  RASCUNHO: "bg-amber-100 text-amber-700",
  ENTREGUE: "bg-green-100 text-green-700",
  CANCELADA: "bg-muted text-muted-foreground",
};

/** Vencimento sugerido: dia 10 do mês seguinte ao de hoje. */
function vencimentoPadrao(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 10).toISOString().slice(0, 10);
}

export function FiscalDms() {
  const [economicoId, setEconomicoId] = useState("");
  const [abertaId, setAbertaId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const hoje = new Date();
  const [ano, setAno] = useState(String(hoje.getFullYear()));
  const [mes, setMes] = useState(String(hoje.getMonth() + 1));

  // Formulário do item — RHF + Zod (dado fiscal real: valor do serviço, retenção, tomador).
  const {
    register: registerItem,
    handleSubmit: handleSubmitItem,
    reset: resetItem,
    formState: { errors: erroItem },
  } = useForm<EscriturarItemFormInput, unknown, EscriturarItemFormOutput>({
    resolver: zodResolver(escriturarItemFormSchema),
    defaultValues: { itemServicoId: "", base: "", retido: false, tomadorDoc: "" },
  });

  const empresas = useEmpresasEconomico();
  const ativas = useMemo(
    () => (empresas.data ?? []).filter((e: Empresa) => e.ativo),
    [empresas.data],
  );
  const empresaId = economicoId || ativas[0]?.economicoId || "";

  const lista = useDmsLista(empresaId);
  const detalhe = useDmsDetalhe(abertaId);
  const itens = useItensServicoDms(empresaId);

  const abrirCompetenciaMutation = useAbrirCompetenciaDms(empresaId);
  const escriturarItemMutation = useEscriturarItemDms(empresaId, abertaId);
  const entregarMutation = useEntregarDms(empresaId, abertaId);
  const removerItemMutation = useRemoverItemDms(empresaId, abertaId);

  const semSessao = [empresas, lista].some((q) => isSessaoExpirada(q.error));
  if (semSessao) {
    return (
      <div className="max-w-md mx-auto text-center bg-card rounded-2xl border border-border p-8">
        <UserLock className="size-8 text-muted-foreground mb-3" aria-hidden="true" />
        <p className="text-sm text-muted-foreground mb-4">Sua sessão expirou. Entre novamente.</p>
        <Link href="/entrar" className="inline-block px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700">
          Entrar
        </Link>
      </div>
    );
  }

  async function acao(fn: () => Promise<unknown>) {
    setErro(null);
    setOcupado(true);
    try {
      await fn();
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
      const d = await abrirCompetenciaMutation.mutateAsync({
        economicoId: empresaId,
        competenciaAno: Number(ano),
        competenciaMes: Number(mes),
      });
      setAbertaId(d.id);
      return d;
    })) as boolean;
    return r;
  }

  async function escriturar(dados: EscriturarItemFormOutput) {
    if (!abertaId) return;
    const ok = await acao(() =>
      escriturarItemMutation.mutateAsync({
        itemServicoLc116Id: dados.itemServicoId,
        baseCalculo: Number(dados.base.replace(",", ".")),
        retido: dados.retido,
        tomadorDocumento: dados.tomadorDoc.replace(/\D/g, "") || null,
      }),
    );
    if (ok) resetItem();
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
    await acao(() => entregarMutation.mutateAsync({ dataVencimento: vencimentoPadrao() }));
  }

  const d = detalhe.data;
  const rascunho = d?.situacao === "RASCUNHO";
  // O backend recusa entregar competência sem item — não ofereça o que ele nega.
  const vazia = (d?.itens ?? []).length === 0;

  if (empresas.isSuccess && ativas.length === 0) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Cabecalho />
        <div className="bg-card rounded-2xl border border-border p-8 text-center">
          <FileWarning className="size-8 text-muted-foreground mb-3" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            Você não tem empresa ativa no cadastro econômico do município.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
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
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm px-3 py-2">
          <AlertCircle className="size-4 mr-1.5" aria-hidden="true" />
          {erro}
        </div>
      )}

      {ativas.length > 1 && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Empresa
          </label>
          <select
            value={empresaId}
            onChange={(e) => {
              setEconomicoId(e.target.value);
              setAbertaId(null);
            }}
            className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      <div className="bg-card rounded-2xl border border-border p-5">
        <h2 className="text-sm font-bold text-foreground mb-3">
          <CalendarPlus className="size-4 text-blue-600 mr-2" />
          Abrir competência
        </h2>
        <div className="flex flex-wrap items-end gap-2">
          <div className="w-28">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Mês</label>
            <select value={mes} onChange={(e) => setMes(e.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border text-sm">
              {MESES.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div className="w-28">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ano</label>
            <input value={ano} onChange={(e) => setAno(e.target.value)} inputMode="numeric" className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border text-sm" />
          </div>
          <button onClick={() => void abrirCompetencia()} disabled={ocupado} className="px-5 py-2.5 rounded-xl bg-gray-800 text-white font-bold text-sm hover:bg-gray-900 disabled:opacity-60">
            Abrir
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">
          Abra a competência, escriture os serviços prestados e entregue.
        </p>
      </div>

      {/* Declarações */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-bold text-foreground">
            <ClipboardList className="size-4 text-muted-foreground mr-2" />
            Minhas declarações
          </h2>
        </div>
        {lista.isLoading ? (
          <p className="px-5 py-6 text-sm text-muted-foreground">Carregando…</p>
        ) : (lista.data ?? []).length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground">Nenhuma declaração ainda.</p>
        ) : (
          <ul className="divide-y divide-border">
            {(lista.data ?? []).map((x) => (
              <li key={x.id}>
                <button
                  type="button"
                  onClick={() => setAbertaId(x.id === abertaId ? null : x.id)}
                  className={`w-full flex items-center justify-between px-5 py-3 text-sm hover:bg-muted/50 ${x.id === abertaId ? "bg-blue-50/40" : ""}`}
                >
                  <span className="flex items-center gap-3">
                    <strong className="text-foreground">{competenciaLabel(x.competenciaAno, x.competenciaMes)}</strong>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${SITUACAO_COR[x.situacao] ?? "bg-muted text-muted-foreground"}`}>
                      {x.situacao}
                    </span>
                    <span className="text-xs text-muted-foreground">{x.qtdItens ?? 0} serviço(s)</span>
                  </span>
                  <span className="text-foreground">
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
        <div className="bg-card rounded-2xl border border-blue-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-blue-50/50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">
              <FileText className="size-4 text-blue-600 mr-2" />
              {competenciaLabel(d.competenciaAno, d.competenciaMes)}
              <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-semibold ${SITUACAO_COR[d.situacao] ?? ""}`}>
                {d.situacao}
              </span>
            </h2>
            <span className="text-sm text-muted-foreground">
              ISS <strong>{money(d.totalIss)}</strong>
            </span>
          </div>

          {/* Itens */}
          <div className="px-5 py-3">
            {(d.itens ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                Nenhum serviço escriturado{rascunho ? " — adicione abaixo para poder entregar." : "."}
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-muted-foreground text-xs uppercase">
                  <tr>
                    <th className="text-left py-1">Serviço</th>
                    <th className="text-right py-1">Base</th>
                    <th className="text-right py-1">Alíq.</th>
                    <th className="text-right py-1">ISS</th>
                    <th className="py-1" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(d.itens ?? []).map((i) => (
                    <tr key={i.id}>
                      <td className="py-2 text-foreground">
                        {i.codigo}
                        <span className="text-muted-foreground text-xs"> — {i.descricao}</span>
                        {i.retido && <span className="ml-1 text-[10px] text-amber-600">retido</span>}
                      </td>
                      <td className="py-2 text-right text-muted-foreground">{money(i.baseCalculo)}</td>
                      <td className="py-2 text-right text-muted-foreground">{i.aliquota}%</td>
                      <td className="py-2 text-right font-semibold text-foreground">{money(i.valorIss)}</td>
                      <td className="py-2 text-right">
                        {rascunho && (
                          <button
                            type="button"
                            disabled={ocupado}
                            onClick={() => void acao(() => removerItemMutation.mutateAsync(i.id))}
                            className="text-muted-foreground hover:text-red-600"
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
              <form onSubmit={handleSubmitItem(escriturar)} className="px-5 py-4 border-t border-border space-y-3" noValidate>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Escriturar serviço
                </p>
                <div>
                  <select {...registerItem("itemServicoId")} className="w-full px-3 py-2.5 rounded-xl border border-border text-sm">
                    <option value="">Selecione o serviço…</option>
                    {(itens.data ?? []).map((i) => (
                      <option key={i.id} value={i.itemServicoId}>
                        {i.codigo} — {i.descricao}
                      </option>
                    ))}
                  </select>
                  {erroItem.itemServicoId && (
                    <p className="text-xs text-destructive mt-1" role="alert">{erroItem.itemServicoId.message}</p>
                  )}
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <input {...registerItem("base")} inputMode="decimal" placeholder="Valor do serviço" className="w-full px-3 py-2.5 rounded-xl border border-border text-sm" />
                    {erroItem.base && <p className="text-xs text-destructive mt-1" role="alert">{erroItem.base.message}</p>}
                  </div>
                  <input {...registerItem("tomadorDoc")} inputMode="numeric" placeholder="CPF/CNPJ do tomador (opcional)" className="px-3 py-2.5 rounded-xl border border-border text-sm" />
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <input type="checkbox" {...registerItem("retido")} className="rounded border-border" />
                    ISS retido pelo tomador
                  </label>
                </div>
                <Button type="submit" disabled={ocupado} className="px-4 py-2 h-auto rounded-xl bg-gray-800 text-white font-bold text-sm hover:bg-gray-900 disabled:opacity-60">
                  <Plus className="size-4 mr-1.5" />
                  Adicionar
                </Button>
                <p className="text-[11px] text-muted-foreground">
                  O ISS sai da alíquota vigente do serviço. Marcando <strong>retido</strong>, o
                  imposto é devido pelo tomador e não entra na sua guia.
                </p>
              </form>

              {/* Entregar */}
              <div className="px-5 py-4 border-t border-border">
                <button onClick={() => void entregar()} disabled={ocupado || vazia} className="w-full px-5 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-60">
                  <Send className="size-4 mr-2" />
                  {ocupado ? "Entregando…" : "Entregar declaração"}
                </button>
                <p className="text-[11px] text-muted-foreground mt-2 text-center">
                  {vazia
                    ? "Escriture ao menos um serviço para entregar a competência."
                    : "Depois de entregue não dá para alterar. A guia do ISS é gerada na hora e aparece em Meus Débitos."}
                </p>
              </div>
            </>
          ) : (
            <div className="px-5 py-4 border-t border-border text-sm text-muted-foreground">
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
      <nav className="text-xs text-muted-foreground">
        <Link href="/fiscal" className="hover:text-blue-600">
          <ArrowLeft className="size-4 mr-1.5" />
          Área fiscal
        </Link>
      </nav>
      <div>
        <h1 className="text-2xl font-bold text-foreground">Declaração mensal (DMS)</h1>
        <p className="text-sm text-muted-foreground">
          Escriture os serviços prestados no mês e entregue a competência — a guia do
          ISS é gerada na entrega.
        </p>
      </div>
    </>
  );
}
