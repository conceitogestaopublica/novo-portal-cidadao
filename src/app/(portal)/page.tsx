import { AmbientesView } from "@/modules/carta-servicos/components/ambientes-view";
import { getHome } from "@/shared/catalogo/catalogo";

/** Home = grade de ambientes (nível 1) + serviços mais procurados. */
export default async function HomePage() {
  const { ambientes, maisAcessados } = await getHome();
  return <AmbientesView ambientes={ambientes} maisAcessados={maisAcessados} />;
}
