import { requireAdmin } from "@/shared/lib/admin-session";
import { carregarCatalogoAdmin } from "@/shared/catalogo/catalogo-admin-repo";
import { AdminConsole } from "./AdminConsole";

export const dynamic = "force-dynamic";

/** Console de administração da Carta de Serviços. */
export default async function AdminPage() {
  await requireAdmin();
  const catalogo = await carregarCatalogoAdmin();
  return <AdminConsole inicial={catalogo} />;
}
