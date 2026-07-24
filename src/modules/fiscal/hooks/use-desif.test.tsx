import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useDesifDeclaracoes, useDesifInstituicoes, useEncerrarDesif, useImportarDesif } from "./use-desif";

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

describe("useDesifInstituicoes", () => {
  it("busca as instituições financeiras do contribuinte logado", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(200, [{ id: "inst-1", cnpjBase: "12345678", razaoSocial: "Banco Demo" }]),
      ),
    );

    const { result } = renderHook(() => useDesifInstituicoes(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].razaoSocial).toBe("Banco Demo");
  });
});

describe("useDesifDeclaracoes", () => {
  it("não dispara a busca quando não há instituição selecionada", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useDesifDeclaracoes(""), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("busca as declarações da instituição selecionada", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(200, [
          {
            id: "decl-1",
            protocolo: "DESIF-1",
            modulo: "APURACAO_MENSAL",
            situacao: "VALIDADA",
            competenciaInicio: "202606",
            totalIssqnARecolher: 1000,
            qtdErros: 0,
            qtdAlertas: 0,
            importadaEm: "2026-06-01T00:00:00.000Z",
          },
        ]),
      ),
    );

    const { result } = renderHook(() => useDesifDeclaracoes("inst-1"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].situacao).toBe("VALIDADA");
  });
});

describe("useImportarDesif", () => {
  it("importa o arquivo com sucesso e invalida a lista de declarações", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(200, {
          declaracaoId: "decl-1",
          protocolo: "DESIF-1",
          situacao: "IMPORTADA",
          modulo: "APURACAO_MENSAL",
          competencia: "202607",
          totalIssqnARecolher: 0,
          qtdErros: 0,
          qtdAlertas: 0,
        }),
      ),
    );

    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");
    function localWrapper({ children }: { children: React.ReactNode }) {
      return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    }

    const { result } = renderHook(() => useImportarDesif("inst-1"), { wrapper: localWrapper });

    result.current.mutate({ conteudo: "linha 1", nomeArquivo: "desif.txt" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["desif", "declaracoes", "inst-1"] });
  });

  it("rejeita quando o arquivo é de outra instituição (422)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(422, { message: "Entity Validation Error", errors: { cnpj: "CNPJ do arquivo não corresponde a nenhuma instituição sua." } }),
      ),
    );

    const { result } = renderHook(() => useImportarDesif("inst-1"), { wrapper });

    result.current.mutate({ conteudo: "linha 1", nomeArquivo: "desif.txt" });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({
      message: "CNPJ do arquivo não corresponde a nenhuma instituição sua.",
      status: 422,
    });
  });
});

describe("useEncerrarDesif", () => {
  it("encerra a competência com sucesso e invalida a lista de declarações", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(200, { competencia: "202607", totalGuias: 1, valorTotal: 500, guias: [] }),
      ),
    );

    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");
    function localWrapper({ children }: { children: React.ReactNode }) {
      return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    }

    const { result } = renderHook(() => useEncerrarDesif("inst-1"), { wrapper: localWrapper });

    result.current.mutate({ declaracaoId: "decl-1", dataVencimento: "2026-08-10" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["desif", "declaracoes", "inst-1"] });
  });

  it("rejeita quando a competência já foi encerrada (409)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(409, { message: "Competência já encerrada." })),
    );

    const { result } = renderHook(() => useEncerrarDesif("inst-1"), { wrapper });

    result.current.mutate({ declaracaoId: "decl-1", dataVencimento: "2026-08-10" });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({
      message: "Competência já encerrada.",
      status: 409,
    });
  });
});
