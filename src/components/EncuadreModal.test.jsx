import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Datos de encuadre de prueba e i18n determinista.
vi.mock("../data/encuadres.js", () => ({
  ENCUADRES: {
    bautismo: {
      es: { title: "Formación para el Bautismo", icon: "__bautismo_img__", body: "Este es el texto de encuadre de prueba." },
    },
    parroquia: {
      es: { title: "Afiliación de Parroquia", icon: "⛪", body: "Texto para organizaciones." },
    },
  },
}));
vi.mock("../i18n.js", () => ({
  T: (es) => es,
  PICK: (o) => (o == null ? "" : o.es ?? o.en ?? ""),
}));

import EncuadreModal from "./EncuadreModal.jsx";

describe("EncuadreModal", () => {
  it("muestra el título y el cuerpo del encuadre", () => {
    render(<EncuadreModal encKey="bautismo" onRegister={() => {}} onBack={() => {}} />);
    expect(screen.getByText("Formación para el Bautismo")).toBeInTheDocument();
    expect(screen.getByText(/texto de encuadre de prueba/i)).toBeInTheDocument();
  });

  it("no renderiza nada si la clave no existe", () => {
    const { container } = render(<EncuadreModal encKey="inexistente" onRegister={() => {}} onBack={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("el botón de registro llama onRegister", async () => {
    const user = userEvent.setup();
    const onRegister = vi.fn();
    render(<EncuadreModal encKey="bautismo" onRegister={onRegister} onBack={() => {}} />);
    await user.click(screen.getByRole("button", { name: /Realizar mi Registro/i }));
    expect(onRegister).toHaveBeenCalledTimes(1);
  });

  it("'Regresar' llama onBack", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(<EncuadreModal encKey="bautismo" onRegister={() => {}} onBack={onBack} />);
    await user.click(screen.getByRole("button", { name: /Regresar/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("una organización usa el texto de registro de organización", () => {
    render(<EncuadreModal encKey="parroquia" onRegister={() => {}} onBack={() => {}} />);
    expect(screen.getByRole("button", { name: /Realizar el Registro/i })).toBeInTheDocument();
  });
});
