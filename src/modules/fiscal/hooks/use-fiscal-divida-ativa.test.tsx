import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useFiscalDividaAtiva } from "./use-fiscal-divida-ativa";

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

describe("useFiscalDividaAtiva", () => {
  it("busca a dívida ativa com sucesso", async () => {
    const dados = { quantidade: 2, valorInscrito: 900 };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(200, dados)));

    const { result } = renderHook(() => useFiscalDividaAtiva(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(dados);
  });

  it("propaga o erro quando a sessão expirou (401)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(401, { message: "Sessão inválida" })));

    const { result } = renderHook(() => useFiscalDividaAtiva(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({ message: "Sessão inválida", status: 401 });
  });
});
