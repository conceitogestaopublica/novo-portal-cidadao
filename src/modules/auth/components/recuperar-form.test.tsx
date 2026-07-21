import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders as render } from "@/test/render-with-providers";
import { RecuperarForm } from "./recuperar-form";

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("RecuperarForm", () => {
  it("mantém o botão desabilitado até o documento ter ao menos 11 dígitos", () => {
    render(<RecuperarForm />);
    const input = screen.getByPlaceholderText("000.000.000-00");
    const botao = screen.getByRole("button", { name: "Enviar link" });

    expect(botao).toBeDisabled();
    fireEvent.change(input, { target: { value: "123.456" } });
    expect(botao).toBeDisabled();

    fireEvent.change(input, { target: { value: "123.456.789-00" } });
    expect(botao).not.toBeDisabled();
  });

  it("mostra a tela de pedido recebido após o envio", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(200, { message: "Se houver uma conta com este documento, enviamos o link." }),
      ),
    );

    render(<RecuperarForm />);
    fireEvent.change(screen.getByPlaceholderText("000.000.000-00"), { target: { value: "123.456.789-00" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar link" }));

    await waitFor(() => {
      expect(screen.getByText("Pedido recebido")).toBeInTheDocument();
    });
    expect(screen.getByText("Se houver uma conta com este documento, enviamos o link.")).toBeInTheDocument();
  });

  it("exibe a mensagem de erro quando a API falha", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(500, { message: "Serviço indisponível." })));

    render(<RecuperarForm />);
    fireEvent.change(screen.getByPlaceholderText("000.000.000-00"), { target: { value: "123.456.789-00" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar link" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Serviço indisponível.");
    });
  });
});
