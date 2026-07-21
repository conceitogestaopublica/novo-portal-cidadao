import { Suspense } from "react";
import { BuscarServicos } from "@/modules/carta-servicos";

export default function Page() {
  return (
    <Suspense fallback={<div className="text-center py-16 text-muted-foreground text-sm">Carregando…</div>}>
      <BuscarServicos />
    </Suspense>
  );
}
