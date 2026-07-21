"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Building, Check, Loader2, Tag, User } from "lucide-react";
import { useState } from "react";
import type { MeResponse, Representacao } from "@/shared/types/portal";

function docFmt(doc?: string | null): string {
  const d = (doc ?? "").replace(/\D/g, "");
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  return doc ?? "";
}

/**
 * Seletor "atuar como": um login (a pessoa) alcança as empresas que representa
 * sem novo login. Só aparece quando há mais de uma identidade. Ao trocar,
 * reemite o token no BFF e recarrega os dados fiscais da identidade escolhida.
 */
export default function AtuarComoSeletor() {
  const qc = useQueryClient();
  const [trocando, setTrocando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const me = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async (): Promise<MeResponse> => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) throw new Error("Falha ao carregar a sessão.");
      return res.json();
    },
  });

  const representados = me.data?.representados ?? [];
  const ativoId = me.data?.atuandoComoId ?? null;
  if (representados.length <= 1) return null;

  async function trocar(alvo: Representacao) {
    if (alvo.id === ativoId) return;
    setErro(null);
    setTrocando(alvo.id);
    try {
      const res = await fetch("/api/auth/atuar-como", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contribuinteId: alvo.id }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.message ?? "Não foi possível trocar de identidade.");
      }
      await qc.invalidateQueries({ queryKey: ["auth", "me"] });
      await qc.invalidateQueries({ queryKey: ["fiscal"] });
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao trocar.");
    } finally {
      setTrocando(null);
    }
  }

  const ativo = representados.find((r) => r.id === ativoId);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Tag className="size-4 text-blue-600" aria-hidden="true" />
        <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Atuando como</p>
        {ativo && (
          <span className="text-xs text-gray-500">
            — <strong className="text-gray-700">{ativo.nome}</strong>{" "}
            <span className="text-gray-400">{docFmt(ativo.documento)}</span>
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {representados.map((r) => {
          const ativoR = r.id === ativoId;
          return (
            <button
              key={r.id}
              onClick={() => trocar(r)}
              disabled={!!trocando || ativoR}
              className={`text-left px-3 py-2 rounded-xl border text-sm transition-colors ${
                ativoR
                  ? "border-blue-500 bg-blue-50 ring-1 ring-blue-200"
                  : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
              } disabled:opacity-70`}
            >
              <span className="flex items-center gap-2">
                {r.tipo === "titular" ? (
                  <User className={`size-3 ${ativoR ? "text-blue-600" : "text-gray-400"}`} aria-hidden="true" />
                ) : (
                  <Building className={`size-3 ${ativoR ? "text-blue-600" : "text-gray-400"}`} aria-hidden="true" />
                )}
                <span className="font-semibold text-gray-800">{r.nome}</span>
                {r.tipo === "empresa" && r.papel && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">{r.papel}</span>
                )}
                {trocando === r.id && <Loader2 className="size-3 text-blue-500 animate-spin" aria-hidden="true" />}
                {ativoR && <Check className="size-3 text-blue-600" aria-hidden="true" />}
              </span>
              <span className="block text-[11px] text-gray-400 mt-0.5">{docFmt(r.documento)}</span>
            </button>
          );
        })}
      </div>

      {erro && <p className="text-xs text-red-600 mt-2"><AlertCircle className="size-4 mr-1" aria-hidden="true" />{erro}</p>}
    </div>
  );
}
