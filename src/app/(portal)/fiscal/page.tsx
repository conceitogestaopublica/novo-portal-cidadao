"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

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
function dateBR(v: unknown): string {
  if (!v) return "—";
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString("pt-BR");
}

async function getJson(url: string) {
  const res = await fetch(url);
  if (res.status === 401) throw new Error("SESSAO");
  if (!res.ok) throw new Error("ERRO");
  return res.json();
}

async function baixarSegundaVia(id: string) {
  const res = await fetch(`/api/fiscal/guias/${id}/segunda-via`);
  if (res.ok && (res.headers.get("content-type") ?? "").includes("pdf")) {
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return;
  }
  const msg = await res.json().catch(() => null);
  alert(msg?.message ?? "Não foi possível gerar a 2ª via desta guia.");
}

type Guia = Record<string, unknown>;
type Msg = Record<string, unknown>;

export default function FiscalPage() {
  const resumo = useQuery({ queryKey: ["fiscal", "resumo"], queryFn: () => getJson("/api/fiscal/resumo") });
  const guias = useQuery({ queryKey: ["fiscal", "guias"], queryFn: () => getJson("/api/fiscal/guias") });
  const caixa = useQuery({ queryKey: ["fiscal", "caixa"], queryFn: () => getJson("/api/fiscal/caixa-postal") });

  const semSessao = [resumo, guias, caixa].some((q) => q.error instanceof Error && q.error.message === "SESSAO");
  if (semSessao) {
    return (
      <div className="max-w-md mx-auto text-center bg-white rounded-2xl border border-gray-200 p-8">
        <i className="fas fa-user-lock text-3xl text-gray-300 mb-3" />
        <p className="text-sm text-gray-600 mb-4">Sua sessão expirou. Entre novamente para ver seus débitos.</p>
        <Link href="/entrar" className="inline-block px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700">Entrar</Link>
      </div>
    );
  }

  const r = (resumo.data ?? {}) as Record<string, unknown>;
  const qtd = pick<number>(r, "quantidade", "qtd", "total", "totalGuias") ?? 0;
  const valor = pick(r, "valorTotal", "valor", "totalAberto", "valorEmAberto");

  const items = (pick<Guia[]>(guias.data as Record<string, unknown>, "items", "data") ?? []) as Guia[];
  const msgs = (pick<Msg[]>(caixa.data as Record<string, unknown>, "items", "data") ?? []) as Msg[];
  const naoLidas = msgs.filter((m) => !pick(m, "cienciaEm", "lidaEm", "abertaEm")).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Meus Débitos</h1>
        <p className="text-sm text-gray-500">Consulte suas guias, 2ª via e a caixa postal do DTE.</p>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card icon="fas fa-file-invoice-dollar" cor="from-blue-500 to-indigo-600" titulo="Débitos em aberto" valor={String(qtd)} sub="guias" loading={resumo.isLoading} />
        <Card icon="fas fa-coins" cor="from-amber-500 to-orange-600" titulo="Valor total" valor={money(valor)} sub="em aberto" loading={resumo.isLoading} />
        <Card icon="fas fa-envelope" cor="from-green-500 to-emerald-600" titulo="Caixa Postal" valor={String(naoLidas)} sub="não lidas" loading={caixa.isLoading} href="#caixa" />
      </div>

      {/* Guias */}
      <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-800"><i className="fas fa-receipt text-blue-600 mr-2" />Minhas guias</h2>
          <span className="text-xs text-gray-400">{items.length} guia(s)</span>
        </div>
        {guias.isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Carregando…</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm"><i className="fas fa-check-circle text-green-500 mr-2" />Você não tem débitos em aberto.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-5 py-2 font-semibold">Guia</th>
                  <th className="text-left px-5 py-2 font-semibold">Vencimento</th>
                  <th className="text-left px-5 py-2 font-semibold">Situação</th>
                  <th className="text-right px-5 py-2 font-semibold">Valor</th>
                  <th className="text-right px-5 py-2 font-semibold">2ª via</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((g, i) => (
                  <tr key={String(pick(g, "id") ?? i)} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-800">{String(pick(g, "numero", "nossoNumero", "codigo", "id") ?? "—")}</td>
                    <td className="px-5 py-3 text-gray-600">{dateBR(pick(g, "dataVencimento", "vencimento", "vencimentoEm"))}</td>
                    <td className="px-5 py-3"><span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold">{String(pick(g, "situacao", "status") ?? "—")}</span></td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-800">{money(pick(g, "valorTotal", "valor", "valorAtualizado"))}</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => baixarSegundaVia(String(pick(g, "id")))}
                        disabled={!pick(g, "id")}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-40 inline-flex items-center gap-1"
                      >
                        <i className="fas fa-file-pdf" /> 2ª via
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Caixa postal */}
      <section id="caixa" className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-800"><i className="fas fa-inbox text-blue-600 mr-2" />Caixa Postal (DTE)</h2>
        </div>
        {caixa.isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Carregando…</div>
        ) : msgs.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">Nenhuma mensagem.</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {msgs.map((m, i) => {
              const lida = !!pick(m, "cienciaEm", "lidaEm", "abertaEm");
              return (
                <li key={String(pick(m, "id") ?? i)} className="px-5 py-3 flex items-start gap-3">
                  <i className={`fas fa-circle text-[8px] mt-2 ${lida ? "text-gray-300" : "text-blue-500"}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${lida ? "text-gray-600" : "font-semibold text-gray-800"}`}>{String(pick(m, "assunto", "titulo", "tipo") ?? "Mensagem")}</p>
                    <p className="text-xs text-gray-400">{dateBR(pick(m, "criadaEm", "dataEnvio", "createdAt"))}</p>
                  </div>
                  {!lida && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">Nova</span>}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Card({ icon, cor, titulo, valor, sub, loading, href }: { icon: string; cor: string; titulo: string; valor: string; sub: string; loading?: boolean; href?: string }) {
  const inner = (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cor} flex items-center justify-center shadow-sm shrink-0`}>
        <i className={`${icon} text-white`} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">{titulo}</p>
        <p className="text-xl font-bold text-gray-800 leading-tight">{loading ? "…" : valor}</p>
        <p className="text-[11px] text-gray-400">{sub}</p>
      </div>
    </div>
  );
  return href ? <a href={href}>{inner}</a> : inner;
}
