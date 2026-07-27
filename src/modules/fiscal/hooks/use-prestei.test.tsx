import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useDeclararPrestei, useGerarGuiaPrestei, usePresteiPendentes } from "./use-prestei";

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

describe("usePresteiPendentes", () => {
  it("busca as notas pendentes com sucesso", async () => {
    const pendentes = { total: 1, valorIss: 50, notas: [{ id: "1", numeroNota: "10", competencia: "2026-07", valorIss: 50 }] };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(200, pendentes)));

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => usePresteiPendentes(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(pendentes);
  });

  it("propaga o erro quando a API falha", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(500, { message: "Erro ao buscar" })));

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => usePresteiPendentes(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({ message: "Erro ao buscar", status: 500 });
  });
});

describe("useDeclararPrestei", () => {
  const payload = {
    tomadorDocumento: "12345678900",
    tomadorNome: "Tomador Teste",
    numeroNota: "10",
    competencia: "2026-07",
    dataEmissao: "2026-07-01",
    discriminacao: "Serviço prestado",
    valorServicos: 1000,
    valorIss: 50,
  };

  it("declara com sucesso e invalida as pendentes", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(200, { ok: true })));

    const { Wrapper, client } = createWrapper();
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useDeclararPrestei(), { wrapper: Wrapper });

    result.current.mutate(payload);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["prestei", "pendentes"] });
  });

  it("rejeita com a mensagem de erro quando a API falha", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(422, { message: "Nota já declarada." })));

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useDeclararPrestei(), { wrapper: Wrapper });

    result.current.mutate(payload);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({ message: "Nota já declarada." });
  });
});

describe("useGerarGuiaPrestei", () => {
  it("gera a guia com sucesso e invalida as pendentes", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(200, { guiaId: "g1" })));

    const { Wrapper, client } = createWrapper();
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useGerarGuiaPrestei(), { wrapper: Wrapper });

    result.current.mutate({ notaIds: ["1"], dataVencimento: "2026-08-10" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["prestei", "pendentes"] });
  });
});
