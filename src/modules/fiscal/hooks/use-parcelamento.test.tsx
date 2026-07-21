import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAderirParcelamento, useDebitosParcelamento, useSimularParcelamento } from "./use-parcelamento";

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

describe("useDebitosParcelamento", () => {
  it("busca os débitos parcelaveis de um programa", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(200, {
          debitos: [
            { inscricaoId: "1", numero: "123", saldoAtualizado: 1000, elegivel: true },
          ],
        }),
      ),
    );

    const { result } = renderHook(() => useDebitosParcelamento("programa-1"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.debitos).toHaveLength(1);
    expect(result.current.data?.debitos[0].numero).toBe("123");
  });

  it("não dispara a busca quando o programaId está vazio", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useDebitosParcelamento(""), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("useSimularParcelamento", () => {
  it("simula o parcelamento com sucesso", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(200, {
          parametroNome: "REFIS",
          valorConsolidado: 1000,
          valorTotal: 1200,
          qtdParcelas: 12,
          parcelas: [{ numero: 1, dataVencimento: "2026-08-10", valor: 100 }],
        }),
      ),
    );

    const { result } = renderHook(() => useSimularParcelamento(), { wrapper });

    result.current.mutate({ parametroId: "p1", inscricaoIds: ["i1"], qtdParcelas: 12 });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.valorTotal).toBe(1200);
    expect(result.current.data?.parcelas).toHaveLength(1);
  });

  it("rejeita com a mensagem de validação quando a API retorna 422", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(422, {
          message: "Entity Validation Error",
          errors: { qtdParcelas: { max: "Quantidade de parcelas excede o máximo permitido." } },
        }),
      ),
    );

    const { result } = renderHook(() => useSimularParcelamento(), { wrapper });

    result.current.mutate({ parametroId: "p1", inscricaoIds: ["i1"], qtdParcelas: 999 });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({
      message: "Quantidade de parcelas excede o máximo permitido.",
      status: 422,
    });
  });
});

describe("useAderirParcelamento", () => {
  it("adere ao parcelamento com sucesso", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(200, { id: "parc-1", numero: "2026/001", valorTotal: 1200 })),
    );

    const { result } = renderHook(() => useAderirParcelamento(), { wrapper });

    result.current.mutate({ parametroId: "p1", inscricaoIds: ["i1"], qtdParcelas: 12 });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ id: "parc-1", numero: "2026/001", valorTotal: 1200 });
  });

  it("rejeita quando a API recusa a adesão", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(400, { message: "Débito não é mais elegível para parcelamento." })),
    );

    const { result } = renderHook(() => useAderirParcelamento(), { wrapper });

    result.current.mutate({ parametroId: "p1", inscricaoIds: ["i1"], qtdParcelas: 12 });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({
      message: "Débito não é mais elegível para parcelamento.",
      status: 400,
    });
  });
});
