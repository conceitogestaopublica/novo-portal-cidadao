import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, isSessaoExpirada } from "./http-client";
import { postJson, requestJsonOrError, requestNoContentOrError } from "./client-api";

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("requestJsonOrError", () => {
  it("retorna o payload quando a resposta é ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(200, { id: "1" })));
    const data = await requestJsonOrError<{ id: string }>("/api/x");
    expect(data).toEqual({ id: "1" });
  });

  it("lança ApiError com a mensagem simples quando não há erros por campo", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(400, { message: "Documento inválido." })));
    await expect(requestJsonOrError("/api/x")).rejects.toMatchObject({
      message: "Documento inválido.",
      status: 400,
    });
  });

  it("prefere as mensagens de erro por campo (422) sobre a message genérica", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(422, {
          message: "Entity Validation Error",
          errors: { competencia: { obrigatorio: "Competência é obrigatória." } },
        }),
      ),
    );
    await expect(requestJsonOrError("/api/x")).rejects.toMatchObject({
      message: "Competência é obrigatória.",
      status: 422,
    });
  });

  it("marca erro 401 como sessão expirada", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(401, { message: "Não autenticado" })));
    try {
      await requestJsonOrError("/api/x");
      throw new Error("deveria ter lançado");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect(isSessaoExpirada(err)).toBe(true);
    }
  });
});

describe("requestNoContentOrError", () => {
  it("não lança quando a resposta é ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    await expect(requestNoContentOrError("/api/x", { method: "DELETE" })).resolves.toBeUndefined();
  });
});

describe("postJson", () => {
  it("envia o corpo como JSON com o content-type correto", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await postJson("/api/x", { a: 1 });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/x",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ a: 1 }),
      }),
    );
  });
});
