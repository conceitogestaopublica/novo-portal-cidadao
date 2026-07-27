import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useResponderSolicitacao } from "./use-responder";

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

describe("useResponderSolicitacao", () => {
  it("envia a resposta para o id correto com sucesso", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useResponderSolicitacao("sol-1"), { wrapper });

    result.current.mutate({ texto: "Segue o documento solicitado." });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/solicitacoes/sol-1/responder",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ texto: "Segue o documento solicitado." }) }),
    );
  });

  it("rejeita com a mensagem de erro quando a API falha", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(404, { message: "Solicitação não encontrada." })));

    const { result } = renderHook(() => useResponderSolicitacao("sol-inexistente"), { wrapper });

    result.current.mutate({ texto: "Resposta" });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({ message: "Solicitação não encontrada." });
  });
});
