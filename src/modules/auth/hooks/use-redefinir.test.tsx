import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useCheckTokenRedefinir, useRedefinir } from "./use-redefinir";

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

describe("useCheckTokenRedefinir", () => {
  it("confere um token válido", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(200, { valido: true })));

    const { result } = renderHook(() => useCheckTokenRedefinir("token-123"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ valido: true });
  });

  it("não dispara a busca quando o token está vazio", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useCheckTokenRedefinir(""), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("propaga o erro quando o token expirou/é inválido", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(400, { message: "Link inválido ou expirado." })));

    const { result } = renderHook(() => useCheckTokenRedefinir("token-expirado"), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({ message: "Link inválido ou expirado.", status: 400 });
  });
});

describe("useRedefinir", () => {
  it("redefine a senha com sucesso", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useRedefinir(), { wrapper });

    result.current.mutate({ token: "token-123", senha: "novaSenha1" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/redefinir",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ token: "token-123", senha: "novaSenha1" }) }),
    );
  });

  it("rejeita com a mensagem de erro (token já usado)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(400, { message: "Link já utilizado." })));

    const { result } = renderHook(() => useRedefinir(), { wrapper });

    result.current.mutate({ token: "token-123", senha: "novaSenha1" });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({ message: "Link já utilizado." });
  });
});
