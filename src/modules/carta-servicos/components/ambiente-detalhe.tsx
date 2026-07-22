import { ArrowLeft, ArrowRight, CheckCircle2, Receipt, UserCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAmbiente } from "@/shared/catalogo/catalogo";
import { CatalogoIcon } from "@/shared/lib/icon-registry";
import { getSessionCidadao } from "@/shared/lib/portal-session";
import { currentTenant } from "@/shared/lib/tenant-map";
import type { Categoria, Servico } from "@/shared/types/portal";

const COR_HERO: Record<string, string> = {
  blue: "from-blue-600 to-indigo-700", indigo: "from-indigo-600 to-purple-700",
  green: "from-green-600 to-emerald-700", amber: "from-amber-600 to-orange-700",
};
const COR_CAT: Record<string, string> = {
  blue: "from-blue-500 to-indigo-600", green: "from-green-500 to-blue-600",
  amber: "from-amber-500 to-orange-600", indigo: "from-indigo-500 to-purple-600",
};

export async function AmbienteDetalhe({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await currentTenant();
  if (!tenant) notFound();
  const data = await getAmbiente(tenant.municipio, slug);
  if (!data) notFound();
  const { ambiente, categorias, servicos, publicos } = data;
  const isFiscal = ambiente.sistema === "tributario";
  const cidadao = isFiscal ? await getSessionCidadao() : null;

  return (
    <>
      <div className={`rounded-2xl bg-gradient-to-br ${COR_HERO[ambiente.cor] || "from-gray-600 to-gray-700"} p-6 lg:p-8 text-white mb-8 shadow-lg`}>
        <Link href="/" className="text-xs text-white/80 hover:text-white inline-flex items-center gap-1.5"><ArrowLeft className="size-4" />Todos os ambientes</Link>
        <div className="flex flex-col md:flex-row md:items-center gap-4 mt-3">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0"><CatalogoIcon nome={ambiente.icone} className="size-6" /></div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{ambiente.nome}</h1>
            <p className="text-sm text-white/90 mt-0.5">{ambiente.descricao}</p>
          </div>
          {isFiscal && (
            <div className="shrink-0">
              {cidadao ? (
                <div className="text-right">
                  <p className="text-[11px] text-white/80 mb-1 inline-flex items-center gap-1"><CheckCircle2 className="size-4" />Logado como <strong>{cidadao.nome.split(" ")[0]}</strong></p>
                  <Link href="/fiscal" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-blue-700 font-bold text-sm hover:bg-blue-50 transition-colors">
                    <Receipt className="size-4" />Ver meus débitos
                  </Link>
                </div>
              ) : (
                <Link href="/entrar" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-blue-700 font-bold text-sm hover:bg-blue-50 transition-colors">
                  <UserCheck className="size-4" />Entrar no Atendimento
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {categorias.length > 1 && (
        <>
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-3">Categorias</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {categorias.map((c: Categoria) => (
              <Link key={String(c.id)} href={`/categoria/${c.slug}`} className="bg-card rounded-xl border border-border p-4 hover:shadow-md hover:ring-2 hover:ring-blue-100 transition-all group">
                <div className={`w-11 h-11 rounded-lg bg-gradient-to-br ${COR_CAT[c.cor ?? ""] || "from-gray-500 to-gray-600"} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                  <CatalogoIcon nome={c.icone} className="text-white" />
                </div>
                <p className="text-sm font-bold text-foreground">{c.nome}</p>
                <p className="text-[10px] text-blue-600 font-semibold mt-1">{c.servicos_publicados_count || 0} serviços</p>
              </Link>
            ))}
          </div>
        </>
      )}

      <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-3">Serviços</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {servicos.map((s: Servico) => (
          <Link key={String(s.id)} href={`/servico/${s.slug}`} className="bg-card rounded-xl border border-border p-5 hover:border-blue-200 hover:ring-2 hover:ring-blue-100 hover:shadow-md transition-all flex items-start gap-3 group">
            <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-blue-100"><CatalogoIcon nome={s.icone} /></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground group-hover:text-blue-700">{s.titulo}</p>
                <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 bg-muted text-muted-foreground rounded-full">{publicos[s.publico_alvo] || s.publico_alvo}</span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{s.descricao_curta}</p>
            </div>
            <ArrowRight className="size-4 text-muted-foreground group-hover:text-blue-600 mt-1" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </>
  );
}
