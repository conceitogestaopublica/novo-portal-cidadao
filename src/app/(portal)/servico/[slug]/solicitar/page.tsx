import { ServicoSolicitar } from "@/modules/solicitacoes";

export default function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <ServicoSolicitar params={params} />;
}
