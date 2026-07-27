import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("../i18n.js", () => ({ T: (es) => es, PICK: (o) => (o == null ? "" : o.es ?? "") }));

import ResultModal from "./ResultModal.jsx";

const vid = { id: "v1", es: "Video 1" };

describe("ResultModal", () => {
  it("aprobado: muestra '¡Aprobado!' y la puntuación", () => {
    render(<ResultModal result={{ score: 9, passed: true, correct: 9, total: 10 }} vid={vid} onClose={vi.fn()} />);
    expect(screen.getByText(/¡Aprobado!/)).toBeInTheDocument();
    expect(screen.getByText("9.0/10")).toBeInTheDocument();
    expect(screen.getByText(/9\/10 correctas/)).toBeInTheDocument();
  });

  it("no aprobado: muestra 'No aprobado' y la nota de repaso", () => {
    render(<ResultModal result={{ score: 6, passed: false, correct: 6, total: 10 }} vid={vid} onClose={vi.fn()} />);
    expect(screen.getByText(/No aprobado/)).toBeInTheDocument();
    expect(screen.getByText(/marcado como no visto/i)).toBeInTheDocument();
  });

  it("el botón Continuar llama onClose", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ResultModal result={{ score: 9, passed: true, correct: 9, total: 10 }} vid={vid} onClose={onClose} />);
    await user.click(screen.getByRole("button", { name: /Continuar/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
