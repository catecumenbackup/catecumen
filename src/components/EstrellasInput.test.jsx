import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EstrellasInput from "./EstrellasInput.jsx";

describe("EstrellasInput — calificación por estrellas", () => {
  it("renderiza 5 estrellas con rol de botón", () => {
    render(<EstrellasInput valor={0} onChange={() => {}} />);
    const estrellas = screen.getAllByRole("button");
    expect(estrellas).toHaveLength(5);
  });

  it("llama onChange con el número de la estrella pulsada", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<EstrellasInput valor={0} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "4" }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it("cada estrella reporta su propio valor (1 a 5)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<EstrellasInput valor={0} onChange={onChange} />);
    for (const n of [1, 2, 3, 4, 5]) {
      await user.click(screen.getByRole("button", { name: `${n}` }));
    }
    expect(onChange.mock.calls.map((c) => c[0])).toEqual([1, 2, 3, 4, 5]);
  });

  it("pinta como activas las estrellas hasta el valor actual", () => {
    render(<EstrellasInput valor={3} onChange={() => {}} />);
    const estrellas = screen.getAllByRole("button");
    const dorada = "rgb(229, 201, 122)"; // #E5C97A
    // Las 3 primeras activas (doradas); las 2 últimas atenuadas.
    expect(estrellas[0]).toHaveStyle({ color: dorada });
    expect(estrellas[2]).toHaveStyle({ color: dorada });
    expect(estrellas[3]).not.toHaveStyle({ color: dorada });
  });
});
