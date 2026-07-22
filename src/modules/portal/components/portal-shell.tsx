"use client";

/**
 * Shell do Portal do Cidadão — portado 1:1 do `PortalLayout.jsx` do GED.
 * Público, servido por subdomínio (URLs root-relativas). Inertia → Next:
 * `Link` → next/link; `router.get/post` → next/navigation.
 */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ClipboardList, Home, Landmark, Mail, Phone, Search, Wallet } from "lucide-react";
import type { Cidadao, Ug } from "@/shared/types/portal";
import { useLogoutCidadao } from "../hooks/use-logout";

export function PortalShell({
  ug,
  cidadao,
  hideSearchBar = false,
  children,
}: {
  ug: Ug;
  cidadao: Cidadao | null;
  hideSearchBar?: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const { mutateAsync: logout } = useLogoutCidadao();

  const submeterBusca = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(busca ? `/buscar?q=${encodeURIComponent(busca)}` : "/buscar");
  };

  const sair = async () => {
    await logout();
    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] flex flex-col">
      <header className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 group">
            {ug?.brasao ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ug.brasao} alt="" className="w-12 h-12 rounded-lg object-cover bg-muted" />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center shadow-md">
                <Landmark className="size-5 text-white" aria-hidden="true" />
              </div>
            )}
            <div className="leading-tight">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Portal do Cidadão</p>
              <p className="text-base font-bold text-foreground group-hover:text-blue-700 transition-colors">{ug?.nome || "Carta de Serviços"}</p>
              {ug?.cidade && <p className="text-[11px] text-muted-foreground">{ug.cidade}{ug.uf ? ` — ${ug.uf}` : ""}</p>}
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-sm">
            <Link href="/" className="px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-blue-700 font-medium inline-flex items-center gap-1.5">
              <Home className="size-3" /> Início
            </Link>
            <Link href="/buscar" className="px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-blue-700 font-medium inline-flex items-center gap-1.5">
              <Search className="size-3" /> Todos os Serviços
            </Link>
            {cidadao ? (
              <>
                <Link href="/fiscal" className="px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-blue-700 font-medium inline-flex items-center gap-1.5">
                  <Wallet className="size-3" /> Meus Débitos
                </Link>
                <Link href="/minhas-solicitacoes" className="px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-blue-700 font-medium inline-flex items-center gap-1.5">
                  <ClipboardList className="size-3" /> Minhas Solicitações
                </Link>
                <div className="ml-2 flex items-center gap-2 pl-3 border-l border-border">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {(cidadao.nome || "C").substring(0, 2).toUpperCase()}
                  </div>
                  <div className="leading-tight">
                    <p className="text-xs font-semibold text-foreground max-w-[120px] truncate">{cidadao.nome}</p>
                    <button onClick={sair} className="text-[10px] text-muted-foreground hover:text-red-600">Sair</button>
                  </div>
                </div>
              </>
            ) : (
              <div className="ml-2 flex items-center gap-2 pl-3 border-l border-border">
                <Link href="/entrar" className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700">
                  Entrar
                </Link>
              </div>
            )}
          </nav>
        </div>

        {!hideSearchBar && (
          <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 py-6">
            <div className="max-w-6xl mx-auto px-4 lg:px-6">
              <form onSubmit={submeterBusca} className="flex gap-2 max-w-3xl mx-auto">
                <div className="flex-1 relative">
                  <Search className="size-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <input
                    type="text"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Busque por serviço, palavra-chave ou categoria..."
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-card text-foreground placeholder-gray-500 shadow-md focus:outline-none focus:ring-2 focus:ring-white/60 text-sm"
                  />
                </div>
                <button type="submit" className="px-6 py-3 rounded-xl bg-white/20 backdrop-blur-sm text-white font-bold border-2 border-white hover:bg-white/30 transition-colors">
                  Buscar
                </button>
              </form>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 lg:px-6 py-8">{children}</main>

      <footer className="bg-gray-900 text-gray-400 mt-12">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 py-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <p className="text-white font-bold mb-2">{ug?.nome || "Portal do Cidadão"}</p>
            {ug?.cidade && <p>{ug.cidade}{ug.uf ? ` — ${ug.uf}` : ""}</p>}
            {ug?.telefone && <p className="mt-1 inline-flex items-center gap-2"><Phone className="size-3" />{ug.telefone}</p>}
            {ug?.email && <p className="mt-1 inline-flex items-center gap-2"><Mail className="size-3" />{ug.email}</p>}
          </div>
          <div>
            <p className="text-white font-bold mb-2">Acesso rápido</p>
            <ul className="space-y-1">
              <li><Link href="/" className="hover:text-white">Página inicial</Link></li>
              <li><Link href="/buscar" className="hover:text-white">Todos os serviços</Link></li>
              <li><Link href="/admin" className="hover:text-white">Administração</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-white font-bold mb-2">Legislação</p>
            <p className="text-xs">Carta de Serviços publicada nos termos da Lei 13.460/2017 e do Decreto 9.094/2017.</p>
          </div>
        </div>
        <div className="border-t border-gray-800 py-4 text-center text-xs">
          &copy; {new Date().getFullYear()} {ug?.nome} — Plataforma desenvolvida por Conceito Gestão Pública
        </div>
      </footer>
    </div>
  );
}
