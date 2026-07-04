import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategoria } from "@/shared/catalogo/catalogo";
import type { Servico } from "@/shared/types/portal";

const COR_HERO: Record<string, string> = {
  red: "from-red-500 to-rose-600", blue: "from-blue-500 to-indigo-600", amber: "from-amber-500 to-orange-600",
  indigo: "from-indigo-500 to-purple-600", green: "from-green-500 to-blue-600", cyan: "from-cyan-500 to-blue-600",
};

export default async function CategoriaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = getCategoria(slug);
  if (!data) notFound();
  const { categoria, servicos, publicos } = data;

  return (
    <>
      <div className={`rounded-2xl bg-gradient-to-br ${COR_HERO[categoria.cor ?? ""] || "from-gray-600 to-gray-700"} p-6 lg:p-8 text-white mb-8 shadow-lg`}>
        <Link href="/" className="text-xs text-white/80 hover:text-white"><i className="fas fa-arrow-left mr-1.5" />Voltar ao início</Link>
        <div className="flex items-center gap-4 mt-3">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center"><i className={`${categoria.icone || "fas fa-folder"} text-2xl`} /></div>
          <div>
            <h1 className="text-2xl font-bold">{categoria.nome}</h1>
            {categoria.descricao && <p className="text-sm text-white/90 mt-0.5">{categoria.descricao}</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {servicos.map((s: Servico) => (
          <Link key={String(s.id)} href={`/servico/${s.slug}`} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-200 hover:ring-2 hover:ring-blue-100 hover:shadow-md transition-all flex items-start gap-3 group">
            <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-blue-100"><i className={s.icone || "fas fa-file-alt"} /></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-700">{s.titulo}</p>
                <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">{publicos[s.publico_alvo] || s.publico_alvo}</span>
              </div>
              <p className="text-xs text-gray-500 line-clamp-2 mt-1">{s.descricao_curta}</p>
            </div>
            <i className="fas fa-arrow-right text-gray-300 group-hover:text-blue-600 mt-1" />
          </Link>
        ))}
      </div>
    </>
  );
}
