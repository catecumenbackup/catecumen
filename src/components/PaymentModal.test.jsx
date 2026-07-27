import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("../i18n.js", () => ({ T: (es) => es, LANG: "es" }));
vi.mock("../supabaseClient.js", () => ({ supabase: { auth: {}, functions: {}, from: () => ({}), rpc: () => Promise.resolve({}) } }));
vi.mock("../appNav.js", () => ({ appNav: { bypassUnload: false } }));
vi.mock("../data/countries.js", () => ({ COUNTRY_ISO: { México: "MX" }, CDOCS: { México: { l: "CURP" } } }));

import PaymentModal from "./PaymentModal.jsx";

const pbBase = { cur: "MXN", total: 350, becaDesc: 0, lines: [{ label: "Bautismo", amt: 350, cur: "MXN" }] };

describe("PaymentModal", () => {
  it("pago normal: muestra total y botón de pago en línea", () => {
    render(<PaymentModal formData={{ country: "México", priceBreakdown: pbBase }}
      userType="catecumeno" selectedSacs={["bautismo"]} onSuccess={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText(/Pagar en línea con tarjeta/i)).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getAllByText(/350/).length).toBeGreaterThan(0); // línea + total
  });

  it("MXN ofrece además el método de vale (OXXO)", () => {
    render(<PaymentModal formData={{ country: "México", priceBreakdown: pbBase }}
      userType="catecumeno" selectedSacs={["bautismo"]} onSuccess={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText(/OXXO/)).toBeInTheDocument();
  });

  it("moneda sin vale (USD) no ofrece pago en efectivo", () => {
    const pbUsd = { ...pbBase, cur: "USD" };
    render(<PaymentModal formData={{ country: "Estados Unidos", priceBreakdown: pbUsd }}
      userType="catecumeno" selectedSacs={["bautismo"]} onSuccess={vi.fn()} onBack={vi.fn()} />);
    expect(screen.queryByText(/OXXO|Boleto|Multibanco/)).toBeNull();
  });

  it("ruta gratuita (beca 100%): muestra el mensaje de beca, no el de pago", () => {
    render(<PaymentModal formData={{ country: "México", freeRegistration: true, estaInternado: true }}
      userType="catecumeno" selectedSacs={["bautismo"]} onSuccess={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByRole("heading", { name: /Beca del 100%/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Comenzar formación/i })).toBeInTheDocument();
    expect(screen.queryByText(/Pagar en línea/i)).toBeNull();
  });

  it("Regresar llama onBack", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(<PaymentModal formData={{ country: "México", priceBreakdown: pbBase }}
      userType="catecumeno" selectedSacs={["bautismo"]} onSuccess={vi.fn()} onBack={onBack} />);
    await user.click(screen.getByRole("button", { name: /Regresar/i }));
    expect(onBack).toHaveBeenCalled();
  });
});
