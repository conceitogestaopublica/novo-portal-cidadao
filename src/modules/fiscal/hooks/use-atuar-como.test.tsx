import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAtuarComo, useMe } from "./use-atuar-como";

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function createWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }
  return { Wrapper, client };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useMe", () => {
  it("busca a sessão atual com sucesso", async () => {
    const me = { conta: { id: "c1", nome: "Fulano", documento: "12345678900" }, representados: [] };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(200, me)));

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useMe(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(me);
  });

  it("propaga o erro quando a sessão está inválida", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(401, { message: "Sessão inválida" })));

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useMe(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({ message: "Falha ao carregar a sessão." });
  });
});

describe("useAtuarComo", () => {
  it("troca de identidade com sucesso e invalida sessão e dados fiscais", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 200 })));

    const { Wrapper, client } = createWrapper();
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useAtuarComo(), { wrapper: Wrapper });

    result.current.mutate("contrib-2");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["auth", "me"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["fiscal"] });
  });

  it("rejeita quando a identidade não é autorizada (403)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(403, { message: "Identidade não autorizada." })));

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useAtuarComo(), { wrapper: Wrapper });

    result.current.mutate("contrib-2");

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({ message: "Identidade não autorizada." });
  });
});
