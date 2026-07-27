import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("../i18n.js", () => ({ T: (es) => es, PICK: (o) => (o == null ? "" : o.es ?? "") }));
vi.mock("../data/course.js", () => ({
  Q: {
    v1: [
      { id: 1, q: "P1", o: { a: "A", b: "B", c: "C", d: "D" }, k: "a" },
      { id: 2, q: "P2", o: { a: "A", b: "B", c: "C", d: "D" }, k: "b" },
    ],
  },
}));

import EvalModal from "./EvalModal.jsx";

const vid = { id: "v1", o: 1, es: "Video 1" };

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
    await user.click(screen.getByRole("button", { name: /^A\. A/i }));
    await user.click(screen.getAllByRole("button", { name: /^B\. B/i })[0]);
    expect(enviar).toBeEnabled();
  });

  it("califica 10/10 y passed cuando todo es correcto", async () => {
    vi.useFakeTimers();
    const onResult = vi.fn();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<EvalModal secId="s" vid={vid} onResult={onResult} onClose={vi.fn()} />);
    // P1 correcta = a, P2 correcta = b
    await user.click(screen.getAllByRole("button", { name: /^A\./ })[0]);
    await user.click(screen.getAllByRole("button", { name: /^B\./ })[1]);
    await user.click(screen.getByRole("button", { name: /Enviar evaluación/i }));
    vi.advanceTimersByTime(700);
    expect(onResult).toHaveBeenCalledWith(
      expect.objectContaining({ score: 10, passed: true, correct: 2, total: 2 })
    );
    vi.useRealTimers();
  });

  it("califica 5/10 y NO passed con la mitad correctas", async () => {
    vi.useFakeTimers();
    const onResult = vi.fn();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<EvalModal secId="s" vid={vid} onResult={onResult} onClose={vi.fn()} />);
    await user.click(screen.getAllByRole("button", { name: /^A\./ })[0]); // P1 ok
    await user.click(screen.getAllByRole("button", { name: /^A\./ })[1]); // P2 mal (correcta b)
    await user.click(screen.getByRole("button", { name: /Enviar evaluación/i }));
    vi.advanceTimersByTime(700);
    expect(onResult).toHaveBeenCalledWith(
      expect.objectContaining({ score: 5, passed: false, correct: 1, total: 2 })
    );
    vi.useRealTimers();
  });
});
