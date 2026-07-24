import { describe, expect, it } from "vitest";
import { enviarDesifFormSchema, encerrarDesifFormSchema } from "./desif.schema";

describe("enviarDesifFormSchema", () => {
  it("aceita um conteúdo válido e assume o nome de arquivo padrão", () => {
    const r = enviarDesifFormSchema.safeParse({ conteudo: "linha 1\nlinha 2" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.nomeArquivo).toBe("desif.txt");
  });

  it("aceita um nome de arquivo explícito", () => {
    const r = enviarDesifFormSchema.safeParse({ conteudo: "abc", nomeArquivo: "202607.txt" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.nomeArquivo).toBe("202607.txt");
  });

  it("rejeita conteúdo vazio", () => {
    const r = enviarDesifFormSchema.safeParse({ conteudo: "" });
    expect(r.success).toBe(false);
  });
});

describe("encerrarDesifFormSchema", () => {
  it("aceita uma data de vencimento válida", () => {
    const r = encerrarDesifFormSchema.safeParse({ dataVencimento: "2026-08-10" });
    expect(r.success).toBe(true);
  });

  it("rejeita vencimento vazio", () => {
    const r = encerrarDesifFormSchema.safeParse({ dataVencimento: "" });
    expect(r.success).toBe(false);
  });
});
