import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// i18n: T(es,...) → devuelve el texto español para poder buscarlo.
vi.mock("../i18n.js", () => ({ T: (es) => es, PICK: (o) => (o == null ? "" : o.es ?? "") }));

import OracionModal from "./OracionModal.jsx";

describe("OracionModal", () => {
  it("versión larga: muestra el título largo y la oración", () => {
    render(<OracionModal ver="L" onClose={vi.fn()} />);
    expect(screen.getByText(/Oración para iniciar mi camino de fe/)).toBeInTheDocument();
    expect(screen.getByText(/Dios de infinita misericordia/)).toBeInTheDocument();
  });

  it("versión corta: muestra el título corto", () => {
    render(<OracionModal ver="C" onClose={vi.fn()} />);
    expect(screen.getByText(/Oración para comenzar/)).toBeInTheDocument();
  });

  it("el botón 'Comenzar la sesión' llama onClose (deja entrar al área de videos)", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<OracionModal ver="L" onClose={onClose} />);
    await user.click(screen.getByRole("button", { name: /Comenzar la sesión/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
