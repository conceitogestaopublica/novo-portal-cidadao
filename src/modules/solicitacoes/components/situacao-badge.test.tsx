import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SituacaoBadge } from "./situacao-badge";

describe("SituacaoBadge", () => {
  it.each([
    ["ABERTA", "Aberta"],
    ["EM_ANDAMENTO", "Em andamento"],
    ["AGUARDANDO_VOCE", "Aguardando você"],
    ["DEFERIDA", "Deferida"],
    ["INDEFERIDA", "Indeferida"],
    ["CONCLUIDA", "Concluída"],
    ["CANCELADA", "Cancelada"],
  ])("traduz %s para o rótulo em português", (situacao, rotulo) => {
    render(<SituacaoBadge situacao={situacao} />);
    expect(screen.getByText(rotulo)).toBeInTheDocument();
  });

  it("cai no próprio valor cru quando a situação não é conhecida", () => {
    render(<SituacaoBadge situacao="ALGO_NOVO" />);
    expect(screen.getByText("ALGO_NOVO")).toBeInTheDocument();
  });
});
