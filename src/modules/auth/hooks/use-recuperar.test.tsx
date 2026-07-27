import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useRecuperar } from "./use-recuperar";

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

describe("useRecuperar", () => {
  it("pede a recuperação com sucesso", async () => {
    const resposta = { message: "Se o documento existir, você receberá um e-mail." };
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, resposta));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useRecuperar(), { wrapper });

    result.current.mutate({ documento: "12345678900" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(resposta);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/recuperar",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ documento: "12345678900" }) }),
    );
  });

  it("propaga o erro quando a API falha", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(500, { message: "Erro interno" })));

    const { result } = renderHook(() => useRecuperar(), { wrapper });

    result.current.mutate({ documento: "12345678900" });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({ message: "Erro interno", status: 500 });
  });
});
