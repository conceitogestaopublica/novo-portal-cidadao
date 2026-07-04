import { HomeView } from "@/modules/carta-servicos/components/home-view";
import { getHome } from "@/shared/catalogo/catalogo";

/** Home do portal — Carta de Serviços servida pelo catálogo (server-side). */
export default function HomePage() {
  const { categorias, maisAcessados, totalServicos } = getHome();
  return <HomeView categorias={categorias} maisAcessados={maisAcessados} totalServicos={totalServicos} />;
}
