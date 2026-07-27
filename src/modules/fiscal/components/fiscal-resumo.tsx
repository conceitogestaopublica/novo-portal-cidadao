"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowDownWideNarrow,
  ArrowLeft,
  ArrowUpDown,
  ArrowUpNarrowWide,
  Award,
  BookOpen,
  CheckCircle2,
  Circle,
  Coins,
  FileSignature,
  FileText,
  Gavel,
  Inbox,
  Info,
  type LucideIcon,
  Mail,
  Receipt,
  Search,
  TriangleAlert,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { AtuarComoSeletor } from "./atuar-como-seletor";
import { SessaoExpirada } from "@/components/common/sessao-expirada";
import { isSessaoExpirada } from "@/shared/lib/http-client";
import { useFiscalResumo } from "../hooks/use-fiscal-resumo";
import { useFiscalGuias } from "../hooks/use-fiscal-guias";
import { useFiscalCaixaPostal } from "../hooks/use-fiscal-caixa-postal";
import { useFiscalDividaAtiva } from "../hooks/use-fiscal-divida-ativa";
import { baixarSegundaViaGuia } from "../services/fiscal-guias.service";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function money(v: unknown): string {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? BRL.format(n) : "—";
}
function pick<T = unknown>(o: Record<string, unknown> | undefined, ...keys: string[]): T | undefined {
  if (!o) return undefined;
  for (const k of keys) if (o[k] != null) return o[k] as T;
  return undefined;
}
/** Se a guia é uma parcela de parcelamento, devolve o nº do parcelamento (ex.: "PARC 2026/0012"). */
function parcelamentoDe(g: Record<string, unknown>): string | null {
  const obs = String(pick(g, "observacao") ?? "");
  const m = obs.match(/Parcelamento\s+(PARC\s*\d{4}\/\d+)/i);
  return m ? m[1].replace(/\s+/g, " ") : null;
}

function dateBR(v: unknown): string {
  if (!v) return "—";
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString("pt-BR");
}

function hojeISO(): string {
  return new Date().toISOString().slice(0, 10);
}

type Guia = Record<string, unknown>;
type Msg = Record<string, unknown>;
type AlvoAtualizar = { id: string; numero: string };

