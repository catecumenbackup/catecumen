import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";

// SEC_META de prueba con un marcador de cada tipo.
vi.mock("../data/course.js", () => ({
  SEC_META: {
    primera_comunion: { icon: "__caliz__" },
    kerigma: { icon: "__flame__" },
    bautismo: { icon: "__bautismo_img__" },
    confirmacion: { icon: "__confirmacion_img__" },
    catequista: { icon: "🧠" },
  },
}));
vi.mock("./icons.jsx", () => ({
  FlameIcon: () => <svg data-testid="flame" />,
  CalizIcon: () => <svg data-testid="caliz" />,
  iconoBautismo: "/bautismo.svg",
  iconoConfirmacion: "/confirmacion.svg",
}));

import SecIcon from "./SecIcon.jsx";

describe("SecIcon", () => {
  it("marcador __caliz__ → CalizIcon", () => {
    const { getByTestId } = render(<SecIcon id="primera_comunion" />);
    expect(getByTestId("caliz")).toBeInTheDocument();
  });
  it("marcador __flame__ → FlameIcon", () => {
    const { getByTestId } = render(<SecIcon id="kerigma" />);
    expect(getByTestId("flame")).toBeInTheDocument();
  });
  it("marcador de imagen → <img> con la ruta del icono", () => {
    const { container } = render(<SecIcon id="bautismo" />);
    const img = container.querySelector("img");
    expect(img).toBeTruthy();
    expect(img.getAttribute("src")).toBe("/bautismo.svg");
  });
  it("emoji → se renderiza como texto", () => {
    const { container } = render(<SecIcon id="catequista" />);
    expect(container.textContent).toContain("🧠");
  });
});
