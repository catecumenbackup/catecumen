// src/components/modalUtils.jsx
// Utilidades compartidas para los modales: cerrar con la tecla ESC y una «X» en
// la esquina. Reutilizables en todos los modales para un comportamiento uniforme.
import { useEffect } from "react";

// Cierra el modal al pulsar ESC. `activo` permite desactivarlo (p. ej. durante
// una evaluación en curso) sin dejar de registrar el listener de forma limpia.
export function useEscClose(onClose, activo = true) {
  useEffect(() => {
    if (!onClose || !activo) return;
    const h = (e) => { if (e.key === "Escape") { e.stopPropagation(); onClose(); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose, activo]);
}

// Botón «X» en la esquina superior derecha. El contenedor debe tener
// position:relative para que se ancle bien.
export function BotonX({ onClose, style = {} }) {
  if (!onClose) return null;
  return (
    <button onClick={onClose} aria-label="Cerrar" title="Cerrar (Esc)"
      style={{
        position: "absolute", top: 8, right: 10, zIndex: 6,
        width: 30, height: 30, borderRadius: "50%", cursor: "pointer",
        background: "rgba(0,0,0,0.25)", border: "1px solid rgba(200,169,81,0.4)",
        color: "#E5C97A", fontSize: 18, lineHeight: 1, fontFamily: "Arial,sans-serif",
        display: "flex", alignItems: "center", justifyContent: "center",
        ...style,
      }}>×</button>
  );
}
