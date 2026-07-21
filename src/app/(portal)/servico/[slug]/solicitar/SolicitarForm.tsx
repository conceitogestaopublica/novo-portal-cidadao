"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertCircle, CheckCircle2, Send } from "lucide-react";

export default function SolicitarForm({ slug, nome }: { slug: string; nome: string }) {
  const router = useRouter();
  const [contato, setContato] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [protocolo, setProtocolo] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const res = await fetch("/api/solicitacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ servicoSlug: slug, contato, mensagem }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) { router.push("/entrar"); return; }
      if (!res.ok) throw new Error(data?.message ?? "Falha ao abrir a solicitação.");
      setProtocolo(data?.solicitacao?.protocolo ?? "—");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro");
    } finally {
      setEnviando(false);
    }
  }

  if (protocolo) {
    return (
      <div className="bg-white rounded-2xl border border-green-200 p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4"><CheckCircle2 className="size-6" aria-hidden="true" /></div>
        <h2 className="text-lg font-bold text-gray-800">Solicitação registrada!</h2>
        <p className="text-sm text-gray-500 mt-1">Protocolo <strong className="text-gray-800">{protocolo}</strong>. Acompanhe pelo menu “Minhas Solicitações”.</p>
        <div className="flex gap-2 justify-center mt-5">
          <Link href="/minhas-solicitacoes" className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700">Minhas solicitações</Link>
          <Link href="/" className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50">Início</Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
      {erro && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2"><AlertCircle className="size-4 mr-1.5" />{erro}</div>}
      <p className="text-xs text-gray-500">Solicitante: <strong className="text-gray-700">{nome}</strong></p>
      <div>
        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Contato (e-mail ou telefone)</label>
        <input value={contato} onChange={(e) => setContato(e.target.value)} placeholder="para retorno" className="mt-1 w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Descreva sua solicitação</label>
        <textarea value={mensagem} onChange={(e) => setMensagem(e.target.value)} rows={5} placeholder="Detalhe o que você precisa…" className="mt-1 w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <button disabled={enviando} className="w-full px-5 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-60"><Send className="size-4 mr-2" />{enviando ? "Enviando…" : "Enviar solicitação"}</button>
      <p className="text-[11px] text-gray-400 text-center">Sua solicitação gera um protocolo e será encaminhada para tramitação.</p>
    </form>
  );
}
