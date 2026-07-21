import { describe, expect, it } from "vitest";
import { escriturarItemFormSchema } from "./dms.schema";

describe("escriturarItemFormSchema", () => {
  it("aceita um item válido", () => {
    const r = escriturarItemFormSchema.safeParse({
      itemServicoId: "abc-123",
      base: "1500,50",
      retido: false,
      tomadorDoc: "",
    });
    expect(r.success).toBe(true);
  });

  it("rejeita sem serviço selecionado", () => {
    const r = escriturarItemFormSchema.safeParse({ itemServicoId: "", base: "100", retido: false });
    expect(r.success).toBe(false);
  });

  it("rejeita valor zero ou negativo", () => {
    expect(escriturarItemFormSchema.safeParse({ itemServicoId: "x", base: "0" }).success).toBe(false);
    expect(escriturarItemFormSchema.safeParse({ itemServicoId: "x", base: "-10" }).success).toBe(false);
  });

  it("rejeita valor vazio", () => {
    const r = escriturarItemFormSchema.safeParse({ itemServicoId: "x", base: "" });
    expect(r.success).toBe(false);
  });
});
