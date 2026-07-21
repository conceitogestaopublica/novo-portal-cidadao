import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders as render } from "@/test/render-with-providers";
import { EntrarForm } from "./entrar-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("EntrarForm", () => {
  it("renderiza o modo senha por padrão com os campos documento e senha", () => {
    render(<EntrarForm />);
    expect(screen.getByPlaceholderText("000.000.000-00")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("••••••")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument();
  });

  it("efetua login por senha com sucesso sem mostrar erro", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(200, { message: "ok" })));

    render(<EntrarForm />);
    fireEvent.change(screen.getByPlaceholderText("000.000.000-00"), { target: { value: "123.456.789-00" } });
    fireEvent.change(screen.getByPlaceholderText("••••••"), { target: { value: "senha123" } });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalled();
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("mostra a mensagem de erro da API quando o login por senha falha", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(401, { message: "Documento ou senha inválidos." })),
    );

    render(<EntrarForm />);
    fireEvent.change(screen.getByPlaceholderText("000.000.000-00"), { target: { value: "123.456.789-00" } });
    fireEvent.change(screen.getByPlaceholderText("••••••"), { target: { value: "senha-errada" } });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Documento ou senha inválidos.");
    });
  });

  it("troca para o modo OTP ao clicar em 'Entrar com código'", () => {
    render(<EntrarForm />);
    fireEvent.click(screen.getByRole("button", { name: "Entrar com código" }));

    expect(screen.getByPlaceholderText("000.000.000-00")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("••••••")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enviar código" })).toBeInTheDocument();
  });

  it("avança para a tela de código após enviar o documento no modo OTP", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(200, { challengeId: "abc", canalMascarado: "e***@x.com" }),
      ),
    );

    render(<EntrarForm />);
    fireEvent.click(screen.getByRole("button", { name: "Entrar com código" }));
    fireEvent.change(screen.getByPlaceholderText("000.000.000-00"), { target: { value: "123.456.789-00" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar código" }));

    await waitFor(() => {
      expect(
        screen.getByText((_, element) => element?.tagName === "P" && /Código enviado para/.test(element.textContent ?? "")),
      ).toBeInTheDocument();
    });
    expect(screen.getByText("e***@x.com")).toBeInTheDocument();
  });

  it("mostra mensagem de documento não encontrado quando a API retorna encontrado: false", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(200, { encontrado: false })));

    render(<EntrarForm />);
    fireEvent.click(screen.getByRole("button", { name: "Entrar com código" }));
    fireEvent.change(screen.getByPlaceholderText("000.000.000-00"), { target: { value: "123.456.789-00" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar código" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Documento não encontrado neste município.");
    });
    expect(
      screen.queryByText((_, element) => element?.tagName === "P" && /Código enviado para/.test(element.textContent ?? "")),
    ).not.toBeInTheDocument();
  });
});
