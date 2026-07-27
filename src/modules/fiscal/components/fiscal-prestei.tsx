"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, FilePlus2, Plus, Receipt } from "lucide-react";
import { SessaoExpirada } from "@/components/common/sessao-expirada";
import { isSessaoExpirada } from "@/shared/lib/http-client";
import { money } from "@/shared/lib/format";
import { useDeclararPrestei, useGerarGuiaPrestei, usePresteiPendentes } from "../hooks/use-prestei";

/** Vencimento sugerido: dia 10 do mês que vem. */
function vencimentoPadrao(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 10).toISOString().slice(0, 10);
}

export function FiscalPrestei() {
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [selecao, setSelecao] = useState<string[]>([]);

  const [f, setF] = useState({
    tomadorDocumento: "",
    tomadorNome: "",
    numeroNota: "",
    competencia: "",
    dataEmissao: "",
    valorServicos: "",
    valorIss: "",
    discriminacao: "",
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF({ ...f, [k]: e.target.value });

  const pendentes = usePresteiPendentes();
  const declararMutation = useDeclararPrestei();
  const gerarGuiaMutation = useGerarGuiaPrestei();

  if (isSessaoExpirada(pendentes.error)) {
    return <SessaoExpirada />;
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

  async function declarar(e: React.FormEvent) {
    e.preventDefault();
    const ok = await acao(() =>
      declararMutation.mutateAsync({
        tomadorDocumento: f.tomadorDocumento.replace(/\D/g, ""),
        tomadorNome: f.tomadorNome || null,
        numeroNota: f.numeroNota,
        competencia: f.competencia,
        dataEmissao: f.dataEmissao,
        discriminacao: f.discriminacao || null,
        valorServicos: Number(f.valorServicos.replace(",", ".")),
        valorIss: Number(f.valorIss.replace(",", ".")),
      }),
    );
    if (ok) {
      setF({ ...f, numeroNota: "", valorServicos: "", valorIss: "", discriminacao: "" });
    }
  }

  async function gerarGuia(ids?: string[]) {
    const quantas = ids?.length ?? pendentes.data?.total ?? 0;
    if (
      !window.confirm(
        `Gerar a guia de ${quantas} nota(s)?\n\nA guia vai para "Meus Débitos" e não pode ser desfeita aqui.`,
      )
    )
      return;
    const ok = await acao(() =>
      gerarGuiaMutation.mutateAsync({
        notaIds: ids,
        dataVencimento: vencimentoPadrao(),
      }),
    );
    if (ok) setSelecao([]);
  }

  const p = pendentes.data;
  const podeDeclarar =
    f.tomadorDocumento.replace(/\D/g, "").length >= 11 &&
    !!f.numeroNota &&
    /^\d{4}-\d{2}$/.test(f.competencia) &&
    /^\d{4}-\d{2}-\d{2}$/.test(f.dataEmissao) &&
    Number(f.valorServicos.replace(",", ".")) > 0;

  const inputCls =
    "w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <nav className="text-xs text-muted-foreground">
        <Link href="/fiscal" className="hover:text-blue-600 inline-flex items-center gap-1.5">
          <ArrowLeft className="size-4" />
          Área fiscal
        </Link>
      </nav>
      <div>
        <h1 className="text-2xl font-bold text-foreground">Serviços que prestei no município</h1>
        <p className="text-sm text-muted-foreground">
          Você é de outro município e prestou serviço aqui. Declare a nota e gere
          a guia do ISS — junto ou uma a uma.
        </p>
      </div>

      {erro && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm px-3 py-2 flex items-center gap-1.5">
          <AlertCircle className="size-4" />
          {erro}
        </div>
      )}

      <div className="bg-card rounded-2xl border border-border p-5">
        <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <FilePlus2 className="size-4 text-blue-600" />
          Declarar nota
        </h2>
        <form onSubmit={declarar} className="grid sm:grid-cols-2 gap-3">
          <input value={f.tomadorDocumento} onChange={set("tomadorDocumento")} placeholder="CPF/CNPJ de quem contratou" className={inputCls} />
          <input value={f.tomadorNome} onChange={set("tomadorNome")} placeholder="Nome de quem contratou (opcional)" className={inputCls} />
          <input value={f.numeroNota} onChange={set("numeroNota")} placeholder="Número da sua nota" className={inputCls} />
          <input value={f.competencia} onChange={set("competencia")} placeholder="Competência (AAAA-MM)" className={inputCls} />
          <input type="date" value={f.dataEmissao} onChange={set("dataEmissao")} className={inputCls} />
          <input value={f.discriminacao} onChange={set("discriminacao")} placeholder="Descrição do serviço (opcional)" className={inputCls} />
          <input value={f.valorServicos} onChange={set("valorServicos")} inputMode="decimal" placeholder="Valor do serviço" className={inputCls} />
          <input value={f.valorIss} onChange={set("valorIss")} inputMode="decimal" placeholder="ISS da nota" className={inputCls} />
          <div className="sm:col-span-2">
            <button disabled={!podeDeclarar || ocupado} className="px-4 py-2 rounded-xl bg-gray-800 text-white font-bold text-sm hover:bg-gray-900 disabled:opacity-60 inline-flex items-center gap-1.5">
              <Plus className="size-4" />
              Declarar
            </button>
            <p className="text-[11px] text-muted-foreground mt-2">
              Declare aqui só o serviço em que o contratante <strong>não reteve</strong> o
              ISS. Se ele reteve, quem declara é ele — o imposto já saiu do seu
              pagamento.
            </p>
          </div>
        </form>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Receipt className="size-4 text-muted-foreground" />
            A pagar
            {p && p.total > 0 ? (
              <span className="font-normal text-muted-foreground">
                {p.total} nota(s) · {money(p.valorIss)}
              </span>
            ) : null}
          </h2>
          {p && p.total > 0 && (
            <div className="flex gap-2">
              {selecao.length > 0 && (
                <button onClick={() => void gerarGuia(selecao)} disabled={ocupado} className="px-3 py-1.5 rounded-xl border border-border text-xs font-semibold hover:bg-muted/50 disabled:opacity-60">
                  Gerar das {selecao.length} escolhida(s)
                </button>
              )}
              <button onClick={() => void gerarGuia()} disabled={ocupado} className="px-4 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-60">
                {ocupado ? "Gerando…" : "Gerar guia de tudo"}
              </button>
            </div>
          )}
        </div>

        {pendentes.isLoading ? (
          <p className="px-5 py-6 text-sm text-muted-foreground">Carregando…</p>
        ) : !p || p.total === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground">
            Nada a pagar. O que você declarar aparece aqui até virar guia.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-muted-foreground text-xs uppercase">
              <tr>
                <th className="py-2 pl-5 w-8" />
                <th className="text-left py-2">Nota</th>
                <th className="text-left py-2">Competência</th>
                <th className="text-right py-2 pr-5">ISS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {p.notas.map((n) => (
                <tr key={n.id}>
                  <td className="py-2 pl-5">
                    <input
                      type="checkbox"
                      checked={selecao.includes(n.id)}
                      onChange={(e) =>
                        setSelecao((s) =>
                          e.target.checked ? [...s, n.id] : s.filter((x) => x !== n.id),
                        )
                      }
                      className="rounded border-border"
                    />
                  </td>
                  <td className="py-2 text-foreground">{n.numeroNota ?? "—"}</td>
                  <td className="py-2 text-muted-foreground">{n.competencia ?? "—"}</td>
                  <td className="py-2 pr-5 text-right font-semibold text-foreground">
                    {money(n.valorIss)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