export function FiscalResumo() {
  const resumo = useFiscalResumo();
  const [verPagas, setVerPagas] = useState(false);
  const guias = useFiscalGuias(verPagas);
  const caixa = useFiscalCaixaPostal();
  const divida = useFiscalDividaAtiva();
  const qc = useQueryClient();
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState<{ campo: "numero" | "vencimento" | "valor"; dir: "asc" | "desc" }>({ campo: "vencimento", dir: "asc" });
  const ordenarPor = (campo: "numero" | "vencimento" | "valor") =>
    setOrdem((o) => (o.campo === campo ? { campo, dir: o.dir === "asc" ? "desc" : "asc" } : { campo, dir: "asc" }));
  const [alvo, setAlvo] = useState<AlvoAtualizar | null>(null);
  const [novaData, setNovaData] = useState(hojeISO());
  const [emitindo, setEmitindo] = useState(false);
  const [erroModal, setErroModal] = useState<string | null>(null);

  // 2ª via: tenta emitir; se a guia está vencida, abre o modal p/ escolher a
  // nova data de vencimento (atualização = mesmo serviço).
  async function iniciarSegundaVia(g: Guia) {
    const id = String(pick(g, "id") ?? "");
    if (!id) return;
    const r = await baixarSegundaViaGuia(id, false);
    if (r.ok) return;
    if (r.status === 409 && r.msg?.podeAtualizar) {
      setErroModal(null);
      setNovaData(hojeISO());
      setAlvo({ id, numero: String(pick(g, "numero", "nossoNumero", "codigo", "id") ?? "") });
      return;
    }
    alert(r.msg?.message ?? "Não foi possível gerar a 2ª via desta guia.");
  }

  async function confirmarAtualizacao() {
    if (!alvo) return;
    setErroModal(null);
    setEmitindo(true);
    try {
      const r = await baixarSegundaViaGuia(alvo.id, true, novaData);
      if (r.ok) {
        setAlvo(null);
        qc.invalidateQueries({ queryKey: ["fiscal"] });
        return;
      }
      setErroModal(r.msg?.message ?? "Não foi possível atualizar e emitir a 2ª via.");
    } finally {
      setEmitindo(false);
    }
  }

  const semSessao = [resumo, guias, caixa].some((q) => isSessaoExpirada(q.error));
  if (semSessao) {
    return <SessaoExpirada mensagem="Sua sessão expirou. Entre novamente para ver seus débitos." />;
  }

  const r = (resumo.data ?? {}) as Record<string, unknown>;
  const qtd = pick<number>(r, "quantidade", "qtd", "total", "totalGuias") ?? 0;
  const valor = pick(r, "valorTotal", "valor", "totalAberto", "valorEmAberto");

  const da = (divida.data ?? {}) as Record<string, unknown>;
  const daQtd = pick<number>(da, "quantidade", "qtd") ?? 0;
  const daValorNum = Number(pick(da, "valorInscrito", "valorTotal", "valor") ?? 0);
  const valorNum = Number(valor ?? 0);
  const totalGeral = (Number.isFinite(valorNum) ? valorNum : 0) + (Number.isFinite(daValorNum) ? daValorNum : 0);

  const items = (pick<Guia[]>(guias.data as Record<string, unknown>, "items", "data") ?? []) as Guia[];
  const termo = busca.trim().toLowerCase();
  const itemsFiltrados = termo
    ? items.filter((g) =>
        [pick(g, "numero", "nossoNumero", "codigo"), pick(g, "origem"), pick(g, "situacao")]
          .some((v) => String(v ?? "").toLowerCase().includes(termo)),
      )
    : items;
  const dir = ordem.dir === "asc" ? 1 : -1;
  const itemsOrdenados = [...itemsFiltrados].sort((a, b) => {
    if (ordem.campo === "numero")
      return String(pick(a, "numero", "nossoNumero", "codigo") ?? "").localeCompare(String(pick(b, "numero", "nossoNumero", "codigo") ?? ""), "pt-BR", { numeric: true }) * dir;
    if (ordem.campo === "valor")
      return (Number(pick(a, "valorTotal", "valor", "valorAtualizado") ?? 0) - Number(pick(b, "valorTotal", "valor", "valorAtualizado") ?? 0)) * dir;
    const da = new Date(String(pick(a, "dataVencimento", "vencimento", "vencimentoEm"))).getTime();
    const db = new Date(String(pick(b, "dataVencimento", "vencimento", "vencimentoEm"))).getTime();
    return ((isNaN(da) ? 0 : da) - (isNaN(db) ? 0 : db)) * dir;
  });
  const msgs = (pick<Msg[]>(caixa.data as Record<string, unknown>, "items", "data") ?? []) as Msg[];
  const naoLidas = msgs.filter((m) => !pick(m, "cienciaEm", "lidaEm", "abertaEm")).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Meus Débitos</h1>
        <p className="text-sm text-muted-foreground">Consulte suas guias, 2ª via e a caixa postal do DTE.</p>
      </div>

      <AtuarComoSeletor />

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card icon={Receipt} cor="from-blue-500 to-indigo-600" titulo="Guias em aberto" valor={money(valor)} sub={`${qtd} guia(s)`} loading={resumo.isLoading} />
        <Card icon={Gavel} cor="from-red-500 to-rose-600" titulo="Dívida ativa" valor={money(daValorNum)} sub={`${daQtd} inscrição(ões)`} loading={divida.isLoading} />
        <Card icon={Coins} cor="from-amber-500 to-orange-600" titulo="Total geral a pagar" valor={money(totalGeral)} sub="guias + dívida ativa" loading={resumo.isLoading || divida.isLoading} />
        <Card icon={Mail} cor="from-green-500 to-emerald-600" titulo="Caixa Postal" valor={String(naoLidas)} sub="não lidas" loading={caixa.isLoading} href="#caixa" />
      </div>
      {divida.data != null && daQtd > 0 && (
        <p className="text-xs text-muted-foreground -mt-2 flex items-center gap-1.5"><Info className="size-4 text-red-500" aria-hidden="true" />Você tem <strong>dívida ativa</strong> inscrita. Para negociar ou emitir guia da dívida, procure o Atendimento — a negociação online entra em breve.</p>
      )}

      {/* Atalhos: até aqui estas telas só eram alcançáveis pela Carta de
          Serviços — quem já está na área fiscal não deveria dar essa volta. */}
      <div className="flex flex-wrap gap-2">
        <Atalho href="/fiscal/nfse" icon={FileText} rotulo="Emitir NFS-e" />
        <Atalho href="/fiscal/dms" icon={BookOpen} rotulo="Declaração mensal (DMS)" />
        <Atalho href="/fiscal/certidao" icon={Award} rotulo="Emitir certidão" />
        <Atalho href="/fiscal/parcelamento" icon={FileSignature} rotulo="Parcelar débitos" />
      </div>

      {/* Guias */}
      <section className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-sm font-bold text-foreground shrink-0 flex items-center gap-2">
            {verPagas ? <CheckCircle2 className="size-4 text-green-600" /> : <Receipt className="size-4 text-blue-600" />}
            {verPagas ? "Guias pagas (comprovantes)" : "Minhas guias"}
          </h2>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button type="button" onClick={() => { setVerPagas((v) => !v); setBusca(""); }} className="text-xs font-semibold text-blue-600 hover:text-blue-700 whitespace-nowrap inline-flex items-center gap-1">
              {verPagas ? <ArrowLeft className="size-4" /> : <Receipt className="size-4" />}{verPagas ? "Ver débitos em aberto" : "Ver guias pagas"}
            </button>
            <div className="relative flex-1 sm:w-56">
              <Search className="size-3 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por número, ano, origem…"
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">{itemsFiltrados.length}{termo ? `/${items.length}` : ""} guia(s)</span>
          </div>
        </div>
        {guias.isLoading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Carregando…</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
            {verPagas ? <Inbox className="size-4" aria-hidden="true" /> : <CheckCircle2 className="size-4 text-green-500" aria-hidden="true" />}
            {verPagas ? "Nenhuma guia paga encontrada." : "Você não tem débitos em aberto."}
          </div>
        ) : itemsFiltrados.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm flex items-center justify-center gap-2"><Search className="size-4 text-muted-foreground" aria-hidden="true" />Nenhuma guia encontrada para “{busca}”.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wide">
                <tr>
                  <ThOrd label="Guia" campo="numero" ordem={ordem} onClick={ordenarPor} />
                  <ThOrd label="Vencimento" campo="vencimento" ordem={ordem} onClick={ordenarPor} />
                  <th className="text-left px-5 py-2 font-semibold">Situação</th>
                  <ThOrd label="Valor" campo="valor" ordem={ordem} onClick={ordenarPor} align="right" />
                  <th className="text-right px-5 py-2 font-semibold">2ª via</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {itemsOrdenados.map((g, i) => {
                  const parc = parcelamentoDe(g);
                  return (
                  <tr key={String(pick(g, "id") ?? i)} className="hover:bg-muted/50">
                    <td className="px-5 py-3">
                      <span className="font-medium text-foreground">{String(pick(g, "numero", "nossoNumero", "codigo", "id") ?? "—")}</span>
                      <span className="block mt-0.5">
                        {parc ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold inline-flex items-center gap-1"><FileSignature className="size-4" />Parcela · {parc}</span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{String(pick(g, "origem") ?? "")}</span>
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{dateBR(pick(g, "dataVencimento", "vencimento", "vencimentoEm"))}</td>
                    <td className="px-5 py-3"><span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold">{String(pick(g, "situacao", "status") ?? "—")}</span></td>
                    <td className="px-5 py-3 text-right font-semibold text-foreground">{money(pick(g, "valorTotal", "valor", "valorAtualizado"))}</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => iniciarSegundaVia(g)}
                        disabled={!pick(g, "id")}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-40 inline-flex items-center gap-1"
                      >
                        <FileText className="size-4" /> {verPagas ? "Comprovante" : "2ª via"}
                      </button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Caixa postal */}
      <section id="caixa" className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2"><Inbox className="size-4 text-blue-600" />Caixa Postal (DTE)</h2>
        </div>
        {caixa.isLoading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Carregando…</div>
        ) : msgs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Nenhuma mensagem.</div>
        ) : (
          <ul className="divide-y divide-border">
            {msgs.map((m, i) => {
              const lida = !!pick(m, "cienciaEm", "lidaEm", "abertaEm");
              return (
                <li key={String(pick(m, "id") ?? i)} className="px-5 py-3 flex items-start gap-3">
                  <Circle className={`size-2 mt-2 ${lida ? "text-muted-foreground" : "text-blue-500"}`} aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${lida ? "text-muted-foreground" : "font-semibold text-foreground"}`}>{String(pick(m, "assunto", "titulo", "tipo") ?? "Mensagem")}</p>
                    <p className="text-xs text-muted-foreground">{dateBR(pick(m, "criadaEm", "dataEnvio", "createdAt"))}</p>
                  </div>
                  {!lida && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">Nova</span>}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Modal: atualizar guia vencida com nova data de vencimento */}
      {alvo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !emitindo && setAlvo(null)}>
          <div className="bg-card rounded-2xl shadow-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0"><TriangleAlert className="size-4" aria-hidden="true" /></div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Guia vencida — atualizar 2ª via</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Guia <strong>{alvo.numero}</strong>. Informe o novo vencimento; os juros e a multa são recalculados até essa data.</p>
              </div>
            </div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Novo vencimento</label>
            <input
              type="date"
              value={novaData}
              min={hojeISO()}
              onChange={(e) => setNovaData(e.target.value)}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {erroModal && <p className="text-xs text-red-600 mt-2 flex items-center gap-1"><AlertCircle className="size-4" aria-hidden="true" />{erroModal}</p>}
            <div className="flex gap-2 mt-5">
              <button onClick={() => setAlvo(null)} disabled={emitindo} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-muted-foreground font-semibold text-sm hover:bg-muted/50 disabled:opacity-50">Cancelar</button>
              <button onClick={confirmarAtualizacao} disabled={emitindo || !novaData} className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-60">
                {emitindo ? "Emitindo…" : "Atualizar e emitir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ThOrd({ label, campo, ordem, onClick, align }: { label: string; campo: "numero" | "vencimento" | "valor"; ordem: { campo: string; dir: "asc" | "desc" }; onClick: (c: "numero" | "vencimento" | "valor") => void; align?: "right" }) {
  const ativo = ordem.campo === campo;
  return (
    <th className={`px-5 py-2 font-semibold ${align === "right" ? "text-right" : "text-left"}`}>
      <button type="button" onClick={() => onClick(campo)} className={`inline-flex items-center gap-1 uppercase tracking-wide hover:text-blue-600 ${ativo ? "text-blue-600" : ""}`}>
        {label}
        {ativo ? (
          ordem.dir === "asc" ? (
            <ArrowUpNarrowWide className="size-2.5 text-blue-500" aria-hidden="true" />
          ) : (
            <ArrowDownWideNarrow className="size-2.5 text-blue-500" aria-hidden="true" />
          )
        ) : (
          <ArrowUpDown className="size-2.5 text-muted-foreground" aria-hidden="true" />
        )}
      </button>
    </th>
  );
}

function Card({ icon: Icon, cor, titulo, valor, sub, loading, href }: { icon: LucideIcon; cor: string; titulo: string; valor: string; sub: string; loading?: boolean; href?: string }) {
  const inner = (
    <div className="bg-card rounded-2xl border border-border p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cor} flex items-center justify-center shadow-sm shrink-0`}>
        <Icon className="text-white size-4" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{titulo}</p>
        <p className="text-xl font-bold text-foreground leading-tight">{loading ? "…" : valor}</p>
        <p className="text-[11px] text-muted-foreground">{sub}</p>
      </div>
    </div>
  );
  return href ? <a href={href}>{inner}</a> : inner;
}

function Atalho({ href, icon: Icon, rotulo }: { href: string; icon: LucideIcon; rotulo: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border text-sm font-semibold text-foreground hover:border-blue-300 hover:text-blue-700"
    >
      <Icon className="text-blue-600 size-4" />
      {rotulo}
    </Link>
  );
}
