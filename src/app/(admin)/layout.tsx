import Link from "next/link";

/**
 * Shell da área administrativa da Carta de Serviços. Não faz a guarda de sessão
 * (para permitir /admin/entrar); cada página protegida chama `requireAdmin()`.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5f7fb] flex flex-col">
      <header className="bg-gradient-to-r from-slate-800 to-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <i className="fas fa-sliders text-amber-300" />
            <span className="font-bold text-sm">Administração — Carta de Serviços</span>
          </div>
          <Link href="/" className="text-xs text-slate-300 hover:text-white">
            <i className="fas fa-arrow-left mr-1" /> Voltar ao portal
          </Link>
        </div>
      </header>
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 lg:px-6 py-8">{children}</main>
    </div>
  );
}
