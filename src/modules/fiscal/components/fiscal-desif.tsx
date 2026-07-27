"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Landmark,
  Send,
} from "lucide-react";
import Link from "next/link";
import { SessaoExpirada } from "@/components/common/sessao-expirada";
import { isSessaoExpirada } from "@/shared/lib/http-client";
import { money } from "@/shared/lib/format";
import { Button } from "@/components/ui/button";
import {
  useDesifDeclaracoes,
  useDesifDetalhe,
  useDesifInstituicoes,
  useEncerrarDesif,
  useImportarDesif,
} from "../hooks/use-desif";
import { baixarComprovante, Declaracao } from "../services/desif.service";
import {
  encerrarDesifFormSchema,
  type EncerrarDesifFormInput,
  type EncerrarDesifFormOutput,
  enviarDesifFormSchema,
  type EnviarDesifFormInput,
  type EnviarDesifFormOutput,
} from "../schemas/desif.schema";

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** `aaaamm` → `mai/2026`. É assim que o leiaute identifica a competência. */
function competenciaLabel(aaaamm: string): string {
  if (!/^\d{6}$/.test(aaaamm)) return aaaamm;
  const ano = aaaamm.slice(0, 4);
  const mes = Number(aaaamm.slice(4, 6));
  return `${MESES[mes - 1] ?? mes}/${ano}`;
}

const MODULO_LABEL: Record<string, string> = {
  INFORMACOES_COMUNS: "Módulo 3 — Informações comuns (PGCC, tarifas)",
  APURACAO_MENSAL: "Módulo 2 — Apuração mensal do ISSQN",
  DEMONSTRATIVO_CONTABIL: "Módulo 1 — Demonstrativo contábil",
  PARTIDAS_LANCAMENTOS: "Módulo 4 — Partidas dos lançamentos",
};

const SITUACAO_COR: Record<string, string> = {
  IMPORTADA: "bg-muted text-muted-foreground",
  VALIDADA: "bg-blue-100 text-blue-700",
  ENCERRADA: "bg-green-100 text-green-700",
  REJEITADA: "bg-destructive/10 text-destructive",
};

