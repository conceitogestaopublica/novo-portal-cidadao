import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useCertidaoApuracao } from "./use-certidao";

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

describe("useCertidaoApuracao", () => {
  it("busca a apuração com sucesso", async () => {
    const apuracao = { apuracao: { totalExigivel: 100, totalSuspenso: 0, itens: [] }, tipoPrevisto: "CND", podeEmitir: true };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(200, apuracao)));

    const { result } = renderHook(() => useCertidaoApuracao(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(apuracao);
  });

  it("propaga o erro quando a API falha", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(500, { message: "Erro ao apurar" })));

    const { result } = renderHook(() => useCertidaoApuracao(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({ message: "Erro ao apurar", status: 500 });
  });
});
