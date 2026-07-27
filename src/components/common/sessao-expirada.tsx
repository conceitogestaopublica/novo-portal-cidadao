import Link from "next/link";
import { UserLock } from "lucide-react";

/** Estado de tela cheia para quando uma query de área logada volta 401 (`isSessaoExpirada`). */
export function SessaoExpirada({ mensagem = "Sua sessão expirou. Entre novamente." }: { mensagem?: string }) {
  return (
    <div className="max-w-md mx-auto text-center bg-card rounded-2xl border border-border p-8">
      <UserLock className="size-8 text-muted-foreground mb-3" aria-hidden="true" />
      <p className="text-sm text-muted-foreground mb-4">{mensagem}</p>
      <Link href="/entrar" className="inline-block px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700">
        Entrar
      </Link>
    </div>
  );
}
