"use client";

import { useState } from "react";
import Link from "next/link";
import { MailCheck, TriangleAlert } from "lucide-react";

/**
 * Pedir o link de recuperação de senha. Vale para qualquer usuário do portal.
 *
 * A resposta é sempre a mesma, exista a conta ou não — quem sonda documentos não
 * descobre quais têm conta aqui.
 */
export default function RecuperarPage() {
  const [documento, setDocumento] = useState("");
  const [enviado, setEnviado] = useState<{
    message: string;
    devLink?: string;
    envioConfigurado?: boolean;
  } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/recuperar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documento: documento.replace(/\D/g, "") }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message ?? "Falha no pedido");
      setEnviado(data);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  if (enviado) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-200 p-8">
        <MailCheck className="size-8 text-blue-600 mb-3" aria-hidden="true" />
        <h1 className="text-xl font-bold text-gray-800 mb-2">Pedido recebido</h1>
        <p className="text-sm text-gray-600">{enviado.message}</p>
        <p className="text-xs text-gray-500 mt-2">
          O link vale por 1 hora e só pode ser usado uma vez.
        </p>

        {enviado.envioConfigurado === false && (
          <p className="mt-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3 py-2">
            <TriangleAlert className="size-4 mr-1.5" />
            O envio de e-mail ainda não está configurado neste município. Se você
            não receber, procure a Prefeitura.
          </p>
        )}

        {enviado.devLink && (
          <div className="mt-4 rounded-lg bg-gray-50 border border-gray-200 p-3">
            <p className="text-[11px] text-gray-500 mb-1">
              Ambiente de desenvolvimento — link gerado:
            </p>
            <a
              href={enviado.devLink}
              className="text-xs text-blue-600 break-all hover:underline"
            >
              {enviado.devLink}
            </a>
          </div>
        )}

        <Link
          href="/entrar"
          className="mt-6 inline-block text-sm text-blue-600 font-semibold hover:text-blue-700"
        >
          Voltar para o login
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-200 p-8">
      <h1 className="text-xl font-bold text-gray-800">Esqueci minha senha</h1>
      <p className="text-sm text-gray-500 mb-5">
        Informe seu CPF ou CNPJ. Enviaremos um link para o e-mail do seu
        cadastro.
      </p>

      {erro && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
          {erro}
        </div>
      )}

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
            CPF ou CNPJ
          </label>
          <input
            autoFocus
            value={documento}
            onChange={(e) => setDocumento(e.target.value)}
            placeholder="000.000.000-00"
            className={inputCls}
          />
        </div>
        <button
          disabled={loading || documento.replace(/\D/g, "").length < 11}
          className="w-full px-5 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Enviando…" : "Enviar link"}
        </button>
      </form>

      <p className="text-center text-xs text-gray-500 mt-4">
        Lembrou?{" "}
        <Link href="/entrar" className="text-blue-600 font-semibold hover:text-blue-700">
          Entrar
        </Link>
      </p>
    </div>
  );
}
