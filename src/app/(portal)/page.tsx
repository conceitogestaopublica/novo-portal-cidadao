import { notFound } from "next/navigation";
import { AmbientesView } from "@/modules/carta-servicos";
import { getHome } from "@/shared/catalogo/catalogo";
import { currentTenant } from "@/shared/lib/tenant-map";

/** Home = grade de ambientes (nível 1) + serviços mais procurados. */
export default async function HomePage() {
  const tenant = await currentTenant();
  if (!tenant) notFound();
  const { ambientes, maisAcessados } = await getHome(tenant.municipio);
  return <AmbientesView ambientes={ambientes} maisAcessados={maisAcessados} />;
}
