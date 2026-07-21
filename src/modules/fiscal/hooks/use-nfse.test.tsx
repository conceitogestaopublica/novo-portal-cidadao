import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useEmitirNfse, useNfseItensServico } from "./use-nfse";

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

describe("useNfseItensServico", () => {
  it("busca os itens de serviço de um económico com sucesso", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(200, [{ id: "vinc-1", itemServicoId: "item-1", codigo: "1.01", descricao: "Análise de dados" }]),
      ),
    );

    const { result } = renderHook(() => useNfseItensServico("econ-1"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].itemServicoId).toBe("item-1");
  });

  it("não dispara a busca quando o economicoId está vazio", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useNfseItensServico(""), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("useEmitirNfse", () => {
  const payload = {
    economicoId: "econ-1",
    itemServicoId: "item-1",
    discriminacao: "Serviço de consultoria",
    valorServicos: 1500,
    issRetido: false,
    tomador: { nome: "Cliente Teste", documento: "12345678900" },
  };

  it("emite a NFS-e com sucesso e invalida as notas do económico", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(200, { numero: 1, serie: "A1", codigoVerificacao: "ABC123", valorIss: 75 })),
    );

    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");
    function localWrapper({ children }: { children: React.ReactNode }) {
      return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    }

    const { result } = renderHook(() => useEmitirNfse(), { wrapper: localWrapper });

    result.current.mutate(payload);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ numero: 1, serie: "A1", codigoVerificacao: "ABC123", valorIss: 75 });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["nfse", "notas", "econ-1"] });
  });

  it("rejeita com a mensagem de validação quando a API retorna 422", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(422, {
          message: "Entity Validation Error",
          errors: { valorServicos: { min: "Valor dos serviços deve ser maior que zero." } },
        }),
      ),
    );

    const { result } = renderHook(() => useEmitirNfse(), { wrapper });

    result.current.mutate({ ...payload, valorServicos: 0 });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({
      message: "Valor dos serviços deve ser maior que zero.",
      status: 422,
    });
  });
});
