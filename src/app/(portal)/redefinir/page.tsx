"use client";

import { Suspense, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Unlink } from "lucide-react";

function RedefinirForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";

  const [f, setF] = useState({ senha: "", senha2: "" });
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pronto, setPronto] = useState(false);

  // Confere o link antes de mostrar o formulário: pedir a senha nova e só
  // depois dizer "link expirado" seria fazer a pessoa digitar à toa.
  const checagem = useQuery({
    queryKey: ["redefinir", token],
    queryFn: async () => {
      const r = await fetch(`/api/auth/redefinir?token=${encodeURIComponent(token)}`);
      const d = await r.json().catch(() => ({}));
      return Boolean(d?.valido);
    },
    enabled: Boolean(token),
    retry: false,
  });

  const valido = !token ? false : checagem.isLoading ? null : (checagem.data ?? false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (f.senha.length < 6) return setErro("A senha deve ter ao menos 6 caracteres.");
    if (f.senha !== f.senha2) return setErro("As senhas não conferem.");

    setLoading(true);
    try {
      const res = await fetch("/api/auth/redefinir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, senha: f.senha }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message ?? "Falha ao redefinir");
      setPronto(true);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const card = "max-w-md mx-auto bg-white rounded-2xl border border-gray-200 p-8";

  if (pronto) {
    return (
      <div className={card}>
        <CheckCircle2 className="size-8 text-green-600 mb-3" aria-hidden="true" />
        <h1 className="text-xl font-bold text-gray-800 mb-2">Senha alterada</h1>
        <p className="text-sm text-gray-600 mb-5">
          Pronto. Entre com sua nova senha.
        </p>
        <button
          onClick={() => router.push("/entrar")}
          className="w-full px-5 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700"
        >
          Entrar
        </button>
      </div>
    );
  }

  if (valido === null) {
    return (
      <div className={card}>
        <p className="text-sm text-gray-500">Conferindo o link…</p>
      </div>
    );
  }

  if (!valido) {
    return (
      <div className={card}>
        <Unlink className="size-8 text-gray-300 mb-3" aria-hidden="true" />
        <h1 className="text-xl font-bold text-gray-800 mb-2">Link inválido</h1>
        <p className="text-sm text-gray-600 mb-5">
          Este link expirou ou já foi usado. Peça a recuperação de novo — leva um
          minuto.
        </p>
        <Link
          href="/recuperar"
          className="inline-block px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700"
        >
          Pedir novo link
        </Link>
      </div>
    );
  }

  return (
    <div className={card}>
      <h1 className="text-xl font-bold text-gray-800">Nova senha</h1>
      <p className="text-sm text-gray-500 mb-5">Escolha uma senha para entrar no portal.</p>

      {erro && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
          {erro}
        </div>
      )}

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
            Senha
          </label>
          <input
            autoFocus
            type="password"
            value={f.senha}
            onChange={(e) => setF({ ...f, senha: e.target.value })}
            placeholder="mín. 6"
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
            Confirmar
          </label>
          <input
            type="password"
            value={f.senha2}
            onChange={(e) => setF({ ...f, senha2: e.target.value })}
            className={inputCls}
          />
        </div>
        <button
          disabled={loading}
          className="w-full px-5 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Salvando…" : "Salvar nova senha"}
        </button>
      </form>
    </div>
  );
}

export default function RedefinirPage() {
  // useSearchParams exige Suspense no App Router.
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-200 p-8">
          <p className="text-sm text-gray-500">Carregando…</p>
        </div>
      }
    >
      <RedefinirForm />
    </Suspense>
  );
}
