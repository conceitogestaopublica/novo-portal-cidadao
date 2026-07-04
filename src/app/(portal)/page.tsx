import { HomeView } from "@/modules/carta-servicos/components/home-view";
import type { Categoria } from "@/shared/types/portal";

/**
 * Home do portal. M0: catálogo mock (renderização). M1: consome o catálogo real
 * migrado do GED via `/api/home` (BFF).
 */
const MOCK_CATEGORIAS: Categoria[] = [
  { id: 1, nome: "Tributos e Débitos", slug: "tributos", icone: "fas fa-file-invoice-dollar", cor: "blue", descricao: "2ª via de guias, certidões, parcelamento e conta corrente.", servicos_publicados_count: 5 },
  { id: 2, nome: "Imóveis (IPTU)", slug: "imoveis", icone: "fas fa-home", cor: "green", descricao: "Consulta de IPTU, valor venal e situação cadastral.", servicos_publicados_count: 3 },
  { id: 3, nome: "Empresas (ISS)", slug: "empresas", icone: "fas fa-store", cor: "amber", descricao: "NFS-e, DMS, alvará e serviços do econômico.", servicos_publicados_count: 4 },
  { id: 4, nome: "Servidor", slug: "servidor", icone: "fas fa-id-badge", cor: "indigo", descricao: "Contracheque e informe de rendimentos.", servicos_publicados_count: 2 },
];

export default function HomePage() {
  return <HomeView categorias={MOCK_CATEGORIAS} totalServicos={14} />;
}
