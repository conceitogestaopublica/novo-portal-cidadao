"use client";

import { ArrowLeft, CheckCircle2, FileSignature, Receipt, ShieldUser, TriangleAlert, UserLock } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { isSessaoExpirada } from "@/shared/lib/http-client";
import { emitirCertidaoPdf } from "../services/certidao.service";
import { useCertidaoApuracao } from "../hooks/use-certidao";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
function money(v: unknown): string {
  const n = Number(v);
  return Number.isFinite(n) ? BRL.format(n) : "—";
}

export function FiscalCertidao() {
  const [emitindo, setEmitindo] = useState(false);
  const q = useCertidaoApuracao();

  if (isSessaoExpirada(q.error)) {
    return (
      <div className="max-w-md mx-auto text-center bg-card rounded-2xl border border-border p-8">
        <UserLock className="size-8 text-muted-foreground mb-3" aria-hidden="true" />
        <p className="text-sm text-muted-foreground mb-4">Sua sessão expirou. Entre novamente.</p>
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
      const r = await emitirCertidaoPdf();
      if (r.ok) {
        const u = URL.createObjectURL(r.blob);
        window.open(u, "_blank");
        setTimeout(() => URL.revokeObjectURL(u), 60_000);
        return;
      }
      alert(r.mensagem);
    } finally {
      setEmitindo(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <nav className="text-xs text-muted-foreground">
        <Link href="/fiscal" className="hover:text-blue-600"><ArrowLeft className="size-4 mr-1.5" />Meus Débitos</Link>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Certidão de débitos (CND/CPEN)</h1>
        <p className="text-sm text-muted-foreground">O sistema apura sua situação fiscal e emite a certidão assinada, com QR Code de verificação.</p>
      </div>

      {q.isLoading ? (
        <div className="bg-card rounded-2xl border border-border p-8 text-center text-muted-foreground text-sm">Apurando sua situação fiscal…</div>
      ) : podeEmitir ? (
        <div className="bg-card rounded-2xl border border-green-200 p-6">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-green-100 text-green-600 flex items-center justify-center shrink-0"><CheckCircle2 className="size-5" aria-hidden="true" /></div>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-foreground">Você está apto a emitir a certidão</h2>
              <p className="text-xs text-muted-foreground mt-1">Tipo apurado: <strong>{tipo}</strong>.{totalSuspenso > 0 && ` Há ${money(totalSuspenso)} com exigibilidade suspensa (parcelado/discutido).`}</p>
              <button onClick={emitir} disabled={emitindo} className="mt-4 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-60 inline-flex items-center gap-2">
                <FileSignature className="size-4" />{emitindo ? "Emitindo…" : "Emitir certidão (PDF)"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-red-200 p-6">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0"><TriangleAlert className="size-5" aria-hidden="true" /></div>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-foreground">Não é possível emitir a certidão negativa</h2>
              <p className="text-sm text-muted-foreground mt-1">Você tem <strong className="text-red-600">{money(totalExigivel)}</strong> em débitos exigíveis. Regularize (pague ou parcele) para emitir a CND.</p>
              <Link href="/fiscal" className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700">
                <Receipt className="size-4" />Ver meus débitos
              </Link>
            </div>
          </div>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground"><ShieldUser className="size-4 mr-1" aria-hidden="true" />A certidão é assinada digitalmente e pode ser conferida pelo código de verificação impresso nela.</p>
    </div>
  );
}
