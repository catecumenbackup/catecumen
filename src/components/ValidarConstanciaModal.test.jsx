import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("../i18n.js", () => ({ T: (es) => es, PICK: (o) => (o == null ? "" : o.es ?? "") }));
const rpc = vi.fn();
vi.mock("../supabaseClient.js", () => ({ supabase: { rpc: (...a) => rpc(...a) } }));

import ValidarConstanciaModal from "./ValidarConstanciaModal.jsx";

beforeEach(() => { rpc.mockReset(); });

describe("ValidarConstanciaModal", () => {
  it("muestra 'Verificando…' mientras consulta", () => {
    rpc.mockReturnValue(new Promise(() => {}));
    render(<ValidarConstanciaModal codigo="abc" onClose={() => {}} />);
    expect(screen.getByText(/Verificando constancia/i)).toBeInTheDocument();
  });

  it("constancia válida y vigente: muestra los datos", async () => {
    rpc.mockResolvedValueOnce({ data: [{
      valida: true, vigente: true, nombre: "Juan Pérez", sacramento: "Bautismo",
      pais_residencia: "México", catequista: "Mtra. Nelly", serie: "CAT-MX-BAU-2026-000042",
      fecha_emision: "2026-07-01", fecha_vigencia: "2027-01-01",
    }] });
    render(<ValidarConstanciaModal codigo="abc" onClose={() => {}} />);
    expect(await screen.findByText(/válida y vigente/i)).toBeInTheDocument();
    expect(screen.getByText("Juan Pérez")).toBeInTheDocument();
    expect(screen.getByText("CAT-MX-BAU-2026-000042")).toBeInTheDocument();
  });

  it("código inexistente: muestra 'no encontrada'", async () => {
    rpc.mockResolvedValueOnce({ data: [{ valida: false }] });
    render(<ValidarConstanciaModal codigo="zzz" onClose={() => {}} />);
    expect(await screen.findByText(/Constancia no encontrada/i)).toBeInTheDocument();
  });

  it("error de RPC: muestra mensaje de error", async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { message: "boom" } });
    render(<ValidarConstanciaModal codigo="abc" onClose={() => {}} />);
    expect(await screen.findByText(/No se pudo verificar/i)).toBeInTheDocument();
  });

  it("el botón Cerrar llama onClose", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    rpc.mockResolvedValueOnce({ data: [{ valida: false }] });
    render(<ValidarConstanciaModal codigo="abc" onClose={onClose} />);
    await screen.findByText(/Constancia no encontrada/i);
    await user.click(screen.getByRole("button", { name: /Cerrar/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
