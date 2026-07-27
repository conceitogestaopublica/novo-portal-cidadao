import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useFiscalResumo } from "./use-fiscal-resumo";

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

describe("useFiscalResumo", () => {
  it("busca o resumo de débitos com sucesso", async () => {
    const resumo = { quantidade: 3, valorTotal: 450.5 };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(200, resumo)));

    const { result } = renderHook(() => useFiscalResumo(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(resumo);
  });

  it("propaga o erro quando a sessão expirou (401)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(401, { message: "Sessão inválida" })));

    const { result } = renderHook(() => useFiscalResumo(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({ message: "Sessão inválida", status: 401 });
  });
});
