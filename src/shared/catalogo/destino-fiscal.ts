import type { FiscalAcao, Servico } from "@/shared/types/portal";

/**
 * Para onde vai cada serviço `self_service_fiscal`. Fica aqui (e não dentro de
 * uma tela) porque a página do serviço e a da categoria precisam do mesmo mapa
 * — e um serviço fiscal só é útil se levar direto à ferramenta que o resolve.
 */
export const DESTINO_FISCAL: Record<FiscalAcao, { href: string; rotulo: string; icone: string }> = {
  debitos: { href: "/fiscal", rotulo: "Ver meus débitos", icone: "fas fa-file-invoice-dollar" },
  segunda_via: { href: "/fiscal", rotulo: "Emitir 2ª via", icone: "fas fa-barcode" },
  caixa_postal: { href: "/fiscal#caixa", rotulo: "Abrir caixa postal", icone: "fas fa-envelope" },
  certidao: { href: "/fiscal/certidao", rotulo: "Emitir certidão", icone: "fas fa-certificate" },
  parcelamento: { href: "/fiscal/parcelamento", rotulo: "Parcelar débitos", icone: "fas fa-file-signature" },
  nfse: { href: "/fiscal/nfse", rotulo: "Emitir NFS-e", icone: "fas fa-file-invoice" },
  dms: { href: "/fiscal/dms", rotulo: "Declaração mensal (DMS)", icone: "fas fa-book" },
};

export function destinoDe(servico: Pick<Servico, "tipo_fluxo" | "fiscal_acao">) {
  if (servico.tipo_fluxo !== "self_service_fiscal") return undefined;
  return servico.fiscal_acao ? DESTINO_FISCAL[servico.fiscal_acao] : undefined;
}
