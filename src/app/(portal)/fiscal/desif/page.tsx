"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const money = (v: unknown) =>
  Number.isFinite(Number(v)) ? BRL.format(Number(v)) : "—";

const MESES = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

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

const SITUACAO: Record<string, { texto: string; cls: string }> = {
  IMPORTADA: { texto: "Importada", cls: "bg-gray-100 text-gray-700" },
  VALIDADA: { texto: "Validada", cls: "bg-blue-100 text-blue-700" },
  ENCERRADA: { texto: "Encerrada", cls: "bg-green-100 text-green-700" },
  REJEITADA: { texto: "Rejeitada", cls: "bg-red-100 text-red-700" },
};

async function getJson(url: string) {
  const res = await fetch(url);
  if (res.status === 401) throw new Error("SESSAO");
  if (!res.ok) throw new Error("ERRO");
  return res.json();
}

/**
 * O 422 do backend traz o motivo útil dentro de `errors` e deixa em `message`
 * só "Entity Validation Error" — que não diz nada a quem está declarando.
 */
function motivo(data: unknown, padrao: string): string {
  const d = data as { message?: string; errors?: unknown };
  const folhas: string[] = [];
  const colher = (v: unknown) => {
    if (typeof v === "string") folhas.push(v);
    else if (v && typeof v === "object") Object.values(v).forEach(colher);
  };
  colher(d?.errors);
  return folhas.length > 0 ? folhas.join(" ") : (d?.message ?? padrao);
}

async function send(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(motivo(data, "Não foi possível concluir."));
  return data;
}

type Instituicao = {
  id: string;
  cnpjBase: string;
  razaoSocial: string;
};

type Declaracao = {
  id: string;
  protocolo: string;
  modulo: string;
  situacao: string;
  competenciaInicio: string;
  totalIssqnARecolher: number;
  qtdErros: number;
  qtdAlertas: number;
  importadaEm: string;
};

type Apontamento = {
  gravidade: string;
  codigo: string | null;
  registro: string;
  linha: number | null;
  mensagem: string;
};

type ResultadoImport = {
  declaracaoId: string;
  protocolo: string;
  situacao: string;
  modulo: string;
  competencia: string;
  totalIssqnARecolher: number;
  qtdErros: number;
  qtdAlertas: number;
};

type ResultadoEncerramento = {
  competencia: string;
  totalGuias: number;
  valorTotal: number;
  guias: { guiaId: string; numero: string; valor: number }[];
};

const card = "bg-white rounded-2xl border border-gray-200 p-6";
const btn =
  "px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-60";

