import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useLoginAdmin } from "./use-login";

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

describe("useLoginAdmin", () => {
  it("faz POST em /api/admin/login com e-mail e senha e retorna sucesso", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useLoginAdmin(), { wrapper });

    result.current.mutate({ email: "admin@example.com", senha: "segredo123" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/login",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "admin@example.com", senha: "segredo123" }),
      }),
    );
  });

  it("propaga o erro quando a API falha", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(401, { message: "Falha ao entrar" }));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useLoginAdmin(), { wrapper });

    result.current.mutate({ email: "admin@example.com", senha: "errada" });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({ message: "Falha ao entrar", status: 401 });
  });
});
