import { describe, expect, it } from "vitest";
import { ambienteSchema, categoriaSchema, servicoSchema, servicoFormSchema } from "./catalogo-admin.schema";

describe("ambienteSchema", () => {
  it("aceita só o nome e aplica os defaults", () => {
    const r = ambienteSchema.safeParse({ nome: "Tributário" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.sistema).toBe("ged");
      expect(r.data.disponivel).toBe(true);
      expect(r.data.icone).toBe("fas fa-folder-open");
    }
  });

  it("rejeita nome vazio", () => {
    const r = ambienteSchema.safeParse({ nome: "" });
    expect(r.success).toBe(false);
  });

  it("rejeita sistema fora do enum", () => {
    const r = ambienteSchema.safeParse({ nome: "X", sistema: "outro" });
    expect(r.success).toBe(false);
  });
});

describe("categoriaSchema", () => {
  it("aceita nome + ambienteSlug e aplica defaults", () => {
    const r = categoriaSchema.safeParse({ nome: "Alvarás", ambienteSlug: "tributario" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.cor).toBe("blue");
  });

  it("rejeita sem ambienteSlug", () => {
    const r = categoriaSchema.safeParse({ nome: "Alvarás" });
    expect(r.success).toBe(false);
  });

  it("rejeita ambienteSlug vazio", () => {
    const r = categoriaSchema.safeParse({ nome: "Alvarás", ambienteSlug: "" });
    expect(r.success).toBe(false);
  });
});

describe("servicoSchema", () => {
  const base = { titulo: "Emitir alvará", categoriaSlug: "alvaras" };

  it("aceita o mínimo e aplica defaults", () => {
    const r = servicoSchema.safeParse(base);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.publico_alvo).toBe("cidadao");
      expect(r.data.tipo_fluxo).toBe("processo_ged");
      expect(r.data.publicado).toBe(true);
    }
  });

  it("rejeita sem categoriaSlug", () => {
    const r = servicoSchema.safeParse({ titulo: "Emitir alvará" });
    expect(r.success).toBe(false);
  });

  it("rejeita título vazio", () => {
    const r = servicoSchema.safeParse({ ...base, titulo: "" });
    expect(r.success).toBe(false);
  });

  it("rejeita fiscal_acao fora do enum", () => {
    const r = servicoSchema.safeParse({ ...base, fiscal_acao: "inexistente" });
    expect(r.success).toBe(false);
  });

  it("aceita fiscal_acao nulo", () => {
    const r = servicoSchema.safeParse({ ...base, fiscal_acao: null });
    expect(r.success).toBe(true);
  });
});

describe("servicoFormSchema", () => {
  it("troca palavras_chave (array) por palavras (texto) e aplica default vazio", () => {
    const r = servicoFormSchema.safeParse({ titulo: "Emitir alvará", categoriaSlug: "alvaras" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.palavras).toBe("");
      expect((r.data as Record<string, unknown>).palavras_chave).toBeUndefined();
    }
  });

  it("aceita palavras como string separada por vírgula", () => {
    const r = servicoFormSchema.safeParse({ titulo: "Emitir alvará", categoriaSlug: "alvaras", palavras: "alvará, funcionamento" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.palavras).toBe("alvará, funcionamento");
  });
});
