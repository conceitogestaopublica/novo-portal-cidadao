import { notFound } from "next/navigation";
import { requireAdmin } from "@/shared/lib/admin-session";
import { carregarCatalogoAdmin } from "@/shared/catalogo/catalogo-admin-repo";
import { currentTenant } from "@/shared/lib/tenant-map";
import { AdminConsole } from "@/modules/admin";

export const dynamic = "force-dynamic";

/** Console de administração da Carta de Serviços (escopado ao município do subdomínio). */
export default async function AdminPage() {
  await requireAdmin();
  const tenant = await currentTenant();
  if (!tenant) notFound();
  const catalogo = await carregarCatalogoAdmin(tenant.municipio);
  return <AdminConsole inicial={catalogo} />;
}
