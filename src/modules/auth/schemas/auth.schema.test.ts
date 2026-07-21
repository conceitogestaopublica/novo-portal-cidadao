import { describe, expect, it } from "vitest";
import { cadastroFormSchema, redefinirFormSchema } from "./auth.schema";

describe("cadastroFormSchema", () => {
  const base = { documento: "12345678901", nome: "Fulano de Tal", senha: "123456" };

  it("aceita quando as senhas conferem", () => {
    const r = cadastroFormSchema.safeParse({ ...base, senha2: "123456" });
    expect(r.success).toBe(true);
  });

  it("rejeita quando as senhas não conferem", () => {
    const r = cadastroFormSchema.safeParse({ ...base, senha2: "654321" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0]?.path).toEqual(["senha2"]);
      expect(r.error.issues[0]?.message).toBe("As senhas não conferem.");
    }
  });
});

describe("redefinirFormSchema", () => {
  const base = { token: "0123456789", senha: "123456" };

  it("aceita quando as senhas conferem", () => {
    expect(redefinirFormSchema.safeParse({ ...base, senha2: "123456" }).success).toBe(true);
  });

  it("rejeita quando as senhas não conferem", () => {
    const r = redefinirFormSchema.safeParse({ ...base, senha2: "abcdef" });
    expect(r.success).toBe(false);
  });
});
