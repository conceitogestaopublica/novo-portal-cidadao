import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServico } from "@/shared/catalogo/catalogo";
import { getSessionCidadao } from "@/shared/lib/portal-session";
import SolicitarForm from "./SolicitarForm";

export default async function SolicitarPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getServico(slug);
  if (!data) notFound();
  const cidadao = await getSessionCidadao();
  if (!cidadao) redirect("/entrar");

  const { servico } = data;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <nav className="text-xs text-gray-500">
        <Link href={`/servico/${servico.slug}`} className="hover:text-blue-600"><i className="fas fa-arrow-left mr-1.5" />{servico.titulo}</Link>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-gray-800">Abrir solicitação</h1>
        <p className="text-sm text-gray-500">{servico.titulo}</p>
      </div>

      {Array.isArray(servico.documentos_necessarios) && servico.documentos_necessarios.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="text-sm font-bold text-gray-800 mb-2"><i className="fas fa-folder text-blue-600 mr-2" />Documentos necessários</h2>
          <ul className="space-y-1.5">
            {servico.documentos_necessarios.map((d, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700"><i className="fas fa-check-circle text-blue-600 mt-0.5 shrink-0" /><span>{d}</span></li>
            ))}
          </ul>
        </div>
      )}

      <SolicitarForm slug={servico.slug} nome={cidadao.nome} />
    </div>
  );
}
