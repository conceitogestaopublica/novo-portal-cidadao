import { describe, expect, it } from "vitest";
import { adminLoginSchema } from "./admin-login.schema";

describe("adminLoginSchema", () => {
  it("aceita e-mail e senha válidos", () => {
    const r = adminLoginSchema.safeParse({ email: "admin@municipio.gov.br", senha: "123456" });
    expect(r.success).toBe(true);
  });

  it("rejeita e-mail inválido", () => {
    const r = adminLoginSchema.safeParse({ email: "não-é-email", senha: "123456" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0]?.path).toEqual(["email"]);
  });

  it("rejeita e-mail vazio", () => {
    const r = adminLoginSchema.safeParse({ email: "", senha: "123456" });
    expect(r.success).toBe(false);
  });

  it("rejeita senha vazia", () => {
    const r = adminLoginSchema.safeParse({ email: "admin@municipio.gov.br", senha: "" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0]?.path).toEqual(["senha"]);
  });
});
