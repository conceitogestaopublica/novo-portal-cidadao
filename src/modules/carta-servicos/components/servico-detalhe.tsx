import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Building,
  CheckCircle2,
  ChevronRight,
  Clock,
  DollarSign,
  Folder,
  Info,
  type LucideIcon,
  Scale,
  Send,
  UserCheck,
} from "lucide-react";
import { getServico } from "@/shared/catalogo/catalogo";
import { destinoDe } from "@/shared/catalogo/destino-fiscal";
import { getSessionCidadao } from "@/shared/lib/portal-session";
import { currentTenant } from "@/shared/lib/tenant-map";
import { CatalogoIcon } from "@/shared/lib/icon-registry";
import type { Servico } from "@/shared/types/portal";

const COR_BG: Record<string, string> = {
  red: "bg-red-100 text-red-600", blue: "bg-blue-100 text-blue-600", amber: "bg-amber-100 text-amber-600",
  indigo: "bg-indigo-100 text-indigo-600", orange: "bg-orange-100 text-orange-600", green: "bg-green-100 text-green-600",
  pink: "bg-pink-100 text-pink-600", cyan: "bg-cyan-100 text-cyan-600",
};

export async function ServicoDetalhe({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await currentTenant();
  if (!tenant) notFound();
  const data = await getServico(tenant.municipio, slug);
  if (!data) notFound();
  const { servico, relacionados, publicos } = data;
  const cidadao = await getSessionCidadao();
  const cat = servico.categoria;
  const corCat = cat?.cor ? COR_BG[cat.cor] || "bg-gray-100 text-gray-600" : "bg-blue-100 text-blue-600";
  const fiscal = servico.tipo_fluxo === "self_service_fiscal";
  // Cada serviço fiscal abre a tela certa (não "cai sempre no mesmo lugar").
  const acao = destinoDe(servico);
  const destinoFiscal = acao?.href ?? "/fiscal";
  const rotuloFiscal = acao?.rotulo ?? "Ver meus débitos";

  return (
    <>
      <nav className="text-xs text-muted-foreground mb-4">
        <Link href="/" className="hover:text-blue-600">Início</Link>
        <ChevronRight className="size-3 mx-2 inline" aria-hidden="true" />
        {cat && (<><Link href={`/categoria/${cat.slug}`} className="hover:text-blue-600">{cat.nome}</Link><ChevronRight className="size-3 mx-2 inline" aria-hidden="true" /></>)}
        <span className="text-foreground font-medium">{servico.titulo}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <article className="lg:col-span-2 bg-card rounded-2xl border border-border p-6 lg:p-8">
          <div className="flex items-start gap-4 mb-6 pb-6 border-b border-border">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${corCat}`}>
              <CatalogoIcon nome={servico.icone} className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                {cat && <Link href={`/categoria/${cat.slug}`} className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-semibold hover:bg-blue-100">{cat.nome}</Link>}
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-muted text-muted-foreground rounded-full font-semibold">Para {publicos[servico.publico_alvo] || servico.publico_alvo}</span>
              </div>
              <h1 className="text-2xl font-bold text-foreground leading-tight">{servico.titulo}</h1>
              {servico.descricao_curta && <p className="text-sm text-muted-foreground mt-2">{servico.descricao_curta}</p>}
            </div>
          </div>

          {servico.descricao_completa && <Section titulo="Sobre o serviço" Icon={Info}><p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{servico.descricao_completa}</p></Section>}
          {servico.requisitos && <Section titulo="Quem pode solicitar" Icon={UserCheck}><p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{servico.requisitos}</p></Section>}
          {Array.isArray(servico.documentos_necessarios) && servico.documentos_necessarios.length > 0 && (
            <Section titulo="Documentos necessários" Icon={Folder}>
              <ul className="space-y-2">{servico.documentos_necessarios.map((doc, i) => (<li key={i} className="flex items-start gap-2 text-sm text-foreground"><CheckCircle2 className="size-4 text-blue-600 mt-0.5 shrink-0" aria-hidden="true" /><span>{doc}</span></li>))}</ul>
            </Section>
          )}
          {servico.legislacao && <Section titulo="Legislação de referência" Icon={Scale}><p className="text-sm text-foreground whitespace-pre-line italic">{servico.legislacao}</p></Section>}
        </article>

        <aside className="space-y-4">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white shadow-lg">
            <h3 className="text-sm font-bold mb-1">{fiscal ? "Serviço online" : "Solicite este serviço online"}</h3>
            {cidadao && (
              <p className="text-[11px] text-blue-100 mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="size-4" aria-hidden="true" />Você está logado como <strong className="text-white">{cidadao.nome.split(" ")[0]}</strong>
              </p>
            )}
            <p className="text-xs text-blue-100 mb-3">
              {fiscal
                ? cidadao
                  ? "É só clicar para ver seus débitos, agora."
                  : "Acesse com seu CPF/CNPJ para usar este serviço na hora."
                : cidadao
                  ? "Abra a solicitação e acompanhe o andamento."
                  : "Entre com seu CPF/CNPJ para solicitar e acompanhar."}
            </p>
            {fiscal ? (
              <Link href={cidadao ? destinoFiscal : "/entrar"} className="block text-center px-4 py-2.5 rounded-xl bg-white text-blue-700 font-bold text-sm hover:bg-blue-50 transition-colors">
                <UserCheck className="size-4 mr-2" />{cidadao ? rotuloFiscal : "Entrar para acessar"}
              </Link>
            ) : (
              <Link href={cidadao ? `/servico/${servico.slug}/solicitar` : "/entrar"} className="block text-center px-4 py-2.5 rounded-xl bg-white text-blue-700 font-bold text-sm hover:bg-blue-50 transition-colors">
                <Send className="size-4 mr-2" />{cidadao ? "Solicitar agora" : "Entrar para solicitar"}
              </Link>
            )}
          </div>

          <div className="bg-card rounded-2xl border border-border p-5">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Resumo</h3>
            <div className="space-y-3">
              <Resumo Icon={Clock} titulo="Prazo" valor={servico.prazo_entrega || "Não informado"} />
              <Resumo Icon={DollarSign} titulo="Custo" valor={servico.custo || "Gratuito"} highlight={!servico.custo || /gratuito|sem custo/i.test(servico.custo)} />
              {servico.orgao_responsavel && <Resumo Icon={Building} titulo="Órgão responsável" valor={servico.orgao_responsavel} />}
            </div>
          </div>

          {Array.isArray(servico.palavras_chave) && servico.palavras_chave.length > 0 && (
            <div className="bg-card rounded-2xl border border-border p-5">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Tags</h3>
              <div className="flex flex-wrap gap-1.5">{servico.palavras_chave.map((tag, i) => (<span key={i} className="text-[11px] px-2 py-0.5 bg-muted text-muted-foreground rounded-full">#{tag}</span>))}</div>
            </div>
          )}
        </aside>
      </div>

      {relacionados.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-bold text-foreground mb-3">Serviços relacionados</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {relacionados.map((rel: Servico) => (
              <Link key={String(rel.id)} href={`/servico/${rel.slug}`} className="bg-card rounded-xl border border-border p-4 hover:border-blue-200 hover:ring-2 hover:ring-blue-100 transition-all flex items-start gap-3 group">
                <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0"><CatalogoIcon nome={rel.icone} className="size-3.5" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground group-hover:text-blue-700">{rel.titulo}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{rel.descricao_curta}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function Section({ titulo, Icon, children }: { titulo: string; Icon: LucideIcon; children: React.ReactNode }) {
  return (
    <section className="mb-6 last:mb-0">
      <h2 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2"><Icon className="size-4 text-blue-600" aria-hidden="true" />{titulo}</h2>
      <div className="pl-6">{children}</div>
    </section>
  );
}

function Resumo({ Icon, titulo, valor, highlight }: { Icon: LucideIcon; titulo: string; valor: string; highlight?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${highlight ? "bg-blue-100 text-blue-600" : "bg-muted text-muted-foreground"}`}><Icon className="size-3" aria-hidden="true" /></div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{titulo}</p>
        <p className={`text-sm font-medium ${highlight ? "text-blue-700" : "text-foreground"}`}>{valor}</p>
      </div>
    </div>
  );
}
