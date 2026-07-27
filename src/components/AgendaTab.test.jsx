import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock del cliente Supabase ANTES de importar el componente.
const rpc = vi.fn();
vi.mock("../supabaseClient.js", () => ({ supabase: { rpc: (...a) => rpc(...a) } }));

import AgendaTab from "./AgendaTab.jsx";

const sesionFutura = (over = {}) => ({
  id: "s1",
  titulo: "Reunión de seguimiento",
  descripcion: "Repaso del módulo",
  inicio: new Date(Date.now() + 3 * 864e5).toISOString(), // en 3 días
  duracion_min: 45,
  enlace: "https://meet.example.com/abc",
  mi_estado: null,
  ...over,
});

beforeEach(() => { rpc.mockReset(); });

describe("AgendaTab", () => {
  it("muestra 'Cargando…' al inicio", () => {
    rpc.mockReturnValue(new Promise(() => {})); // nunca resuelve
    render(<AgendaTab />);
    expect(screen.getByText("Cargando…")).toBeInTheDocument();
  });

  it("muestra el estado vacío cuando no hay sesiones", async () => {
    rpc.mockResolvedValueOnce({ data: [] });
    render(<AgendaTab />);
    expect(await screen.findByText(/No tienes sesiones programadas/i)).toBeInTheDocument();
  });

  it("lista una sesión con su título y enlace", async () => {
    rpc.mockResolvedValueOnce({ data: [sesionFutura()] });
    render(<AgendaTab />);
    expect(await screen.findByText("Reunión de seguimiento")).toBeInTheDocument();
    expect(screen.getByText(/Unirse a la reunión/i).closest("a")).toHaveAttribute("href", "https://meet.example.com/abc");
  });

  it("confirmar asistencia llama responder_asistencia y recarga", async () => {
    const user = userEvent.setup();
    // 1ª llamada: mi_agenda (lista). 2ª: responder_asistencia. 3ª: mi_agenda (recarga).
    rpc.mockResolvedValueOnce({ data: [sesionFutura()] })   // carga inicial
       .mockResolvedValueOnce({ data: null })                // responder_asistencia
       .mockResolvedValueOnce({ data: [sesionFutura({ mi_estado: "confirmada" })] }); // recarga
    render(<AgendaTab />);
    await screen.findByText("Reunión de seguimiento");

    await user.click(screen.getByRole("button", { name: /Confirmar asistencia/i }));

    await waitFor(() =>
      expect(rpc).toHaveBeenCalledWith("responder_asistencia",
        expect.objectContaining({ p_sesion_id: "s1", p_estado: "confirmada" })));
    // Tras recargar, muestra el estado confirmado.
    expect(await screen.findByText(/Asistencia confirmada/i)).toBeInTheDocument();
  });

  it("una sesión ya confirmada no muestra los botones de acción", async () => {
    rpc.mockResolvedValueOnce({ data: [sesionFutura({ mi_estado: "confirmada" })] });
    render(<AgendaTab />);
    await screen.findByText("Reunión de seguimiento");
    expect(screen.queryByRole("button", { name: /Confirmar asistencia/i })).toBeNull();
  });
});
