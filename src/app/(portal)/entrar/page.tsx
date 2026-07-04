"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Etapa = "documento" | "otp";

export default function EntrarPage() {
  const router = useRouter();
  const [etapa, setEtapa] = useState<Etapa>("documento");
  const [documento, setDocumento] = useState("");
  const [otp, setOtp] = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [canal, setCanal] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function iniciar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login-start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documento: documento.replace(/\D/g, "") }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? "Falha ao iniciar");
      if (data.encontrado === false || !data.challengeId) {
        setErro("Não encontramos um cadastro com este documento neste município.");
        return;
      }
      setChallengeId(data.challengeId);
      setCanal(data.canalMascarado ?? null);
      setDevOtp(data.devOtp ?? null);
      setEtapa("otp");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function verificar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, otp: otp.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? "Código inválido");
      router.push("/fiscal");
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-2xl border border-gray-200 p-6 lg:p-8 shadow-sm">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md">
            <i className="fas fa-user-lock text-white text-xl" />
          </div>
          <h1 className="text-xl font-bold text-gray-800">Entrar no Portal</h1>
          <p className="text-sm text-gray-500 mt-1">
            {etapa === "documento"
              ? "Informe seu CPF ou CNPJ. Enviaremos um código de verificação."
              : "Digite o código que enviamos."}
          </p>
        </div>

        {erro && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
            <i className="fas fa-circle-exclamation mr-1.5" />
            {erro}
          </div>
        )}

        {etapa === "documento" ? (
          <form onSubmit={iniciar} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">CPF ou CNPJ</label>
              <input
                autoFocus
                value={documento}
                onChange={(e) => setDocumento(e.target.value)}
                placeholder="000.000.000-00"
                className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <button disabled={loading} className="w-full px-4 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-60">
              {loading ? "Enviando..." : "Continuar"}
            </button>
          </form>
        ) : (
          <form onSubmit={verificar} className="space-y-4">
            {canal && (
              <p className="text-xs text-gray-500 text-center">
                Código enviado para <strong>{canal}</strong>.
              </p>
            )}
            {devOtp && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3 py-2 text-center">
                <i className="fas fa-flask mr-1" /> Dev: seu código é <strong className="font-mono tracking-widest">{devOtp}</strong>
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Código de verificação</label>
              <input
                autoFocus
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="000000"
                className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg font-mono tracking-[0.3em]"
              />
            </div>
            <button disabled={loading} className="w-full px-4 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-60">
              {loading ? "Verificando..." : "Entrar"}
            </button>
            <button type="button" onClick={() => { setEtapa("documento"); setOtp(""); setErro(null); }} className="w-full text-xs text-gray-500 hover:text-gray-700">
              Usar outro documento
            </button>
          </form>
        )}
      </div>
      <p className="text-center text-[11px] text-gray-400 mt-4">
        Acesso protegido por código de verificação (OTP). Em breve: Login Único gov.br.
      </p>
    </div>
  );
}
