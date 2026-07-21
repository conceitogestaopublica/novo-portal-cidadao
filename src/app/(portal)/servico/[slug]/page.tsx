import { ServicoDetalhe } from "@/modules/carta-servicos";

export default function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <ServicoDetalhe params={params} />;
}
