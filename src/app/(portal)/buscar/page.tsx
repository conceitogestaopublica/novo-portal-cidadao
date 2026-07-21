"use client";

import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { CatalogoIcon } from "@/shared/lib/icon-registry";
import type { Servico } from "@/shared/types/portal";

function BuscarInner() {
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [publico, setPublico] = useState("");
  const [termo, setTermo] = useState(sp.get("q") ?? "");

  const { data, isLoading } = useQuery({
    queryKey: ["servicos", termo, publico],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (termo) p.set("q", termo);
      if (publico) p.set("publico", publico);
      const res = await fetch(`/api/servicos?${p.toString()}`);
      return res.json() as Promise<{ items: Servico[]; total: number; publicos: Record<string, string> }>;
    },
  });

  const items = data?.items ?? [];
  const publicos = data?.publicos ?? {};

  return (
    <>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Todos os serviços</h1>
      <p className="text-sm text-gray-500 mb-6">Encontre o serviço que você precisa.</p>

      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="size-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setTermo(q)}
            placeholder="Busque por serviço ou palavra-chave..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <select value={publico} onChange={(e) => setPublico(e.target.value)} className="px-3 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-700">
          <option value="">Todos os públicos</option>
          <option value="cidadao">Cidadão</option>
          <option value="empresa">Empresa</option>
          <option value="servidor">Servidor</option>
        </select>
        <button onClick={() => setTermo(q)} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700">Buscar</button>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Carregando…</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-gray-500"><Search className="size-8 text-gray-300 mb-3" aria-hidden="true" /><p className="text-sm">Nenhum serviço encontrado.</p></div>
      ) : (
        <>
          <p className="text-xs text-gray-400 mb-3">{items.length} serviço(s)</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {items.map((s) => (
              <Link key={String(s.id)} href={`/servico/${s.slug}`} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-200 hover:ring-2 hover:ring-blue-100 hover:shadow-md transition-all flex items-start gap-3 group">
                <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-blue-100"><CatalogoIcon nome={s.icone} /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-700">{s.titulo}</p>
                    {s.categoria && <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-full">{s.categoria.nome}</span>}
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2 mt-1">{s.descricao_curta}</p>
                </div>
                <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full self-start">{publicos[s.publico_alvo] || s.publico_alvo}</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}

export default function BuscarPage() {
  return (
    <Suspense fallback={<div className="text-center py-16 text-gray-400 text-sm">Carregando…</div>}>
      <BuscarInner />
    </Suspense>
  );
}
