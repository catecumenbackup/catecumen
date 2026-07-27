import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("../i18n.js", () => ({ T: (es) => es, PICK: (o) => (o == null ? "" : o.es ?? "") }));
vi.mock("./icons.jsx", () => ({
  FlameIcon: () => <span />, CalizIcon: () => <span />,
  iconoBautismo: "/b.svg", iconoConfirmacion: "/c.svg",
}));
const etq = { current: {} };
vi.mock("../hooks/useEtiquetasOpciones.js", () => ({ default: () => etq.current }));

import SacSelectModal from "./SacSelectModal.jsx";

describe("SacSelectModal", () => {
  it("Continuar deshabilitado hasta seleccionar y devuelve lo elegido", async () => {
    etq.current = {};
    const user = userEvent.setup();
    const onContinue = vi.fn();
    render(<SacSelectModal onContinue={onContinue} onBack={vi.fn()} />);
    const cont = screen.getByRole("button", { name: /Continuar/i });
    expect(cont).toBeDisabled();
    await user.click(screen.getByRole("button", { name: /Bautismo/i }));
    await user.click(screen.getByRole("button", { name: /Confirmación/i }));
    expect(cont).toBeEnabled();
    await user.click(cont);
    expect(onContinue).toHaveBeenCalledWith(["bautismo", "confirmacion"]);
  });

  it("permite deseleccionar (toggle)", async () => {
    etq.current = {};
    const user = userEvent.setup();
    const onContinue = vi.fn();
    render(<SacSelectModal onContinue={onContinue} onBack={vi.fn()} />);
    const bau = screen.getByRole("button", { name: /Bautismo/i });
    await user.click(bau);
    await user.click(bau); // toggle off
    expect(screen.getByRole("button", { name: /Continuar/i })).toBeDisabled();
  });

  it("una etiqueta activa inhabilita el sacramento", () => {
    etq.current = { primera_comunion: { txt: "Próximamente", bg: "#B3261E", fg: "#E5C97A" } };
    render(<SacSelectModal onContinue={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText("Próximamente")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Primera Comunión/i })).toBeDisabled();
  });

  it("Regresar llama onBack", async () => {
    etq.current = {};
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(<SacSelectModal onContinue={vi.fn()} onBack={onBack} />);
    await user.click(screen.getByRole("button", { name: /Regresar/i }));
    expect(onBack).toHaveBeenCalled();
  });
});
