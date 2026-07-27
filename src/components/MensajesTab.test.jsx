import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// i18n determinista (T → español) y mock del cliente Supabase.
vi.mock("../i18n.js", () => ({
  LANG: "es",
  T: (es) => es,
  PICK: (o) => (o == null ? "" : o.es ?? o.en ?? ""),
}));
const rpc = vi.fn();
vi.mock("../supabaseClient.js", () => ({ supabase: { rpc: (...a) => rpc(...a) } }));

import MensajesTab from "./MensajesTab.jsx";

beforeEach(() => { rpc.mockReset(); });

// Helper: mis_mensajes devuelve `msgs`, marcar_leidos_usuario resuelve ok.
function mockCarga(msgs) {
  rpc.mockImplementation((fn) => {
    if (fn === "mis_mensajes") return Promise.resolve({ data: msgs });
    return Promise.resolve({ data: null }); // marcar_leidos_usuario, responder_usuario
  });
}

describe("MensajesTab", () => {
  it("estado vacío cuando no hay mensajes", async () => {
    mockCarga([]);
    render(<MensajesTab />);
    expect(await screen.findByText(/No tienes mensajes por ahora/i)).toBeInTheDocument();
  });

  it("marca leídos al cargar y avisa con onLeidos", async () => {
    mockCarga([]);
    const onLeidos = vi.fn();
    render(<MensajesTab onLeidos={onLeidos} />);
    await waitFor(() => expect(rpc).toHaveBeenCalledWith("marcar_leidos_usuario"));
    expect(onLeidos).toHaveBeenCalled();
  });

  it("muestra los mensajes del hilo", async () => {
    mockCarga([
      { id: "m1", remitente: "admin", cuerpo: "Bienvenido a Catecumen", creado: new Date().toISOString() },
      { id: "m2", remitente: "usuario", cuerpo: "Gracias por la ayuda", creado: new Date().toISOString() },
    ]);
    render(<MensajesTab />);
    expect(await screen.findByText("Bienvenido a Catecumen")).toBeInTheDocument();
    expect(screen.getByText("Gracias por la ayuda")).toBeInTheDocument();
  });

  it("el botón Enviar está deshabilitado si el campo está vacío", async () => {
    mockCarga([]);
    render(<MensajesTab />);
    await screen.findByText(/No tienes mensajes/i);
    expect(screen.getByRole("button", { name: "Enviar" })).toBeDisabled();
  });

  it("enviar un mensaje llama responder_usuario con el texto y recarga", async () => {
    const user = userEvent.setup();
    mockCarga([]);
    render(<MensajesTab />);
    await screen.findByText(/No tienes mensajes/i);

    await user.type(screen.getByPlaceholderText(/Escribe un mensaje/i), "Hola");
    await user.click(screen.getByRole("button", { name: "Enviar" }));

    await waitFor(() =>
      expect(rpc).toHaveBeenCalledWith("responder_usuario", { p_cuerpo: "Hola" }));
  });
});
