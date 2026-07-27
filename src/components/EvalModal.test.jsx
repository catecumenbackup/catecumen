import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("../i18n.js", () => ({ T: (es) => es, PICK: (o) => (o == null ? "" : o.es ?? "") }));
vi.mock("../data/course.js", () => ({
  Q: {
    v1: [
      { id: 1, q: "P1", o: { a: "Alfa", b: "Beta", c: "Gamma", d: "Delta" }, k: "a" },
      { id: 2, q: "P2", o: { a: "Uno", b: "Dos", c: "Tres", d: "Cuatro" }, k: "b" },
    ],
  },
}));

import EvalModal from "./EvalModal.jsx";

const vid = { id: "v1", o: 1, es: "Video 1" };
// Opciones únicas por su texto para poder seleccionarlas sin ambigüedad.
const opt = (name) => screen.getByRole("button", { name });

describe("EvalModal", () => {
  it("renderiza las preguntas del banco", () => {
    render(<EvalModal secId="s" vid={vid} onResult={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText(/P1/)).toBeInTheDocument();
    expect(screen.getByText(/P2/)).toBeInTheDocument();
  });

  it("el botón Enviar está deshabilitado hasta responder todo", async () => {
    const user = userEvent.setup();
    render(<EvalModal secId="s" vid={vid} onResult={vi.fn()} onClose={vi.fn()} />);
    const enviar = screen.getByRole("button", { name: /Enviar evaluación/i });
    expect(enviar).toBeDisabled();
    await user.click(opt(/Alfa/));   // P1
    expect(enviar).toBeDisabled();   // aún falta P2
    await user.click(opt(/Dos/));    // P2
    expect(enviar).toBeEnabled();
  });

  it("califica 10/10 y passed cuando todo es correcto", async () => {
    const onResult = vi.fn();
    const user = userEvent.setup();
    render(<EvalModal secId="s" vid={vid} onResult={onResult} onClose={vi.fn()} />);
    await user.click(opt(/Alfa/)); // P1 correcta = a
    await user.click(opt(/Dos/));  // P2 correcta = b
    await user.click(screen.getByRole("button", { name: /Enviar evaluación/i }));
    await waitFor(() =>
      expect(onResult).toHaveBeenCalledWith(
        expect.objectContaining({ score: 10, passed: true, correct: 2, total: 2 })
      )
    );
  });

  it("califica 5/10 y NO passed con la mitad correctas", async () => {
    const onResult = vi.fn();
    const user = userEvent.setup();
    render(<EvalModal secId="s" vid={vid} onResult={onResult} onClose={vi.fn()} />);
    await user.click(opt(/Alfa/)); // P1 correcta = a
    await user.click(opt(/Uno/));  // P2 = a, incorrecta (correcta b)
    await user.click(screen.getByRole("button", { name: /Enviar evaluación/i }));
    await waitFor(() =>
      expect(onResult).toHaveBeenCalledWith(
        expect.objectContaining({ score: 5, passed: false, correct: 1, total: 2 })
      )
    );
  });
});
