"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  FileText,
  FileWarning,
  Plus,
  Send,
  UserLock,
} from "lucide-react";
import Link from "next/link";
import { isSessaoExpirada } from "@/shared/lib/http-client";
import { baixarDanfse, Emitida } from "../services/nfse.service";
import { useEmitirNfse, useNfseEmpresas, useNfseItensServico, useNfseNotas } from "../hooks/use-nfse";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const money = (v: unknown) => (Number.isFinite(Number(v)) ? BRL.format(Number(v)) : "—");
const dateBR = (v: unknown) => {
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? String(v ?? "—") : d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
};

const SITUACAO_COR: Record<string, string> = {
  EMITIDA: "bg-green-100 text-green-700",
  CANCELADA: "bg-red-100 text-red-700",
  SUBSTITUIDA: "bg-muted text-muted-foreground",
};

export function FiscalNfse() {
  const [economicoId, setEconomicoId] = useState("");
  const [emitindo, setEmitindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [emitida, setEmitida] = useState<Emitida | null>(null);
  const [erroDownload, setErroDownload] = useState<string | null>(null);

  // Formulário
  const [itemServicoId, setItemServicoId] = useState("");
  const [valor, setValor] = useState("");
  const [discriminacao, setDiscriminacao] = useState("");
  const [tomadorNome, setTomadorNome] = useState("");
  const [tomadorDoc, setTomadorDoc] = useState("");
  const [issRetido, setIssRetido] = useState(false);

  const empresas = useNfseEmpresas();

  // A empresa escolhida vale o que o usuário selecionou; sem seleção, cai na
  // primeira ATIVA — quem só tem uma empresa não precisa escolher nada.
  const ativas = useMemo(
    () => (empresas.data ?? []).filter((e) => e.ativo),
    [empresas.data],
  );
  const empresaId = economicoId || ativas[0]?.economicoId || "";

  const itens = useNfseItensServico(empresaId);
  const notas = useNfseNotas(empresaId);
  const emitirMutation = useEmitirNfse();

  const semSessao = [empresas, itens, notas].some((q) => isSessaoExpirada(q.error));
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

  function limpar() {
    setItemServicoId("");
    setValor("");
    setDiscriminacao("");
    setTomadorNome("");
    setTomadorDoc("");
    setIssRetido(false);
    setErro(null);
  }

  async function emitir() {
    if (
      !window.confirm(
        "Emitir esta NFS-e agora? A nota fiscal é gerada oficialmente, com código de verificação, e não pode ser desfeita.",
      )
    )
      return;
    setErro(null);
    setOcupado(true);
    try {
      const r = await emitirMutation.mutateAsync({
        economicoId: empresaId,
        itemServicoId,
        discriminacao: discriminacao.trim(),
        valorServicos: Number(valor.replace(",", ".")),
        issRetido,
        tomador: {
          nome: tomadorNome.trim(),
          documento: tomadorDoc.replace(/\D/g, "") || null,
        },
      });
      setEmitida(r);
      setEmitindo(false);
      limpar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao emitir.");
    } finally {
      setOcupado(false);
    }
  }

  const podeEmitir =
    !!empresaId &&
    !!itemServicoId &&
    Number(valor.replace(",", ".")) > 0 &&
    discriminacao.trim().length >= 3 &&
    tomadorNome.trim().length >= 2;

  // Sem empresa ativa não há o que emitir — explica em vez de mostrar um form morto.
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
            A emissão de NFS-e é feita por uma empresa inscrita. Se você é
            contador, use <strong>&quot;atuar como&quot;</strong> para escolher o cliente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Cabecalho />

      {emitida && (
        <div className="rounded-2xl bg-green-50 border border-green-200 p-4 flex items-center justify-between gap-3">
          <p className="text-sm text-foreground inline-flex items-center gap-2">
            <CheckCircle2 className="size-4 text-green-600" />
            NFS-e <strong>nº {emitida.numero}</strong> (série {emitida.serie}) emitida —
            ISS {money(emitida.valorIss)}.
          </p>
          <button
            type="button"
            onClick={() => setEmitida(null)}
            className="text-xs text-muted-foreground hover:text-muted-foreground"
          >
            fechar
          </button>
        </div>
      )}

      {/* Empresa (só aparece quando há mais de uma) */}
      {ativas.length > 1 && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Emitir pela empresa
          </label>
          <select
            value={empresaId}
            onChange={(e) => {
              setEconomicoId(e.target.value);
              setItemServicoId("");
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

      {!emitindo ? (
        <button
          onClick={() => setEmitindo(true)}
          className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 inline-flex items-center gap-2"
        >
          <Plus className="size-4" />
          Emitir NFS-e
        </button>
      ) : (
        <div className="bg-card rounded-2xl border border-blue-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-blue-50/50">
            <h2 className="text-sm font-bold text-foreground inline-flex items-center gap-2">
              <FileText className="size-4 text-blue-600" />
              Nova NFS-e
            </h2>
          </div>
          <div className="p-5 space-y-4">
            {erro && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm px-3 py-2 inline-flex items-center gap-1.5">
                <AlertCircle className="size-4" aria-hidden="true" />
                {erro}
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Serviço prestado
              </label>
              <select
                value={itemServicoId}
                onChange={(e) => setItemServicoId(e.target.value)}
                className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione…</option>
                {(itens.data ?? []).map((i) => (
                  <option key={i.id} value={i.itemServicoId}>
                    {i.codigo} — {i.descricao}
                  </option>
                ))}
              </select>
              {itens.isSuccess && (itens.data ?? []).length === 0 && (
                <p className="text-[11px] text-amber-700 mt-1">
                  Nenhum serviço cadastrado para esta empresa. Procure a Prefeitura
                  para vincular os serviços que ela presta.
                </p>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Valor do serviço
                </label>
                <input
                  inputMode="decimal"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="0,00"
                  className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm text-muted-foreground pb-2.5">
                  <input
                    type="checkbox"
                    checked={issRetido}
                    onChange={(e) => setIssRetido(e.target.checked)}
                    className="rounded border-border"
                  />
                  ISS retido pelo tomador
                </label>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Tomador
                </label>
                <input
                  value={tomadorNome}
                  onChange={(e) => setTomadorNome(e.target.value)}
                  placeholder="Nome / razão social"
                  className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  CPF/CNPJ do tomador
                </label>
                <input
                  inputMode="numeric"
                  value={tomadorDoc}
                  onChange={(e) => setTomadorDoc(e.target.value)}
                  placeholder="opcional"
                  className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Discriminação
              </label>
              <textarea
                value={discriminacao}
                onChange={(e) => setDiscriminacao(e.target.value)}
                rows={3}
                placeholder="Descreva o serviço prestado"
                className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={emitir}
                disabled={!podeEmitir || ocupado}
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-60 inline-flex items-center gap-2"
              >
                <Send className="size-4" />
                {ocupado ? "Emitindo…" : "Emitir"}
              </button>
              <button
                onClick={() => {
                  setEmitindo(false);
                  limpar();
                }}
                className="px-5 py-2.5 rounded-xl border border-border text-muted-foreground font-semibold text-sm hover:bg-muted/50"
              >
                Cancelar
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              A nota é emitida na hora, com código de verificação. O ISS é calculado
              pela alíquota vigente do serviço.
            </p>
          </div>
        </div>
      )}

      {/* Minhas notas */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-bold text-foreground inline-flex items-center gap-2">
            <ClipboardList className="size-4 text-muted-foreground" />
            Minhas notas emitidas
          </h2>
        </div>
        {erroDownload && (
          <div className="mx-5 mt-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm px-3 py-2 flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5">
              <AlertCircle className="size-4" aria-hidden="true" />
              {erroDownload}
            </span>
            <button
              type="button"
              onClick={() => setErroDownload(null)}
              className="text-xs text-red-400 hover:text-red-600"
            >
              fechar
            </button>
          </div>
        )}
        {notas.isLoading ? (
          <p className="px-5 py-6 text-sm text-muted-foreground">Carregando…</p>
        ) : (notas.data?.items ?? []).length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground">
            Nenhuma nota emitida ainda.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted-foreground text-xs uppercase">
                <tr>
                  <th className="text-left px-5 py-2">Nº</th>
                  <th className="text-left py-2">Emissão</th>
                  <th className="text-left py-2">Tomador</th>
                  <th className="text-right py-2">Valor</th>
                  <th className="text-right py-2">ISS</th>
                  <th className="text-left py-2 pl-3">Situação</th>
                  <th className="px-5 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(notas.data?.items ?? []).map((n) => (
                  <tr key={n.id}>
                    <td className="px-5 py-2 font-medium text-foreground tabular-nums">
                      {n.numero}
                      <span className="text-muted-foreground text-xs">/{n.serie}</span>
                    </td>
                    <td className="py-2 text-muted-foreground">{dateBR(n.dataEmissao)}</td>
                    <td className="py-2 text-muted-foreground max-w-48 truncate">
                      {n.tomadorNome}
                    </td>
                    <td className="py-2 text-right text-foreground">
                      {money(n.valorServicos)}
                    </td>
                    <td className="py-2 text-right text-foreground">
                      {money(n.valorIss)}
                      {n.issRetido && (
                        <span className="ml-1 text-[10px] text-amber-600">retido</span>
                      )}
                    </td>
                    <td className="py-2 pl-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          SITUACAO_COR[n.situacao] ?? "bg-muted text-muted-foreground"
                        }`}
                      >
                        {n.situacao}
                      </span>
                    </td>
                    <td className="px-5 py-2 text-right">
                      <button
                        type="button"
                        onClick={async () => {
                          setErroDownload(null);
                          const r = await baixarDanfse(n.id);
                          if (!r.ok) setErroDownload(r.mensagem);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                        title="Baixar DANFSE"
                      >
                        <FileText className="size-4" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Cabecalho() {
  return (
    <>
      <nav className="text-xs text-muted-foreground">
        <Link href="/fiscal" className="hover:text-blue-600 inline-flex items-center gap-1.5">
          <ArrowLeft className="size-4" />
          Área fiscal
        </Link>
      </nav>
      <div>
        <h1 className="text-2xl font-bold text-foreground">NFS-e</h1>
        <p className="text-sm text-muted-foreground">
          Emita a Nota Fiscal de Serviço eletrônica da sua empresa e consulte as
          notas já emitidas.
        </p>
      </div>
    </>
  );
}
