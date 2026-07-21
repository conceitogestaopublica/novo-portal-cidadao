import { describe, expect, it } from "vitest";
import { slugify } from "@/shared/lib/slugify";

describe("slugify", () => {
  it("remove acentos e espaços, minúsculas com hífen", () => {
    expect(slugify("Atendimento ao Contribuinte")).toBe("atendimento-ao-contribuinte");
    expect(slugify("Certidão Negativa (CND)")).toBe("certidao-negativa-cnd");
  });

  it("remove hífens nas pontas", () => {
    expect(slugify(" -Serviço- ")).toBe("servico");
  });
});
