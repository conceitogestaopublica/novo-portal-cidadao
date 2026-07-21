"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";

/** Formulário do cidadão para responder a uma exigência ("pedir mais informações"). */
export function ResponderForm({ id }: { id: string }) {
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const router = useRouter();

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!texto.trim()) return;
    setEnviando(true);
    setErro(null);
    try {
      const res = await fetch(`/api/solicitacoes/${id}/responder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { message?: string };
        setErro(d.message ?? "Não foi possível enviar sua resposta.");
        return;
      }
      setTexto("");
      router.refresh();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="mt-3">
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={4}
        placeholder="Escreva aqui as informações solicitadas…"
        className="w-full px-3 py-2 text-sm rounded-lg border border-violet-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none"
      />
      {erro && <p className="text-xs text-red-600 mt-1">{erro}</p>}
      <div className="flex justify-end mt-2">
        <button
          type="submit"
          disabled={enviando || !texto.trim()}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-violet-600 rounded-xl hover:bg-violet-700 disabled:opacity-50"
        >
          <Send className="size-4" />
          {enviando ? "Enviando…" : "Enviar resposta"}
        </button>
      </div>
    </form>
  );
}
