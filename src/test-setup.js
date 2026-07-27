// Setup de pruebas de componentes: añade los matchers de jest-dom
// (toBeInTheDocument, toHaveTextContent, toBeDisabled, etc.) y limpia el DOM
// entre pruebas. Se carga solo para los archivos *.test.jsx (entorno jsdom).
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});