export function FiscalDesif() {
  const [resultado, setResultado] = useState<{
    declaracaoId: string;
    protocolo: string;
    situacao: string;
    modulo: string;
    competencia: string;
    totalIssqnARecolher: number;
    qtdErros: number;
    qtdAlertas: number;
  } | null>(null);
  const [encerrando, setEncerrando] = useState<Declaracao | null>(null);
  const [erroComprovante, setErroComprovante] = useState<string | null>(null);
  const [resultadoEncerramento, setResultadoEncerramento] = useState<{
    competencia: string;
    totalGuias: number;
    valorTotal: number;
    guias: { guiaId: string; numero: string; valor: number }[];
  } | null>(null);

  const instituicoes = useDesifInstituicoes();
  const primeira = instituicoes.data?.[0];

  const declaracoes = useDesifDeclaracoes(primeira?.id ?? "");
  const detalhe = useDesifDetalhe(resultado?.declaracaoId, (resultado?.qtdErros ?? 0) > 0);

  const importarMutation = useImportarDesif(primeira?.id ?? "");
  const encerrarMutation = useEncerrarDesif(primeira?.id ?? "");

  const {
    register: registerEnviar,
    handleSubmit: handleSubmitEnviar,
    setValue: setValueEnviar,
    reset: resetEnviar,
    control: controlEnviar,
    formState: { errors: erroEnviar },
  } = useForm<EnviarDesifFormInput, unknown, EnviarDesifFormOutput>({
    resolver: zodResolver(enviarDesifFormSchema),
    defaultValues: { conteudo: "", nomeArquivo: "desif.txt" },
  });
  const conteudo = useWatch({ control: controlEnviar, name: "conteudo" });

  const {
    register: registerEncerrar,
    handleSubmit: handleSubmitEncerrar,
    reset: resetEncerrar,
    formState: { errors: erroEncerrar },
  } = useForm<EncerrarDesifFormInput, unknown, EncerrarDesifFormOutput>({
    resolver: zodResolver(encerrarDesifFormSchema),
    defaultValues: { dataVencimento: "" },
  });

  const semSessao = [instituicoes, declaracoes].some((q) => isSessaoExpirada(q.error));
  if (semSessao) {
    return <SessaoExpirada />;
  }

  async function lerArquivo(file: File) {
    setValueEnviar("nomeArquivo", file.name);
    setValueEnviar("conteudo", await file.text());
  }

  async function enviar(data: EnviarDesifFormOutput) {
    const r = await importarMutation.mutateAsync(data);
    setResultado(r);
    resetEnviar({ conteudo: "", nomeArquivo: "desif.txt" });
  }

  async function encerrar(data: EncerrarDesifFormOutput) {
    if (!encerrando) return;
    const r = await encerrarMutation.mutateAsync({ declaracaoId: encerrando.id, dataVencimento: data.dataVencimento });
    setResultadoEncerramento(r);
    setEncerrando(null);
    resetEncerrar({ dataVencimento: "" });
  }

  if (instituicoes.isLoading) {
    return (
      <div className="max-w-2xl mx-auto bg-card rounded-2xl border border-border p-8">
        <p className="text-sm text-muted-foreground">Carregando…</p>
      </div>
    );
  }

  // Sem instituição vinculada não há o que declarar. Dizer isso é melhor que
  // mostrar um formulário que vai falhar no envio.
  if (!primeira) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Cabecalho />
        <div className="bg-card rounded-2xl border border-border p-8 text-center">
          <Landmark className="size-8 text-muted-foreground mb-3" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            Seu cadastro não tem instituição financeira vinculada. Procure a
            Prefeitura para vincular o CNPJ antes de declarar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Cabecalho />

      <div className="bg-card rounded-2xl border border-border p-6">
        <p className="text-sm text-muted-foreground">
          {primeira.razaoSocial} · CNPJ base {primeira.cnpjBase}
        </p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="font-bold text-foreground mb-1">Enviar declaração</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Arquivo no leiaute ABRASF 3.1, gerado pelo seu sistema contábil.
          Guarde o protocolo: ele é o comprovante da entrega.
        </p>

        <form onSubmit={handleSubmitEnviar(enviar)} className="space-y-3" noValidate>
          {erroEnviar.conteudo && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm px-3 py-2 inline-flex items-center gap-1.5">
              <AlertCircle className="size-4" aria-hidden="true" />
              {erroEnviar.conteudo.message}
            </div>
          )}

          <input
            type="file"
            accept=".txt,text/plain"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void lerArquivo(f);
            }}
            className="block w-full text-sm file:mr-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-muted file:text-sm file:font-semibold"
          />

          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            ou cole o conteúdo
          </label>
          <textarea
            {...registerEnviar("conteudo")}
            rows={5}
            placeholder="1|0000|12345678|BANCO…"
            className="w-full px-3 py-2 rounded-xl border border-border text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <Button
            type="submit"
            disabled={!conteudo?.trim() || importarMutation.isPending}
            className="px-5 py-2.5 h-auto rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-60 inline-flex items-center gap-2"
          >
            <Send className="size-4" />
            {importarMutation.isPending ? "Enviando…" : "Enviar declaração"}
          </Button>
        </form>
      </div>

      {resultado && (
        <div
          className={`bg-card rounded-2xl border p-6 ${resultado.qtdErros > 0 ? "border-destructive/30" : "border-green-300"}`}
        >
          <h2 className="font-bold text-foreground mb-3">
            {resultado.qtdErros > 0 ? "Declaração recebida com erros" : "Declaração recebida"}
          </h2>

          <dl className="grid grid-cols-2 gap-3 text-sm mb-3">
            <div>
              <dt className="text-muted-foreground">Protocolo</dt>
              <dd className="font-mono font-semibold">{resultado.protocolo}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Competência</dt>
              <dd className="font-semibold">{competenciaLabel(resultado.competencia)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Módulo</dt>
              <dd>{MODULO_LABEL[resultado.modulo] ?? resultado.modulo}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">ISSQN a recolher</dt>
              <dd className="font-semibold">{money(resultado.totalIssqnARecolher)}</dd>
            </div>
          </dl>

          {resultado.qtdErros > 0 ? (
            <>
              <p className="text-sm text-destructive mb-2">
                {resultado.qtdErros} erro(s) impedem a entrega. Corrija no seu
                sistema e reenvie como <strong>declaração retificadora</strong>,
                informando este protocolo.
              </p>
              {detalhe.data && (
                <ul className="text-xs space-y-1 max-h-64 overflow-y-auto">
                  {detalhe.data.apontamentos.map((a, i) => (
                    <li
                      key={i}
                      className={`rounded px-2 py-1 ${a.gravidade === "ERRO" ? "bg-destructive/10 text-destructive" : "bg-amber-50 text-amber-800"}`}
                    >
                      <span className="font-mono">
                        {a.registro}
                        {a.linha ? `:${a.linha}` : ""}
                        {a.codigo ? ` ${a.codigo}` : ""}
                      </span>{" "}
                      {a.mensagem}
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p className="text-sm text-green-700">Sem erros. A entrega está registrada no histórico.</p>
          )}
        </div>
      )}

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-bold text-foreground">Minhas entregas</h2>
        </div>
        {erroComprovante && (
          <div className="mx-5 mt-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm px-3 py-2 flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5">
              <AlertCircle className="size-4" aria-hidden="true" />
              {erroComprovante}
            </span>
            <button type="button" onClick={() => setErroComprovante(null)} className="text-xs text-red-400 hover:text-red-600">
              fechar
            </button>
          </div>
        )}
        {declaracoes.isLoading ? (
          <p className="px-5 py-6 text-sm text-muted-foreground">Carregando…</p>
        ) : (declaracoes.data ?? []).length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground">Nenhuma declaração entregue ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted-foreground text-xs uppercase">
                <tr>
                  <th className="text-left px-5 py-2">Competência</th>
                  <th className="text-left py-2">Módulo</th>
                  <th className="text-left py-2">Protocolo</th>
                  <th className="text-right py-2">ISSQN</th>
                  <th className="text-left py-2">Situação</th>
                  <th className="px-5 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(declaracoes.data ?? []).map((d) => (
                  <tr key={d.id}>
                    <td className="px-5 py-2 text-foreground">{competenciaLabel(d.competenciaInicio)}</td>
                    <td className="py-2 text-muted-foreground text-xs">
                      {MODULO_LABEL[d.modulo]?.split("—")[0]?.trim() ?? d.modulo}
                    </td>
                    <td className="py-2 font-mono text-xs text-muted-foreground">{d.protocolo}</td>
                    <td className="py-2 text-right text-foreground">{money(d.totalIssqnARecolher)}</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${SITUACAO_COR[d.situacao] ?? "bg-muted text-muted-foreground"}`}>
                        {d.situacao}
                      </span>
                    </td>
                    <td className="px-5 py-2">
                      <div className="flex justify-end gap-3 items-center">
                        {/* O comprovante vale para qualquer declaração recebida (a
                            spec manda o banco guardá-lo), inclusive a rejeitada —
                            que serve de prova da tentativa. */}
                        <button
                          type="button"
                          onClick={async () => {
                            setErroComprovante(null);
                            const r = await baixarComprovante(d.id);
                            if (!r.ok) setErroComprovante(r.mensagem);
                          }}
                          className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                          title="Baixar comprovante"
                        >
                          <FileText className="size-4" aria-hidden="true" />
                        </button>
                        {/* Só a apuração mensal validada encerra: o módulo 3 é
                            cadastro (não gera imposto) e o que já encerrou não
                            pode encerrar de novo, sob pena de guia dobrada. */}
                        {d.situacao === "VALIDADA" && d.modulo === "APURACAO_MENSAL" ? (
                          <Button
                            type="button"
                            onClick={() => setEncerrando(d)}
                            className="px-3 py-1 h-auto rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
                          >
                            Encerrar competência
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {encerrando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !encerrarMutation.isPending && setEncerrando(null)}>
          <div className="bg-card rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-foreground mb-1">
              Encerrar {competenciaLabel(encerrando.competenciaInicio)}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              O encerramento apura o ISSQN da competência e emite a guia. Depois
              disso, a competência só muda por declaração retificadora.
            </p>

            <form onSubmit={handleSubmitEncerrar(encerrar)} noValidate>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                Vencimento da guia
              </label>
              <input
                type="date"
                {...registerEncerrar("dataVencimento")}
                className="w-full px-3 py-2.5 rounded-xl border border-border text-sm mb-1"
              />
              {erroEncerrar.dataVencimento && (
                <p className="text-xs text-destructive mb-3" role="alert">{erroEncerrar.dataVencimento.message}</p>
              )}

              <div className="flex gap-2 mt-3">
                <Button
                  type="submit"
                  disabled={encerrarMutation.isPending}
                  className="px-5 py-2.5 h-auto rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-60"
                >
                  {encerrarMutation.isPending ? "Encerrando…" : "Encerrar e gerar guia"}
                </Button>
                <button
                  type="button"
                  onClick={() => setEncerrando(null)}
                  className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {resultadoEncerramento && (
        <div className="bg-card rounded-2xl border border-green-300 p-6">
          <h2 className="font-bold text-foreground mb-2 inline-flex items-center gap-2">
            <CheckCircle2 className="size-4 text-green-600" />
            Competência {competenciaLabel(resultadoEncerramento.competencia)} encerrada
          </h2>
          {/* Nada a cobrar não é erro. Anunciar "guia emitida" com zero guias
              prometeria uma cobrança que não existe. */}
          {resultadoEncerramento.totalGuias === 0 ? (
            <p className="text-sm text-foreground">
              Encerrada <strong>sem emissão de guia</strong>: não havia ISSQN a
              recolher na competência (tudo retido, isento ou compensado).
            </p>
          ) : (
            <>
              <p className="text-sm text-foreground mb-2">
                {resultadoEncerramento.totalGuias} guia(s) emitida(s) — total{" "}
                {money(resultadoEncerramento.valorTotal)}. Consulte em{" "}
                <Link href="/fiscal" className="text-blue-600 underline">
                  Meus débitos
                </Link>{" "}
                para pagar.
              </p>
              <ul className="text-sm space-y-1">
                {resultadoEncerramento.guias.map((g) => (
                  <li key={g.guiaId} className="font-mono">
                    {g.numero} — {money(g.valor)}
                  </li>
                ))}
              </ul>
            </>
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
        <Link href="/fiscal" className="hover:text-blue-600 inline-flex items-center gap-1.5">
          <ArrowLeft className="size-4" />
          Área fiscal
        </Link>
      </nav>
      <div>
        <h1 className="text-2xl font-bold text-foreground inline-flex items-center gap-2">
          <Landmark className="size-6 text-blue-600" />
          DES-IF
        </h1>
        <p className="text-sm text-muted-foreground">
          Declaração de instituições financeiras (leiaute ABRASF 3.1).
        </p>
      </div>
    </>
  );
}
