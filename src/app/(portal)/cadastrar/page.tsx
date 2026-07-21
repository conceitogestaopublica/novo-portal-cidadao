"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CadastrarPage() {
  const router = useRouter();
  const [f, setF] = useState({ documento: "", nome: "", email: "", senha: "", senha2: "" });
  // "Sou prestador de fora": quem não é do município não está no cadastro, e o
  // cadastro só aceita contribuinte. Marcando, a ficha dele nasce aqui.
  const [prestadorExterno, setPrestadorExterno] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErro(null);
    const doc = f.documento.replace(/\D/g, "");
    if (doc.length < 11) return setErro("Informe um CPF ou CNPJ válido.");
    if (f.nome.trim().length < 3) return setErro("Informe o nome completo.");
    if (f.senha.length < 6) return setErro("A senha deve ter ao menos 6 caracteres.");
    if (f.senha !== f.senha2) return setErro("As senhas não conferem.");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/cadastrar", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documento: f.documento.replace(/\D/g, ""), nome: f.nome, email: f.email, senha: f.senha, prestadorExterno }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message ?? "Falha no cadastro");
      router.push("/fiscal"); router.refresh();
    } catch (e) { setErro(e instanceof Error ? e.message : "Erro"); } finally { setLoading(false); }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-2xl border border-gray-200 p-6 lg:p-8 shadow-sm">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md"><i className="fas fa-user-plus text-white text-xl" /></div>
          <h1 className="text-xl font-bold text-gray-800">Criar conta</h1>
          <p className="text-sm text-gray-500 mt-1">Cadastre-se para acessar o Atendimento ao Contribuinte.</p>
        </div>

        {erro && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2"><i className="fas fa-circle-exclamation mr-1.5" />{erro}</div>}

        <form onSubmit={submit} className="space-y-4">
          <Campo label="CPF ou CNPJ"><input autoFocus value={f.documento} onChange={set("documento")} placeholder="000.000.000-00" className={inputCls} /></Campo>
          <Campo label="Nome completo"><input value={f.nome} onChange={set("nome")} className={inputCls} /></Campo>
          <Campo label="E-mail (opcional)"><input type="email" value={f.email} onChange={set("email")} className={inputCls} /></Campo>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Senha"><input type="password" value={f.senha} onChange={set("senha")} placeholder="mín. 6" className={inputCls} /></Campo>
            <Campo label="Confirmar"><input type="password" value={f.senha2} onChange={set("senha2")} className={inputCls} /></Campo>
          </div>
          <label className="flex items-start gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3 cursor-pointer">
            <input
              type="checkbox"
              checked={prestadorExterno}
              onChange={(e) => setPrestadorExterno(e.target.checked)}
              className="mt-0.5 rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">
              <strong>Sou de outro município</strong> e prestei serviço aqui
              <span className="block text-xs text-gray-500 mt-0.5">
                Marque para declarar o serviço que você prestou no município e
                pagar o ISS. Seu cadastro é criado agora.
              </span>
            </span>
          </label>
          <button disabled={loading} className={btnCls}>{loading ? "Criando..." : "Criar conta"}</button>
        </form>
        <p className="text-center text-xs text-gray-500 mt-4">Já tem conta? <Link href="/entrar" className="text-blue-600 font-semibold hover:text-blue-700">Entrar</Link></p>
        <p className="text-center text-[11px] text-gray-400 mt-2">
          {prestadorExterno
            ? "Seu CPF/CNPJ é validado e passa a constar no cadastro do município."
            : "O cadastro é validado no cadastro de contribuintes do município."}
        </p>
      </div>
    </div>
  );
}

const inputCls = "mt-1 w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm";
const btnCls = "w-full px-4 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-60";
function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</label>{children}</div>;
}
