import { CategoriaDetalhe } from "@/modules/carta-servicos";

export default function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <CategoriaDetalhe params={params} />;
}
