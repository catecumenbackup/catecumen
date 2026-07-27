import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FRow, Input, PasswordInput } from "./fields.jsx";

describe("fields — primitivas de formulario", () => {
  it("FRow muestra su etiqueta y sus hijos", () => {
    render(<FRow label="Correo"><span>contenido</span></FRow>);
    expect(screen.getByText("Correo")).toBeInTheDocument();
    expect(screen.getByText("contenido")).toBeInTheDocument();
  });

  it("Input reporta cada cambio con onChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Input value="" onChange={onChange} placeholder="escribe" />);
    await user.type(screen.getByPlaceholderText("escribe"), "ab");
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenLastCalledWith("b");
  });

  it("PasswordInput alterna entre ocultar y mostrar la contraseña", async () => {
    const user = userEvent.setup();
    render(<PasswordInput value="secreta" onChange={() => {}} placeholder="clave" />);
    const input = screen.getByPlaceholderText("clave");
    expect(input).toHaveAttribute("type", "password");
    await user.click(screen.getByRole("button", { name: /Mostrar contraseña/i }));
    expect(input).toHaveAttribute("type", "text");
    await user.click(screen.getByRole("button", { name: /Ocultar contraseña/i }));
    expect(input).toHaveAttribute("type", "password");
  });
});
