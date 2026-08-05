"use client";

/**
 * Shell do Portal do Cidadão — direção "Institucional" (ver
 * `docs/redesign-portal-direcao-a.md`).
 *
 * A cor do município entra como CSS custom property (`--mun`) no elemento raiz, e
 * o tom escuro da faixa de busca é derivado dela com `color-mix` — assim não há HEX
 * solto no JSX e trocar de município é trocar uma variável.
 */
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ClipboardList, Home, Landmark, Mail, Menu, Phone, Search, Wallet, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_VERSION, EMPRESA } from "@/shared/config/empresa";
import type { Cidadao, Ug } from "@/shared/types/portal";
import { useLogoutCidadao } from "../hooks/use-logout";

/** Azul institucional usado quando o município não tem cor cadastrada. */
const COR_PADRAO = "#1f4e8c";

/**
 * Cinza do "sanduíche": topo do portal e bloco do município no rodapé usam a MESMA
 * cor, emoldurando o conteúdo claro. Um lugar só para não saírem de sincronia.
 */
const COR_CHROME = "#334155";

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
  const [menuAberto, setMenuAberto] = useState(false);
  const gatilhoRef = useRef<HTMLButtonElement>(null);
  const { mutateAsync: logout } = useLogoutCidadao();

  const fecharMenu = useCallback(() => {
    setMenuAberto(false);
    gatilhoRef.current?.focus();
  }, []);

  // Esc fecha o menu — sem isso, quem navega por teclado fica preso dentro dele.
  useEffect(() => {
    if (!menuAberto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") fecharMenu();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuAberto, fecharMenu]);

  // Trava o scroll do fundo enquanto o menu está aberto.
  useEffect(() => {
    if (!menuAberto) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = anterior;
    };
  }, [menuAberto]);

  const submeterBusca = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(busca ? `/buscar?q=${encodeURIComponent(busca)}` : "/buscar");
  };

  const sair = async () => {
    setMenuAberto(false);
    await logout();
    router.push("/");
    router.refresh();
  };

  const iniciais = (cidadao?.nome || "C").substring(0, 2).toUpperCase();

  /** Itens de navegação — a MESMA lista serve desktop e celular, para não divergirem. */
  const itens = [
    { href: "/", rotulo: "Início", Icone: Home },
    { href: "/buscar", rotulo: "Todos os Serviços", Icone: Search },
    ...(cidadao
      ? [
          { href: "/fiscal", rotulo: "Meus Débitos", Icone: Wallet },
          { href: "/minhas-solicitacoes", rotulo: "Minhas Solicitações", Icone: ClipboardList },
        ]
      : []),
  ];

  return (
    <div
      className="min-h-screen bg-[#f5f7fb] flex flex-col"
      style={
        {
          "--mun": ug?.cor || COR_PADRAO,
          "--chrome": COR_CHROME,
          "--mun-ink": `color-mix(in srgb, ${ug?.cor || COR_PADRAO} 78%, #000)`,
        } as React.CSSProperties
      }
    >
      <header>
        <div className="bg-[var(--chrome)] text-white">
          <div className="max-w-6xl mx-auto px-4 lg:px-6 py-3 flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3 min-w-0">
              {ug?.brasao ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ug.brasao} alt="" className="w-11 h-11 rounded object-cover bg-white/15 shrink-0" />
              ) : (
                <div className="w-11 h-11 rounded bg-white/15 border border-white/30 flex items-center justify-center shrink-0">
                  <Landmark className="size-5 text-white" aria-hidden="true" />
                </div>
              )}
              <div className="leading-tight min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-white/75 font-semibold">Portal do Cidadão</p>
                <p className="text-base font-bold truncate">{ug?.nome || "Carta de Serviços"}</p>
                {ug?.cidade && (
                  <p className="text-[11px] text-white/70">
                    {ug.cidade}
                    {ug.uf ? ` — ${ug.uf}` : ""}
                  </p>
                )}
              </div>
            </Link>

            {/* Desktop */}
            <nav className="hidden md:flex items-center gap-1 text-sm">
              {itens.map(({ href, rotulo, Icone }) => (
                <Link
                  key={href}
                  href={href}
                  className="px-3 py-2 rounded text-white/85 hover:bg-white/15 hover:text-white font-medium inline-flex items-center gap-1.5"
                >
                  <Icone className="size-3.5" aria-hidden="true" /> {rotulo}
                </Link>
              ))}
              {cidadao ? (
                <div className="ml-2 flex items-center gap-2 pl-3 border-l border-white/25">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold">
                    {iniciais}
                  </div>
                  <div className="leading-tight">
                    <p className="text-xs font-semibold max-w-[120px] truncate">{cidadao.nome}</p>
                    <button onClick={sair} className="text-[10px] text-white/75 hover:text-white underline">
                      Sair
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  href="/entrar"
                  className="ml-2 px-4 py-2 rounded bg-white text-[var(--mun-ink)] text-sm font-bold hover:bg-white/90"
                >
                  Entrar
                </Link>
              )}
            </nav>

            {/* Celular: Entrar/avatar SEMPRE visível + gatilho do menu.
                Antes a nav inteira sumia abaixo de md e não havia substituto — o
                cidadão não conseguia entrar nem sair pelo telefone. */}
            <div className="flex md:hidden items-center gap-2 shrink-0">
              {cidadao ? (
                <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold">
                  {iniciais}
                </div>
              ) : (
                <Link
                  href="/entrar"
                  className="px-3 py-2 rounded bg-white text-[var(--mun-ink)] text-sm font-bold"
                >
                  Entrar
                </Link>
              )}
              <button
                ref={gatilhoRef}
                type="button"
                onClick={() => setMenuAberto(true)}
                aria-expanded={menuAberto}
                aria-controls="menu-mobile"
                aria-label="Abrir menu"
                className="w-11 h-11 flex items-center justify-center rounded hover:bg-white/15"
              >
                <Menu className="size-6" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {!hideSearchBar && (
          <div className="bg-[var(--mun-ink)] py-4">
            <div className="max-w-6xl mx-auto px-4 lg:px-6">
              <form onSubmit={submeterBusca} className="flex gap-2 max-w-3xl mx-auto">
                <div className="flex-1 relative">
                  <Search
                    className="size-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <label htmlFor="busca-topo" className="sr-only">
                    Buscar serviço
                  </label>
                  <input
                    id="busca-topo"
                    type="text"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Busque por serviço, palavra-chave ou categoria..."
                    className="w-full pl-12 pr-4 py-3 rounded bg-card text-foreground placeholder-gray-500 shadow-md focus:outline-none focus:ring-2 focus:ring-white/70 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 rounded bg-white/15 text-white font-bold border-2 border-white/80 hover:bg-white/25 transition-colors"
                >
                  Buscar
                </button>
              </form>
            </div>
          </div>
        )}
      </header>

      {/* Menu do celular — painel em tela cheia, alvos de toque grandes */}
      {menuAberto && (
        <div id="menu-mobile" className="fixed inset-0 z-50 md:hidden bg-[var(--mun)] text-white flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/20">
            <p className="font-bold truncate">{ug?.nome || "Portal do Cidadão"}</p>
            <button
              type="button"
              onClick={fecharMenu}
              aria-label="Fechar menu"
              className="w-11 h-11 flex items-center justify-center rounded hover:bg-white/15"
            >
              <X className="size-6" aria-hidden="true" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-4 py-2">
            {itens.map(({ href, rotulo, Icone }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuAberto(false)}
                className="flex items-center gap-3 py-4 text-lg font-semibold border-b border-white/15"
              >
                <Icone className="size-5" aria-hidden="true" /> {rotulo}
              </Link>
            ))}
            {cidadao ? (
              <div className="pt-5">
                <p className="text-sm text-white/75">Conectado como</p>
                <p className="font-semibold truncate">{cidadao.nome}</p>
                <button
                  onClick={sair}
                  className="mt-3 w-full py-3 rounded bg-white text-[var(--mun-ink)] font-bold"
                >
                  Sair
                </button>
              </div>
            ) : (
              <Link
                href="/entrar"
                onClick={() => setMenuAberto(false)}
                className="mt-5 block w-full py-3 rounded bg-white text-[var(--mun-ink)] font-bold text-center"
              >
                Entrar
              </Link>
            )}
          </nav>
        </div>
      )}

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 lg:px-6 py-8">{children}</main>

      <footer className="mt-12">
        {/* Faixa 1 — dados da PREFEITURA (por município, do cadastro do GED) */}
        <div className="bg-[var(--chrome)] text-white/70">
          <div className="max-w-6xl mx-auto px-4 lg:px-6 py-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <p className="text-white font-bold mb-2">{ug?.nome || "Portal do Cidadão"}</p>
              {ug?.cidade && (
                <p>
                  {ug.cidade}
                  {ug.uf ? ` — ${ug.uf}` : ""}
                </p>
              )}
              {ug?.telefone && (
                <p className="mt-1 inline-flex items-center gap-2">
                  <Phone className="size-3" aria-hidden="true" />
                  {ug.telefone}
                </p>
              )}
              {ug?.email && (
                <p className="mt-1 inline-flex items-center gap-2">
                  <Mail className="size-3" aria-hidden="true" />
                  {ug.email}
                </p>
              )}
            </div>
            <div>
              <p className="text-white font-bold mb-2">Acesso rápido</p>
              <ul className="space-y-1">
                <li>
                  <Link href="/" className="hover:text-white">
                    Página inicial
                  </Link>
                </li>
                <li>
                  <Link href="/buscar" className="hover:text-white">
                    Todos os serviços
                  </Link>
                </li>
                <li>
                  <Link href="/admin" className="hover:text-white">
                    Administração
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-white font-bold mb-2">Legislação</p>
              <p className="text-xs">
                Carta de Serviços publicada nos termos da Lei 13.460/2017 e do Decreto 9.094/2017.
              </p>
            </div>
          </div>
          <div className="border-t border-white/15 py-4 text-center text-xs">
            &copy; {new Date().getFullYear()} {ug?.nome}
          </div>
        </div>

        {/* Faixa 2 — assinatura de QUEM DESENVOLVEU (fixa, igual em todo município).
            Fundo BRANCO puro de propósito: o arquivo do logo não tem transparência.
            Em qualquer fundo que não seja #fff — inclusive um cinza-claro — o
            retângulo branco dele fica visível. Só trocar por PNG transparente/SVG
            libera usar outra cor aqui. */}
        <div className="bg-white border-t border-[#e2e7ee]">
          <div className="max-w-6xl mx-auto px-4 lg:px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="text-[11px] leading-relaxed text-[#56617a]">
              <p className="font-bold text-[#1e2a44]">{EMPRESA.nome}</p>
              <p>
                {EMPRESA.endereco} · CEP {EMPRESA.cep}
              </p>
              <p>
                <a href={`tel:+${EMPRESA.telefoneDigitos}`} className="hover:underline">
                  {EMPRESA.telefone}
                </a>{" "}
                ·{" "}
                <a href={`mailto:${EMPRESA.email}`} className="hover:underline">
                  {EMPRESA.email}
                </a>{" "}
                · versão {APP_VERSION}
              </p>
            </div>
            <Image
              src="/gpecloud-portal-transparencia.png"
              alt={`${EMPRESA.produto} — plataforma desenvolvida por ${EMPRESA.nome}`}
              width={760}
              height={218}
              className={cn("w-[190px] h-auto shrink-0")}
            />
          </div>
        </div>
      </footer>
    </div>
  );
}
