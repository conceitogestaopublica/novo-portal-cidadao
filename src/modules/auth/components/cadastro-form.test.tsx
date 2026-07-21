import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders as render } from "@/test/render-with-providers";
import { CadastroForm } from "./cadastro-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

/** Campo "Confirmar" não tem placeholder — só é identificável pelo atributo name (senha2). */
function getConfirmarInput(container: HTMLElement) {
  const input = container.querySelector('input[name="senha2"]');
  if (!input) throw new Error("Campo senha2 não encontrado");
  return input as HTMLInputElement;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("CadastroForm", () => {
  it("renderiza todos os campos do cadastro", () => {
    render(<CadastroForm />);
    expect(screen.getByPlaceholderText("000.000.000-00")).toBeInTheDocument();
    expect(screen.getByText("Nome completo")).toBeInTheDocument();
    expect(screen.getByText("E-mail (opcional)")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("mín. 6")).toBeInTheDocument();
    expect(screen.getByText("Confirmar")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Criar conta" })).toBeInTheDocument();
  });

  it("mostra erro de validação quando as senhas não conferem, sem chamar a API", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { container } = render(<CadastroForm />);
    fireEvent.change(screen.getByPlaceholderText("000.000.000-00"), { target: { value: "123.456.789-00" } });
    const [, nomeInput] = screen.getAllByRole("textbox");
    fireEvent.change(nomeInput, { target: { value: "Fulano" } });
    fireEvent.change(screen.getByPlaceholderText("mín. 6"), { target: { value: "senha123" } });
    fireEvent.change(getConfirmarInput(container), { target: { value: "senha456" } });
    fireEvent.click(screen.getByRole("button", { name: "Criar conta" }));

    await waitFor(() => {
      expect(screen.getByText("As senhas não conferem.")).toBeInTheDocument();
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("cadastra com sucesso e redireciona", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(200, { message: "ok" })));

    const { container } = render(<CadastroForm />);
    fireEvent.change(screen.getByPlaceholderText("000.000.000-00"), { target: { value: "123.456.789-00" } });
    const [, nomeInput] = screen.getAllByRole("textbox");
    fireEvent.change(nomeInput, { target: { value: "Fulano de Tal" } });
    fireEvent.change(screen.getByPlaceholderText("mín. 6"), { target: { value: "senha123" } });
    fireEvent.change(getConfirmarInput(container), { target: { value: "senha123" } });
    fireEvent.click(screen.getByRole("button", { name: "Criar conta" }));

    await waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalled();
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("mostra a mensagem de erro da API quando o documento já está cadastrado", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(409, { message: "Já existe uma conta com este documento. Faça login." }),
      ),
    );

    const { container } = render(<CadastroForm />);
    fireEvent.change(screen.getByPlaceholderText("000.000.000-00"), { target: { value: "123.456.789-00" } });
    const [, nomeInput] = screen.getAllByRole("textbox");
    fireEvent.change(nomeInput, { target: { value: "Fulano de Tal" } });
    fireEvent.change(screen.getByPlaceholderText("mín. 6"), { target: { value: "senha123" } });
    fireEvent.change(getConfirmarInput(container), { target: { value: "senha123" } });
    fireEvent.click(screen.getByRole("button", { name: "Criar conta" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Já existe uma conta com este documento. Faça login.");
    });
  });
});
