// Prueba de humo del arnés de COMPONENTES (React Testing Library + jsdom).
// Verifica que render/screen/eventos y los matchers de jest-dom funcionan.
// Es la base para probar los componentes que se extraigan de App.jsx durante
// el troceo del bundle. Ejecutar: npm run test
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

// Componente de ejemplo autocontenido (se reemplazará por componentes reales
// a medida que se modularice App.jsx).
function Contador({ inicial = 0 }) {
  const [n, setN] = useState(inicial);
  return (
    <div>
      <p>Valor: {n}</p>
      <button onClick={() => setN((v) => v + 1)}>Sumar</button>
    </div>
  );
}

describe("arnés de componentes (RTL + jsdom)", () => {
  it("renderiza un componente y encuentra su texto", () => {
    render(<Contador inicial={5} />);
    expect(screen.getByText("Valor: 5")).toBeInTheDocument();
  });

  it("responde a interacción del usuario (click)", async () => {
    const user = userEvent.setup();
    render(<Contador />);
    expect(screen.getByText("Valor: 0")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Sumar" }));
    expect(screen.getByText("Valor: 1")).toBeInTheDocument();
  });

  it("los matchers de jest-dom están disponibles", () => {
    render(<Contador />);
    expect(screen.getByRole("button", { name: "Sumar" })).toBeEnabled();
  });
});
