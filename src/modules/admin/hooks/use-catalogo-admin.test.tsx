import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AdminCatalogo } from "@/shared/catalogo/catalogo-admin-repo";
import { useCatalogoAdmin, useExcluirCatalogo, useSalvarCatalogo } from "./use-catalogo-admin";

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }
  return Wrapper;
}

const catalogoInicial: AdminCatalogo = { ambientes: [], categorias: [], servicos: [] };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useCatalogoAdmin", () => {
  it("expõe os dados de initialData imediatamente, sem esperar fetch", () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, catalogoInicial));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useCatalogoAdmin(catalogoInicial), { wrapper: createWrapper() });

    expect(result.current.data).toBe(catalogoInicial);
    expect(result.current.isLoading).toBe(false);
  });

  it("permite refetch, buscando dados atualizados da API", async () => {
    const catalogoAtualizado: AdminCatalogo = {
      ambientes: [],
      categorias: [],
      servicos: [{ slug: "novo-servico", titulo: "Novo serviço", categoriaSlug: "cat", publicado: true } as never],
    };
    // Cada chamada precisa de uma Response nova: o corpo de uma Response só pode ser lido uma vez,
    // e o `useCatalogoAdmin` também dispara um refetch em background ao montar.
    const fetchMock = vi.fn(() => Promise.resolve(jsonResponse(200, catalogoAtualizado)));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useCatalogoAdmin(catalogoInicial), { wrapper: createWrapper() });

    expect(result.current.data).toBe(catalogoInicial);

    await result.current.refetch();

    await waitFor(() => {
      expect(result.current.data).toEqual(catalogoAtualizado);
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/admin/catalogo", { cache: "no-store" });
  });
});

describe("useSalvarCatalogo", () => {
  it("realiza o POST com a url e o body informados e retorna sucesso", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useSalvarCatalogo(), { wrapper: createWrapper() });

    const body = { nome: "Novo Ambiente", slug: "novo-ambiente" };
    await result.current.mutateAsync({ url: "/api/admin/ambientes", body });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/ambientes",
      expect.objectContaining({ method: "POST", body: JSON.stringify(body) }),
    );
  });
});

describe("useExcluirCatalogo", () => {
  it("exclui com sucesso", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useExcluirCatalogo(), { wrapper: createWrapper() });

    await result.current.mutateAsync("/api/admin/ambientes/algum-slug");

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/admin/ambientes/algum-slug", { method: "DELETE" });
  });

  it("propaga o erro de bloqueio (409) quando há categorias vinculadas ao ambiente", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(409, { message: "Há categorias vinculadas a este ambiente." }));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useExcluirCatalogo(), { wrapper: createWrapper() });

    await expect(result.current.mutateAsync("/api/admin/ambientes/algum-slug")).rejects.toThrow(
      "Há categorias vinculadas a este ambiente.",
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
