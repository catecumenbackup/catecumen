import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("../i18n.js", () => ({ T: (es) => es, PICK: (o) => (o == null ? "" : o.es ?? "") }));
const signIn = vi.fn();
vi.mock("../supabaseClient.js", () => ({ supabase: { auth: { signInWithPassword: (...a) => signIn(...a) } } }));

import LoginModal from "./LoginModal.jsx";

beforeEach(() => { signIn.mockReset(); });

const noop = () => {};

describe("LoginModal", () => {
  it("el botón de entrar está deshabilitado hasta correo válido + contraseña ≥6", async () => {
    const user = userEvent.setup();
    render(<LoginModal onBack={noop} onSuccess={noop} onResume={noop} />);
    const btn = screen.getByRole("button", { name: /Entrar a la plataforma/i });
    expect(btn).toBeDisabled();
    await user.type(screen.getByPlaceholderText("usuario@correo.com"), "juan@correo.com");
    await user.type(screen.getByPlaceholderText(/Tu contraseña/i), "secreta1");
    expect(btn).toBeEnabled();
  });

  it("login correcto llama onSuccess con el usuario", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    signIn.mockResolvedValueOnce({ data: { user: { id: "u1" } }, error: null });
    render(<LoginModal onBack={noop} onSuccess={onSuccess} onResume={noop} />);
    await user.type(screen.getByPlaceholderText("usuario@correo.com"), "juan@correo.com");
    await user.type(screen.getByPlaceholderText(/Tu contraseña/i), "secreta1");
    await user.click(screen.getByRole("button", { name: /Entrar a la plataforma/i }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith({ id: "u1" }));
  });

  it("credenciales inválidas muestran mensaje específico", async () => {
    const user = userEvent.setup();
    signIn.mockResolvedValueOnce({ data: null, error: { message: "Invalid login credentials" } });
    render(<LoginModal onBack={noop} onSuccess={noop} onResume={noop} />);
    await user.type(screen.getByPlaceholderText("usuario@correo.com"), "juan@correo.com");
    await user.type(screen.getByPlaceholderText(/Tu contraseña/i), "malamala");
    await user.click(screen.getByRole("button", { name: /Entrar a la plataforma/i }));
    expect(await screen.findByText(/Correo o contraseña incorrectos/i)).toBeInTheDocument();
  });

  it("'Regresar' llama onBack; 'Reanúdalo aquí' llama onResume", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn(); const onResume = vi.fn();
    render(<LoginModal onBack={onBack} onSuccess={noop} onResume={onResume} />);
    await user.click(screen.getByRole("button", { name: /Regresar/i }));
    expect(onBack).toHaveBeenCalled();
    await user.click(screen.getByText(/Reanúdalo aquí/i));
    expect(onResume).toHaveBeenCalled();
  });
});
