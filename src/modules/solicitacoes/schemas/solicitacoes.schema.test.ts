import { describe, expect, it } from "vitest";
import { criarSolicitacaoSchema, responderSolicitacaoSchema } from "./solicitacoes.schema";

describe("criarSolicitacaoSchema", () => {
  it("aceita apenas o slug do serviço, sem mensagem/contato", () => {
    const r = criarSolicitacaoSchema.safeParse({ servicoSlug: "alvara-funcionamento" });
    expect(r.success).toBe(true);
  });

  it("aceita mensagem e contato vazios (string vazia)", () => {
    const r = criarSolicitacaoSchema.safeParse({ servicoSlug: "alvara-funcionamento", mensagem: "", contato: "" });
    expect(r.success).toBe(true);
  });

  it("rejeita slug vazio", () => {
    const r = criarSolicitacaoSchema.safeParse({ servicoSlug: "" });
    expect(r.success).toBe(false);
  });

  it("rejeita mensagem acima de 4000 caracteres", () => {
    const r = criarSolicitacaoSchema.safeParse({ servicoSlug: "x", mensagem: "a".repeat(4001) });
    expect(r.success).toBe(false);
  });
});

describe("responderSolicitacaoSchema", () => {
  it("aceita um texto não vazio", () => {
    const r = responderSolicitacaoSchema.safeParse({ texto: "Segue anexado o comprovante." });
    expect(r.success).toBe(true);
  });

  it("rejeita texto vazio", () => {
    const r = responderSolicitacaoSchema.safeParse({ texto: "" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0]?.message).toBe("Escreva sua resposta.");
  });

  it("rejeita texto acima de 4000 caracteres", () => {
    const r = responderSolicitacaoSchema.safeParse({ texto: "a".repeat(4001) });
    expect(r.success).toBe(false);
  });
});
