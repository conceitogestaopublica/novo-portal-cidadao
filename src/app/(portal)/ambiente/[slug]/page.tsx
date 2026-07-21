import { AmbienteDetalhe } from "@/modules/carta-servicos";

export default function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <AmbienteDetalhe params={params} />;
}
