"use client";

import Link from "next/link";
import type { Servico } from "@/shared/types/portal";

interface AmbienteCard {
  slug: string;
  nome: string;
  descricao: string;
  icone: string;
  cor: string;
  disponivel: boolean;
  servicos_count: number;
}

const COR_BG: Record<string, string> = {
  blue: "from-blue-500 to-indigo-600",
  indigo: "from-indigo-500 to-purple-600",
  green: "from-green-500 to-emerald-600",
  amber: "from-amber-500 to-orange-600",
  red: "from-red-500 to-rose-600",
  cyan: "from-cyan-500 to-blue-600",
};

export function AmbientesView({
  ambientes,
  maisAcessados = [],
}: {
  ambientes: AmbienteCard[];
  maisAcessados?: Servico[];
}) {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Como podemos ajudar?</h1>
        <p className="text-sm text-gray-500">Escolha um ambiente para ver os serviços disponíveis.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12">
        {ambientes.map((a) => {
          const card = (
            <div className={`relative overflow-hidden rounded-2xl border p-6 transition-all h-full ${a.disponivel ? "bg-white border-gray-200 hover:shadow-lg hover:ring-2 hover:ring-blue-200 group" : "bg-gray-50 border-gray-200 opacity-70"}`}>
              <div className="flex items-start gap-4">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${COR_BG[a.cor] || "from-gray-500 to-gray-600"} flex items-center justify-center shadow-md shrink-0 ${a.disponivel ? "group-hover:scale-110 transition-transform" : ""}`}>
                  <i className={`${a.icone} text-white text-2xl`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-gray-800">{a.nome}</h2>
                    {!a.disponivel && <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 bg-gray-200 text-gray-500 rounded-full font-semibold">Em breve</span>}
                  </div>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">{a.descricao}</p>
                  {a.disponivel && (
                    <p className="text-xs text-blue-600 font-semibold mt-3 uppercase tracking-wide">
                      {a.servicos_count} serviços <i className="fas fa-arrow-right ml-1 text-[10px]" />
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
          return a.disponivel ? (
            <Link key={a.slug} href={`/ambiente/${a.slug}`} className="block">{card}</Link>
          ) : (
            <div key={a.slug}>{card}</div>
          );
        })}
      </div>

      {maisAcessados.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-bold text-gray-800 mb-1">Serviços mais procurados</h2>
          <p className="text-sm text-gray-500 mb-4">Acesso rápido aos serviços mais usados.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {maisAcessados.map((s) => (
              <Link key={String(s.id)} href={`/servico/${s.slug}`} className="bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-200 hover:ring-2 hover:ring-blue-100 hover:shadow-md transition-all flex items-start gap-3 group">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-blue-100"><i className={s.icone || "fas fa-file-alt"} /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-700">{s.titulo}</p>
                  <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{s.descricao_curta}</p>
                </div>
                <i className="fas fa-arrow-right text-gray-300 group-hover:text-blue-600 mt-2" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
