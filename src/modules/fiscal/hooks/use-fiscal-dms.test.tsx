import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useDmsLista, useEntregarDms } from "./use-fiscal-dms";

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useDmsLista", () => {
  it("busca a lista de DMS de um económico com sucesso", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(200, [
          {
            id: "dms-1",
            competenciaAno: 2026,
            competenciaMes: 6,
            situacao: "aberta",
            dataEntrega: null,
            totalBase: 1000,
            totalIss: 50,
          },
        ]),
      ),
    );

    const { result } = renderHook(() => useDmsLista("econ-1"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].situacao).toBe("aberta");
  });

  it("não dispara a busca quando o economicoId está vazio", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useDmsLista(""), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("useEntregarDms", () => {
  it("entrega a DMS com sucesso e invalida a lista e o detalhe", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(200, { id: "dms-1" })));

    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");
    function localWrapper({ children }: { children: React.ReactNode }) {
      return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    }

    const { result } = renderHook(() => useEntregarDms("econ-1", "dms-1"), { wrapper: localWrapper });

    result.current.mutate({ dataVencimento: "2026-08-10" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["dms", "lista", "econ-1"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["dms", "detalhe", "dms-1"] });
  });

  it("rejeita quando a DMS já foi entregue (409)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(409, { message: "DMS já entregue para esta competência." })),
    );

    const { result } = renderHook(() => useEntregarDms("econ-1", "dms-1"), { wrapper });

    result.current.mutate({ dataVencimento: "2026-08-10" });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({
      message: "DMS já entregue para esta competência.",
      status: 409,
    });
  });
});
