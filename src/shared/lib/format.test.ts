import { describe, expect, it } from "vitest";
import { dateBR, money } from "./format";

// Intl.NumberFormat("pt-BR", { style: "currency", ... }) usa NBSP (U+00A0)
// entre "R$" e o valor, não espaço comum — normaliza antes de comparar pra não
// depender de qual espaço foi digitado no literal.
const NBSP = " ";
function semNbsp(s: string): string {
  return s.split(NBSP).join(" ");
}

describe("money", () => {
  it("formata número válido em BRL", () => {
    expect(semNbsp(money(1234.5))).toBe("R$ 1.234,50");
  });

  it("aceita string numérica", () => {
    expect(semNbsp(money("180.5"))).toBe("R$ 180,50");
  });

  it("devolve travessão para valor não-numérico", () => {
    expect(money("abc")).toBe("—");
    expect(money(undefined)).toBe("—");
  });

  // Number(null) === 0 (comportamento do JS, preservado do código original) —
  // money(null) não é "inválido", vira zero.
  it("trata null como zero (herdado do comportamento original)", () => {
    expect(semNbsp(money(null))).toBe("R$ 0,00");
  });
});

describe("dateBR", () => {
  it("formata data ISO (data pura) sem deslocar pelo fuso do navegador", () => {
    expect(dateBR("2026-08-23")).toBe("23/08/2026");
    expect(dateBR("2026-08-23T00:00:00.000Z")).toBe("23/08/2026");
  });

  it("devolve travessão para valor ausente", () => {
    expect(dateBR(null)).toBe("—");
    expect(dateBR(undefined)).toBe("—");
    expect(dateBR("")).toBe("—");
  });

  it("devolve a string original para valor que não é data", () => {
    expect(dateBR("não é data")).toBe("não é data");
  });
});
