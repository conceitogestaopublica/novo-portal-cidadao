import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders as render } from "@/test/render-with-providers";
import { SolicitarForm } from "./solicitar-form";

const pushMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: vi.fn() }),
}));

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

afterEach(() => {
  vi.unstubAllGlobals();
  pushMock.mockClear();
});

function preencherFormulario() {
  fireEvent.change(screen.getByPlaceholderText("para retorno"), { target: { value: "contato@exemplo.com" } });
  fireEvent.change(screen.getByPlaceholderText("Detalhe o que você precisa…"), {
    target: { value: "Preciso de uma segunda via." },
  });
}

describe("SolicitarForm", () => {
  it("renderiza os campos Contato e Descreva sua solicitação", () => {
    render(<SolicitarForm slug="servico-x" nome="Fulano" />);

    expect(screen.getByText("Contato (e-mail ou telefone)")).toBeInTheDocument();
    expect(screen.getByText("Descreva sua solicitação")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enviar solicitação" })).toBeInTheDocument();
  });

  it("mostra a tela de sucesso com o protocolo após o envio", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(200, { solicitacao: { protocolo: "SOL20260101-123456" } })),
    );

    render(<SolicitarForm slug="servico-x" nome="Fulano" />);
    preencherFormulario();
    fireEvent.click(screen.getByRole("button", { name: "Enviar solicitação" }));

    await waitFor(() => {
      expect(screen.getByText("Solicitação registrada!")).toBeInTheDocument();
    });
    expect(screen.getByText("SOL20260101-123456")).toBeInTheDocument();
  });

  it("redireciona para /entrar quando a API retorna 401", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(401, { message: "Não autorizado" })));

    render(<SolicitarForm slug="servico-x" nome="Fulano" />);
    preencherFormulario();
    fireEvent.click(screen.getByRole("button", { name: "Enviar solicitação" }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/entrar");
    });
    expect(screen.queryByText("Solicitação registrada!")).not.toBeInTheDocument();
  });

  it("mostra a mensagem de erro sem redirecionar quando a API falha com outro status", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(500, { message: "Serviço indisponível." })));

    render(<SolicitarForm slug="servico-x" nome="Fulano" />);
    preencherFormulario();
    fireEvent.click(screen.getByRole("button", { name: "Enviar solicitação" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Serviço indisponível.");
    });
    expect(pushMock).not.toHaveBeenCalled();
  });
});
