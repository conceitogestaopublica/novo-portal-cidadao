"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminEntrarPage() {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message ?? "Falha ao entrar");
      router.push("/admin");
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto">
      <div className="bg-white rounded-2xl border border-gray-200 p-6 lg:p-8 shadow-sm">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md">
            <i className="fas fa-user-shield text-white text-xl" />
          </div>
          <h1 className="text-xl font-bold text-gray-800">Área administrativa</h1>
          <p className="text-sm text-gray-500 mt-1">Gerenciar a Carta de Serviços.</p>
        </div>

        {erro && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
            <i className="fas fa-circle-exclamation mr-1.5" />
            {erro}
          </div>
        )}

        <form onSubmit={entrar} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Senha do administrador</label>
            <input
              autoFocus
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-slate-500 text-sm"
            />
          </div>
          <button
            disabled={loading}
            className="w-full px-4 py-3 rounded-xl bg-slate-800 text-white font-bold text-sm hover:bg-slate-900 disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
