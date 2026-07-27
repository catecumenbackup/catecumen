import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("../i18n.js", () => ({ T: (es) => es, PICK: (o) => (o == null ? "" : o.es ?? "") }));
vi.mock("../supabaseClient.js", () => ({ supabase: { rpc: () => Promise.resolve({ data: [] }) } }));
vi.mock("./SecIcon.jsx", () => ({ default: () => <span data-testid="secicon" /> }));
vi.mock("./fields.jsx", () => ({
  FRow: ({ children }) => <div>{children}</div>,
  Input: () => <input />,
  PasswordInput: () => <input type="password" />,
  PhoneField: () => <div data-testid="phone" />,
}));
vi.mock("./AgendaTab.jsx", () => ({ default: () => <div>agenda</div> }));
vi.mock("./MensajesTab.jsx", () => ({ default: () => <div>mensajes</div> }));
vi.mock("../data/course.js", () => ({
  SEC_META: {
    tc1: { es: "Tronco Común 1", videos: [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }] },
  },
  isSectionDone: () => false,
}));

import Dashboard from "./Dashboard.jsx";

const base = {
  formData: { nombre: "Ana", apellido: "López", country: "México", age: 30, email: "a@b.com" },
  sequence: ["tc1"],
  progress: { tc1: { a: { passed: true }, b: { passed: true } } }, // 2/4
  onUpdate: vi.fn(), onClose: vi.fn(),
};

describe("Dashboard", () => {
  it("calcula el porcentaje de progreso global (2/4 = 50%)", () => {
    render(<Dashboard {...base} />);
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText(/2\/4/)).toBeInTheDocument();
  });

  it("abre la pestaña Mi Cuenta y muestra los datos del usuario", async () => {
    const user = userEvent.setup();
    render(<Dashboard {...base} />);
    await user.click(screen.getByRole("button", { name: /Mi Cuenta/i }));
    expect(screen.getByText(/Ana López/)).toBeInTheDocument();
    expect(screen.getByText("México")).toBeInTheDocument();
  });

  it("el botón Cerrar llama onClose", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Dashboard {...base} onClose={onClose} />);
    await user.click(screen.getByRole("button", { name: /Cerrar/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("respeta initialTab", () => {
    render(<Dashboard {...base} initialTab="account" />);
    expect(screen.getByText(/Información registrada/i)).toBeInTheDocument();
  });
});
