import { describe, expect, it } from "vitest";
import { declararPresteiFormSchema } from "./prestei.schema";

const valido = {
  tomadorDocumento: "12345678900",
  tomadorNome: "Fulano",
  numeroNota: "123",
  competencia: "2026-07",
  dataEmissao: "2026-07-24",
  discriminacao: "Serviço de consultoria",
  valorServicos: "1500,00",
  valorIss: "75,00",
};

describe("declararPresteiFormSchema", () => {
  it("aceita um caso válido", () => {
    expect(declararPresteiFormSchema.safeParse(valido).success).toBe(true);
  });

  it("rejeita CPF/CNPJ curto demais", () => {
    const r = declararPresteiFormSchema.safeParse({ ...valido, tomadorDocumento: "123" });
    expect(r.success).toBe(false);
  });

  it("rejeita competência fora do formato AAAA-MM", () => {
    const r = declararPresteiFormSchema.safeParse({ ...valido, competencia: "07/2026" });
    expect(r.success).toBe(false);
  });

  it("rejeita data de emissão fora do formato AAAA-MM-DD", () => {
    const r = declararPresteiFormSchema.safeParse({ ...valido, dataEmissao: "24/07/2026" });
    expect(r.success).toBe(false);
  });

  it("rejeita valor de serviço zero ou negativo", () => {
    expect(declararPresteiFormSchema.safeParse({ ...valido, valorServicos: "0" }).success).toBe(false);
    expect(declararPresteiFormSchema.safeParse({ ...valido, valorServicos: "-10" }).success).toBe(false);
  });

  it("aceita valor de ISS zero (nota isenta)", () => {
    expect(declararPresteiFormSchema.safeParse({ ...valido, valorIss: "0" }).success).toBe(true);
  });

  it("rejeita valor não-numérico", () => {
    expect(declararPresteiFormSchema.safeParse({ ...valido, valorServicos: "abc" }).success).toBe(false);
  });

  it("tomadorNome e discriminacao são opcionais (default vazio)", () => {
    const resto: Record<string, unknown> = { ...valido };
    delete resto.tomadorNome;
    delete resto.discriminacao;
    const r = declararPresteiFormSchema.safeParse(resto);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.tomadorNome).toBe("");
      expect(r.data.discriminacao).toBe("");
    }
  });
});
