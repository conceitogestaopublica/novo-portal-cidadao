import { describe, expect, it } from "vitest";
import { normalizarTexto, slugify } from "@/shared/lib/slugify";

describe("normalizarTexto", () => {
  it("iguala termo com e sem acento — o cidadão digita sem", () => {
    expect(normalizarTexto("certidao")).toBe(normalizarTexto("Certidão"));
    expect(normalizarTexto("debito")).toBe(normalizarTexto("Débito"));
    expect(normalizarTexto("competencia")).toBe(normalizarTexto("Competência"));
  });

  it("preserva espaços e pontuação (não é slug)", () => {
    expect(normalizarTexto("2ª via de guias (IPTU)")).toBe("2ª via de guias (iptu)");
  });
});

describe("slugify", () => {
  it("remove acentos e espaços, minúsculas com hífen", () => {
    expect(slugify("Atendimento ao Contribuinte")).toBe("atendimento-ao-contribuinte");
    expect(slugify("Certidão Negativa (CND)")).toBe("certidao-negativa-cnd");
  });

  it("remove hífens nas pontas", () => {
    expect(slugify(" -Serviço- ")).toBe("servico");
  });
});
