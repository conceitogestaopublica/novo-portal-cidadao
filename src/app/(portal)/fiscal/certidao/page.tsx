"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
function money(v: unknown): string {
  const n = Number(v);
  return Number.isFinite(n) ? BRL.format(n) : "—";
}

async function getJson(url: string) {
  const res = await fetch(url);
  if (res.status === 401) throw new Error("SESSAO");
  if (!res.ok) throw new Error("ERRO");
  return res.json();
}

type Apuracao = {
  apuracao?: { totalExigivel?: number; totalSuspenso?: number; itens?: unknown[] };
  tipoPrevisto?: string;
  podeEmitir?: boolean;
};

export default function CertidaoPage() {
  const [emitindo, setEmitindo] = useState(false);
  const q = useQuery<Apuracao>({
    queryKey: ["fiscal", "certidao", "apurar"],
    queryFn: () => getJson("/api/fiscal/certidao/apurar"),
  });

  if (q.error instanceof Error && q.error.message === "SESSAO") {
    return (
      <div className="max-w-md mx-auto text-center bg-white rounded-2xl border border-gray-200 p-8">
        <i className="fas fa-user-lock text-3xl text-gray-300 mb-3" />
        <p className="text-sm text-gray-600 mb-4">Sua sessão expirou. Entre novamente.</p>
        <Link href="/entrar" className="inline-block px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700">Entrar</Link>
      </div>
    );
  }

  const podeEmitir = q.data?.podeEmitir === true;
  const totalExigivel = Number(q.data?.apuracao?.totalExigivel ?? 0);
  const totalSuspenso = Number(q.data?.apuracao?.totalSuspenso ?? 0);
  const tipo = q.data?.tipoPrevisto === "CPEN" ? "CPEN — Certidão Positiva com Efeito de Negativa" : "CND — Certidão Negativa de Débitos";

  async function emitir() {
    setEmitindo(true);
    try {
      const res = await fetch("/api/fiscal/certidao");
      if (res.ok && (res.headers.get("content-type") ?? "").includes("pdf")) {
        const blob = await res.blob();
        const u = URL.createObjectURL(blob);
        window.open(u, "_blank");
        setTimeout(() => URL.revokeObjectURL(u), 60_000);
        return;
      }
      const msg = await res.json().catch(() => null);
      alert(msg?.message ?? "Não foi possível emitir a certidão.");
    } finally {
      setEmitindo(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <nav className="text-xs text-gray-500">
        <Link href="/fiscal" className="hover:text-blue-600"><i className="fas fa-arrow-left mr-1.5" />Meus Débitos</Link>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-gray-800">Certidão de débitos (CND/CPEN)</h1>
        <p className="text-sm text-gray-500">O sistema apura sua situação fiscal e emite a certidão assinada, com QR Code de verificação.</p>
      </div>

      {q.isLoading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-400 text-sm">Apurando sua situação fiscal…</div>
      ) : podeEmitir ? (
        <div className="bg-white rounded-2xl border border-green-200 p-6">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-green-100 text-green-600 flex items-center justify-center shrink-0"><i className="fas fa-circle-check text-lg" /></div>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-gray-800">Você está apto a emitir a certidão</h2>
              <p className="text-xs text-gray-500 mt-1">Tipo apurado: <strong>{tipo}</strong>.{totalSuspenso > 0 && ` Há ${money(totalSuspenso)} com exigibilidade suspensa (parcelado/discutido).`}</p>
              <button onClick={emitir} disabled={emitindo} className="mt-4 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-60 inline-flex items-center gap-2">
                <i className="fas fa-file-signature" />{emitindo ? "Emitindo…" : "Emitir certidão (PDF)"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-red-200 p-6">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0"><i className="fas fa-triangle-exclamation text-lg" /></div>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-gray-800">Não é possível emitir a certidão negativa</h2>
              <p className="text-sm text-gray-600 mt-1">Você tem <strong className="text-red-600">{money(totalExigivel)}</strong> em débitos exigíveis. Regularize (pague ou parcele) para emitir a CND.</p>
              <Link href="/fiscal" className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700">
                <i className="fas fa-file-invoice-dollar" />Ver meus débitos
              </Link>
            </div>
          </div>
        </div>
      )}

      <p className="text-[11px] text-gray-400"><i className="fas fa-shield-halved mr-1" />A certidão é assinada digitalmente e pode ser conferida pelo código de verificação impresso nela.</p>
    </div>
  );
}
