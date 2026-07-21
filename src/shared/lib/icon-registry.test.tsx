import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CatalogoIcon } from "./icon-registry";

describe("CatalogoIcon", () => {
  it("resolve um ícone Font Awesome legado conhecido", () => {
    const { container } = render(<CatalogoIcon nome="fas fa-hand-holding-dollar" />);
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("cai no ícone genérico quando o nome não está mapeado", () => {
    const { container } = render(<CatalogoIcon nome="fas fa-inexistente-xyz" />);
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("cai no ícone genérico quando não há nome", () => {
    const { container } = render(<CatalogoIcon nome={null} />);
    expect(container.querySelector("svg")).toBeTruthy();
  });
});
