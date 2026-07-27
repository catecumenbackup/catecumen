import { useState } from "react";

// Input de calificación por estrellas (1–5). Controlado: `valor` es la
// calificación actual y `onChange(n)` se llama al hacer clic en la estrella n.
// Autocontenido (sin dependencias del ámbito de App.jsx). Se usa en la encuesta
// de calidad post-video. Primer componente extraído del monolito (patrón para
// el troceo del bundle); probado en EstrellasInput.test.jsx.
export default function EstrellasInput({ valor, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          role="button"
          aria-label={`${n}`}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          style={{
            cursor: "pointer",
            fontSize: 26,
            lineHeight: 1,
            transition: "transform .1s",
            transform: hover === n ? "scale(1.15)" : "scale(1)",
            color: (hover || valor) >= n ? "#E5C97A" : "rgba(200,169,81,0.28)",
            filter: (hover || valor) >= n ? "drop-shadow(0 0 4px rgba(200,169,81,0.6))" : "none",
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}