export default function DesifPage() {
  const qc = useQueryClient();

  const [conteudo, setConteudo] = useState("");
  const [nomeArquivo, setNomeArquivo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoImport | null>(null);

  const [encerrando, setEncerrando] = useState<Declaracao | null>(null);
  const [vencimento, setVencimento] = useState("");
  const [erroEncerrar, setErroEncerrar] = useState<string | null>(null);
  const [encerrandoEmCurso, setEncerrandoEmCurso] = useState(false);
  const [resultadoEncerramento, setResultadoEncerramento] =
    useState<ResultadoEncerramento | null>(null);

  const instituicoes = useQuery({
    queryKey: ["desif", "instituicoes"],
    queryFn: async () =>
      (await getJson("/api/fiscal/desif")).data as Instituicao[],
    retry: false,
  });

  const primeira = instituicoes.data?.[0];

  const declaracoes = useQuery({
    queryKey: ["desif", "declaracoes", primeira?.id],
    queryFn: async () =>
      (
        await getJson(
          `/api/fiscal/desif/declaracoes?instituicaoId=${primeira!.id}`,
        )
      ).data as Declaracao[],
    enabled: Boolean(primeira?.id),
    retry: false,
  });

  const detalhe = useQuery({
    queryKey: ["desif", "detalhe", resultado?.declaracaoId],
    queryFn: async () =>
      (
        await getJson(
          `/api/fiscal/desif/declaracoes/${resultado!.declaracaoId}`,
        )
      ).data as { apontamentos: Apontamento[] },
    // Só busca os apontamentos quando há o que corrigir.
    enabled: Boolean(resultado?.declaracaoId) && (resultado?.qtdErros ?? 0) > 0,
    retry: false,
  });

  const vazio = useMemo(() => conteudo.trim().length === 0, [conteudo]);

  async function lerArquivo(file: File) {
    setErro(null);
    setNomeArquivo(file.name);
    setConteudo(await file.text());
  }

  async function enviar() {
    setErro(null);
    setResultado(null);
    setEnviando(true);
    try {
      const r = await send("/api/fiscal/desif/importar", "POST", {
        conteudo,
        nomeArquivo: nomeArquivo || "desif.txt",
      });
      setResultado(r.data as ResultadoImport);
      qc.invalidateQueries({ queryKey: ["desif", "declaracoes"] });
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao enviar.");
    } finally {
      setEnviando(false);
    }
  }

  async function encerrar() {
    if (!encerrando) return;
    setErroEncerrar(null);
    setEncerrandoEmCurso(true);
    try {
      const r = await send(
        `/api/fiscal/desif/declaracoes/${encerrando.id}/encerrar`,
        "POST",
        { dataVencimento: vencimento },
      );
      setResultadoEncerramento(r.data as ResultadoEncerramento);
      setEncerrando(null);
      setVencimento("");
      qc.invalidateQueries({ queryKey: ["desif", "declaracoes"] });
    } catch (e) {
      setErroEncerrar(e instanceof Error ? e.message : "Erro ao encerrar.");
    } finally {
      setEncerrandoEmCurso(false);
    }
  }

  if (instituicoes.isError) {
    return (
      <div className={card}>
        <h1 className="text-xl font-bold text-gray-800 mb-2">DES-IF</h1>
        <p className="text-sm text-gray-600 mb-4">
          Não foi possível carregar suas instituições. Entre novamente.
        </p>
        <Link href="/entrar" className={btn}>
          Entrar
        </Link>
      </div>
    );
  }

  if (instituicoes.isLoading) {
    return (
      <div className={card}>
        <p className="text-sm text-gray-500">Carregando…</p>
      </div>
    );
  }

  // Sem instituição vinculada não há o que declarar. Dizer isso é melhor que
  // mostrar um formulário que vai falhar no envio.
  if (!primeira) {
    return (
      <div className={card}>
        <h1 className="text-xl font-bold text-gray-800 mb-2">DES-IF</h1>
        <p className="text-sm text-gray-600">
          Seu cadastro não tem instituição financeira vinculada. Procure a
          Prefeitura para vincular o CNPJ antes de declarar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className={card}>
        <h1 className="text-xl font-bold text-gray-800">
          DES-IF — Declaração de instituições financeiras
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {primeira.razaoSocial} · CNPJ base {primeira.cnpjBase}
        </p>
      </div>

      <div className={card}>
        <h2 className="font-bold text-gray-800 mb-1">Enviar declaração</h2>
        <p className="text-sm text-gray-500 mb-4">
          Arquivo no leiaute ABRASF 3.1, gerado pelo seu sistema contábil.
          Guarde o protocolo: ele é o comprovante da entrega.
        </p>

        {erro && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
            {erro}
          </div>
        )}

        <input
          type="file"
          accept=".txt,text/plain"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void lerArquivo(f);
          }}
          className="block w-full text-sm mb-3 file:mr-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-gray-100 file:text-sm file:font-semibold"
        />

        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
          ou cole o conteúdo
        </label>
        <textarea
          value={conteudo}
          onChange={(e) => setConteudo(e.target.value)}
          rows={5}
          placeholder="1|0000|12345678|BANCO…"
          className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={() => void enviar()}
          disabled={vazio || enviando}
          className={`${btn} mt-4`}
        >
          {enviando ? "Enviando…" : "Enviar declaração"}
        </button>
      </div>

      {resultado && (
        <div
          className={`${card} ${resultado.qtdErros > 0 ? "border-red-300" : "border-green-300"}`}
        >
          <h2 className="font-bold text-gray-800 mb-3">
            {resultado.qtdErros > 0
              ? "Declaração recebida com erros"
              : "Declaração recebida"}
          </h2>

          <dl className="grid grid-cols-2 gap-3 text-sm mb-3">
            <div>
              <dt className="text-gray-500">Protocolo</dt>
              <dd className="font-mono font-semibold">{resultado.protocolo}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Competência</dt>
              <dd className="font-semibold">
                {competenciaLabel(resultado.competencia)}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Módulo</dt>
              <dd>{MODULO_LABEL[resultado.modulo] ?? resultado.modulo}</dd>
            </div>
            <div>
              <dt className="text-gray-500">ISSQN a recolher</dt>
              <dd className="font-semibold">
                {money(resultado.totalIssqnARecolher)}
              </dd>
            </div>
          </dl>

          {resultado.qtdErros > 0 ? (
            <>
              <p className="text-sm text-red-700 mb-2">
                {resultado.qtdErros} erro(s) impedem a entrega. Corrija no seu
                sistema e reenvie como <strong>declaração retificadora</strong>,
                informando este protocolo.
              </p>
              {detalhe.data && (
                <ul className="text-xs space-y-1 max-h-64 overflow-y-auto">
                  {detalhe.data.apontamentos.map((a, i) => (
                    <li
                      key={i}
                      className={`rounded px-2 py-1 ${a.gravidade === "ERRO" ? "bg-red-50 text-red-800" : "bg-amber-50 text-amber-800"}`}
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
            <p className="text-sm text-green-700">
              Sem erros. A entrega está registrada no histórico.
            </p>
          )}
        </div>
      )}

      <div className={card}>
        <h2 className="font-bold text-gray-800 mb-3">Minhas entregas</h2>
        {declaracoes.isLoading && (
          <p className="text-sm text-gray-500">Carregando…</p>
        )}
        {declaracoes.data?.length === 0 && (
          <p className="text-sm text-gray-500">
            Nenhuma declaração entregue ainda.
          </p>
        )}
        {declaracoes.data && declaracoes.data.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-gray-500 border-b">
                  <th className="py-2">Competência</th>
                  <th>Módulo</th>
                  <th>Protocolo</th>
                  <th className="text-right">ISSQN</th>
                  <th>Situação</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {declaracoes.data.map((d) => {
                  const s = SITUACAO[d.situacao] ?? {
                    texto: d.situacao,
                    cls: "bg-gray-100 text-gray-700",
                  };
                  return (
                    <tr key={d.id} className="border-b last:border-0">
                      <td className="py-2">
                        {competenciaLabel(d.competenciaInicio)}
                      </td>
                      <td className="text-xs text-gray-600">
                        {MODULO_LABEL[d.modulo]?.split("—")[0]?.trim() ??
                          d.modulo}
                      </td>
                      <td className="font-mono text-xs">{d.protocolo}</td>
                      <td className="text-right">
                        {money(d.totalIssqnARecolher)}
                      </td>
                      <td>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${s.cls}`}
                        >
                          {s.texto}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-2">
                          {/* O comprovante vale para qualquer declaração
                              recebida (a spec manda o banco guardá-lo), inclusive
                              a rejeitada — que serve de prova da tentativa. */}
                          <a
                            href={`/api/fiscal/desif/declaracoes/${d.id}/comprovante`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                          >
                            Comprovante
                          </a>
                          {/* Só a apuração mensal validada encerra: o módulo 3 é
                              cadastro (não gera imposto) e o que já encerrou não
                              pode encerrar de novo, sob pena de guia dobrada. */}
                          {d.situacao === "VALIDADA" &&
                          d.modulo === "APURACAO_MENSAL" ? (
                            <button
                              onClick={() => setEncerrando(d)}
                              className="px-3 py-1 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
                            >
                              Encerrar competência
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {encerrando && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="font-bold text-gray-800 mb-1">
              Encerrar {competenciaLabel(encerrando.competenciaInicio)}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              O encerramento apura o ISSQN da competência e emite a guia. Depois
              disso, a competência só muda por declaração retificadora.
            </p>

            {erroEncerrar && (
              <div className="mb-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
                {erroEncerrar}
              </div>
            )}

            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
              Vencimento da guia
            </label>
            <input
              type="date"
              value={vencimento}
              onChange={(e) => setVencimento(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm mb-4"
            />

            <div className="flex gap-2">
              <button
                onClick={() => void encerrar()}
                disabled={!vencimento || encerrandoEmCurso}
                className={btn}
              >
                {encerrandoEmCurso ? "Encerrando…" : "Encerrar e gerar guia"}
              </button>
              <button
                onClick={() => {
                  setEncerrando(null);
                  setErroEncerrar(null);
                }}
                className="px-5 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {resultadoEncerramento && (
        <div className={`${card} border-green-300`}>
          <h2 className="font-bold text-gray-800 mb-2">
            Competência {competenciaLabel(resultadoEncerramento.competencia)}{" "}
            encerrada
          </h2>
          {/* Nada a cobrar não é erro. Anunciar "guia emitida" com zero guias
              prometeria uma cobrança que não existe. */}
          {resultadoEncerramento.totalGuias === 0 ? (
            <p className="text-sm text-gray-700">
              Encerrada <strong>sem emissão de guia</strong>: não havia ISSQN a
              recolher na competência (tudo retido, isento ou compensado).
            </p>
          ) : (
            <>
              <p className="text-sm text-gray-700 mb-2">
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
