import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useLoginSenha, useLoginStart, useLoginVerify } from "./use-login";

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

describe("useLoginSenha", () => {
  it("faz login com documento e senha com sucesso", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useLoginSenha(), { wrapper });

    result.current.mutate({ documento: "12345678900", senha: "123456" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/login-senha",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("rejeita com a mensagem de erro (credenciais inválidas)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(401, { message: "Documento ou senha inválidos." })));

    const { result } = renderHook(() => useLoginSenha(), { wrapper });

    result.current.mutate({ documento: "12345678900", senha: "errada" });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({ message: "Documento ou senha inválidos.", status: 401 });
  });
});

describe("useLoginStart", () => {
  it("inicia o desafio OTP com sucesso", async () => {
    const resposta = { challengeId: "ch-1", canalMascarado: "e***@teste.com" };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(200, resposta)));

    const { result } = renderHook(() => useLoginStart(), { wrapper });

    result.current.mutate({ documento: "12345678900" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(resposta);
  });
});

describe("useLoginVerify", () => {
  it("valida o OTP com sucesso", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(200, { ok: true })));

    const { result } = renderHook(() => useLoginVerify(), { wrapper });

    result.current.mutate({ challengeId: "ch-1", otp: "123456" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("rejeita quando o OTP está incorreto", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(400, { message: "Código incorreto." })));

    const { result } = renderHook(() => useLoginVerify(), { wrapper });

    result.current.mutate({ challengeId: "ch-1", otp: "000000" });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({ message: "Código incorreto." });
  });
});
