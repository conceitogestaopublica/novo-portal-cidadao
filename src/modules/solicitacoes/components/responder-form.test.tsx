import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders as render } from "@/test/render-with-providers";
import { ResponderForm } from "./responder-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ResponderForm", () => {
  it("renderiza o textarea com o botão desabilitado quando o texto está vazio", () => {
    render(<ResponderForm id="sol-1" />);

    expect(screen.getByPlaceholderText("Escreva aqui as informações solicitadas…")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enviar resposta" })).toBeDisabled();
  });

  it("habilita o botão ao digitar e limpa o campo após o envio com sucesso", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(200, { ok: true })));

    render(<ResponderForm id="sol-1" />);
    const textarea = screen.getByPlaceholderText("Escreva aqui as informações solicitadas…");

    fireEvent.change(textarea, { target: { value: "Segue a informação solicitada." } });
    expect(screen.getByRole("button", { name: "Enviar resposta" })).not.toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Enviar resposta" }));

    await waitFor(() => {
      expect(textarea).toHaveValue("");
    });
  });

  it("mostra a mensagem de erro da API quando o envio falha", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(500, { message: "Não foi possível enviar sua resposta." })),
    );

    render(<ResponderForm id="sol-1" />);
    const textarea = screen.getByPlaceholderText("Escreva aqui as informações solicitadas…");

    fireEvent.change(textarea, { target: { value: "Segue a informação solicitada." } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar resposta" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível enviar sua resposta.");
    });
  });
});
