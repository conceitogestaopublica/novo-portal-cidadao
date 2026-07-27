import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useBuscarServicos } from "./use-buscar-servicos";

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useBuscarServicos", () => {
  it("busca com termo e público informados, montando a query string", async () => {
    const resultado = { items: [{ slug: "alvara" }], total: 1, publicos: {} };
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, resultado));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useBuscarServicos("alvará", "cidadao"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(resultado);
    expect(fetchMock).toHaveBeenCalledWith("/api/servicos?q=alvar%C3%A1&publico=cidadao", {});
  });

  it("busca sem parâmetros quando termo e público estão vazios", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { items: [], total: 0, publicos: {} }));
    vi.stubGlobal("fetch", fetchMock);

    renderHook(() => useBuscarServicos("", ""), { wrapper });

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith("/api/servicos?", {});
  });

  it("propaga o erro quando a API falha", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(500, { message: "Erro ao buscar" }));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useBuscarServicos("x", ""), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({ message: "Erro ao buscar", status: 500 });
  });
});
