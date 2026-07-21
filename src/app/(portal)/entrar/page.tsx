"use client";

import { AlertCircle, FlaskConical, UserLock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function EntrarPage() {
  const router = useRouter();
  const [modo, setModo] = useState<"senha" | "otp">("senha");
  const [documento, setDocumento] = useState("");
  const [senha, setSenha] = useState("");
  const [otp, setOtp] = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [canal, setCanal] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function post(url: string, body: unknown) {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message ?? "Falha");
    return data;
  }

  async function entrarSenha(e: React.FormEvent) {
    e.preventDefault(); setErro(null); setLoading(true);
    try {
      await post("/api/auth/login-senha", { documento: documento.replace(/\D/g, ""), senha });
      router.push("/fiscal"); router.refresh();
    } catch (e) { setErro(e instanceof Error ? e.message : "Erro"); } finally { setLoading(false); }
  }

  async function iniciarOtp(e: React.FormEvent) {
    e.preventDefault(); setErro(null); setLoading(true);
    try {
      const d = await post("/api/auth/login-start", { documento: documento.replace(/\D/g, "") });
      if (d.encontrado === false || !d.challengeId) { setErro("Documento não encontrado neste município."); return; }
      setChallengeId(d.challengeId); setCanal(d.canalMascarado ?? null); setDevOtp(d.devOtp ?? null);
    } catch (e) { setErro(e instanceof Error ? e.message : "Erro"); } finally { setLoading(false); }
  }

  async function verificarOtp(e: React.FormEvent) {
    e.preventDefault(); setErro(null); setLoading(true);
    try {
      await post("/api/auth/login-verify", { challengeId, otp: otp.trim() });
      router.push("/fiscal"); router.refresh();
    } catch (e) { setErro(e instanceof Error ? e.message : "Erro"); } finally { setLoading(false); }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-2xl border border-gray-200 p-6 lg:p-8 shadow-sm">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md">
            <UserLock className="text-white size-5" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold text-gray-800">Entrar no Atendimento</h1>
          <p className="text-sm text-gray-500 mt-1">Acesse seus débitos, guias e certidões.</p>
        </div>

        {erro && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2"><AlertCircle className="size-4 mr-1.5" aria-hidden="true" />{erro}</div>}

        {modo === "senha" ? (
          <form onSubmit={entrarSenha} className="space-y-4">
            <Campo label="CPF ou CNPJ"><input autoFocus value={documento} onChange={(e) => setDocumento(e.target.value)} placeholder="000.000.000-00" className={inputCls} /></Campo>
            <Campo label="Senha"><input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="••••••" className={inputCls} /></Campo>
            <button disabled={loading} className={btnCls}>{loading ? "Entrando..." : "Entrar"}</button>
            <div className="flex items-center justify-between text-xs pt-1">
              <Link href="/cadastrar" className="text-blue-600 font-semibold hover:text-blue-700">Criar conta</Link>
              <button type="button" onClick={() => { setModo("otp"); setErro(null); }} className="text-gray-500 hover:text-gray-700">Entrar com código</button>
            </div>
            <p className="text-center text-xs pt-1">
              <Link href="/recuperar" className="text-gray-500 hover:text-gray-700">
                Esqueci minha senha
              </Link>
            </p>
          </form>
        ) : !challengeId ? (
          <form onSubmit={iniciarOtp} className="space-y-4">
            <p className="text-xs text-gray-500 -mt-2">Acesso rápido: enviamos um código para o seu contato cadastrado.</p>
            <Campo label="CPF ou CNPJ"><input autoFocus value={documento} onChange={(e) => setDocumento(e.target.value)} placeholder="000.000.000-00" className={inputCls} /></Campo>
            <button disabled={loading} className={btnCls}>{loading ? "Enviando..." : "Enviar código"}</button>
            <button type="button" onClick={() => { setModo("senha"); setErro(null); }} className="w-full text-xs text-gray-500 hover:text-gray-700">Entrar com senha</button>
          </form>
        ) : (
          <form onSubmit={verificarOtp} className="space-y-4">
            {canal && <p className="text-xs text-gray-500 text-center">Código enviado para <strong>{canal}</strong>.</p>}
            {devOtp && <div className="rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3 py-2 text-center"><FlaskConical className="size-4 mr-1" aria-hidden="true" /> Dev: código <strong className="font-mono tracking-widest">{devOtp}</strong></div>}
            <Campo label="Código de verificação"><input autoFocus inputMode="numeric" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="000000" className={`${inputCls} text-center text-lg font-mono tracking-[0.3em]`} /></Campo>
            <button disabled={loading} className={btnCls}>{loading ? "Verificando..." : "Entrar"}</button>
          </form>
        )}
      </div>
      <p className="text-center text-[11px] text-gray-400 mt-4">Em breve: Login Único gov.br.</p>
    </div>
  );
}

const inputCls = "mt-1 w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm";
const btnCls = "w-full px-4 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-60";
function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</label>{children}</div>;
}
