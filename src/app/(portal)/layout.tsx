import { notFound } from "next/navigation";
import { PortalShell } from "@/modules/portal";
import { currentTenant } from "@/shared/lib/tenant-map";
import { getSessionCidadao } from "@/shared/lib/portal-session";
import type { Ug } from "@/shared/types/portal";

/**
 * Layout da área pública do portal. Resolve o tenant pelo subdomínio, monta a UG
 * pública e a conta autenticada (sessão), e renderiza o shell portado do GED.
 */
export default async function PortalAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenant = await currentTenant();
  if (!tenant) notFound();

  // M0: UG a partir do tenant-map. M1/M3: enriquecer com brasão/banners/contato do GED.
  const ug: Ug = {
    nome: tenant.nome,
    cor: tenant.cor,
  };

  const cidadao = await getSessionCidadao();

  return (
    <PortalShell ug={ug} cidadao={cidadao}>
      {children}
    </PortalShell>
  );
}
