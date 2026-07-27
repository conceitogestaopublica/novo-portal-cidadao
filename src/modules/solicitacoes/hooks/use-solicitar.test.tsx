import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useCriarSolicitacao } from "./use-solicitar";

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

describe("useCriarSolicitacao", () => {
  it("cria a solicitação com sucesso", async () => {
    const resposta = { solicitacao: { protocolo: "2026/0001" } };
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, resposta));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useCriarSolicitacao(), { wrapper });

    result.current.mutate({ servicoSlug: "alvara-funcionamento", mensagem: "", contato: "" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(resposta);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/solicitacoes",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("rejeita com a mensagem de erro quando a API falha", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(422, { message: "Serviço não encontrado." })));

    const { result } = renderHook(() => useCriarSolicitacao(), { wrapper });

    result.current.mutate({ servicoSlug: "inexistente" });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({ message: "Serviço não encontrado." });
  });
});
