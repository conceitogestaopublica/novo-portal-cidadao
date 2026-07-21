import { SolicitacaoDetalhe } from "@/modules/solicitacoes";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return <SolicitacaoDetalhe params={params} />;
}
