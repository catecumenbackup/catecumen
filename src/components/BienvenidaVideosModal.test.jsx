import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("../i18n.js", () => ({ T: (es) => es, PICK: (o) => (o == null ? "" : o.es ?? "") }));

import BienvenidaVideosModal from "./BienvenidaVideosModal.jsx";

describe("BienvenidaVideosModal", () => {
  it("muestra el título y el cuerpo recibidos", () => {
    render(<BienvenidaVideosModal titulo="¡Bienvenido!" cuerpo="Así funciona tu formación" onClose={vi.fn()} />);
    expect(screen.getByText("¡Bienvenido!")).toBeInTheDocument();
    expect(screen.getByText(/Así funciona tu formación/)).toBeInTheDocument();
  });

  it("el botón 'Comenzar' llama onClose (deja pasar a la oración/videos)", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<BienvenidaVideosModal titulo="Hola" cuerpo="Texto" onClose={onClose} />);
    await user.click(screen.getByRole("button", { name: /Comenzar/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
