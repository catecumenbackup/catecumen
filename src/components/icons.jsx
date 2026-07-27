// Iconos e imágenes compartidos, extraídos de App.jsx para que los usen tanto
// App.jsx como las pantallas que salen del monolito. Componentes SVG
// autocontenidos (color fijo, prop `size`) + rutas de los SVG de sacramentos.

export const iconoBautismo = "/iconobautismo.svg";
export const iconoConfirmacion = "/iconoconfirmacion.svg";

// ─── ÍCONO LLAMA (Espíritu Santo / Confirmación / Kerigma) ─────────
export function FlameIcon({ size = 36 }) {
  const g = "#C8A951", gL = "#E5C97A", gD = "#A8893A";
  return (
    <svg width={size} height={size} viewBox="0 0 40 52" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Brillo base */}
      <ellipse cx="20" cy="47" rx="10" ry="4" fill="rgba(200,169,81,0.18)" />
      {/* Llama izquierda */}
      <path d="M13 44 C15 37 18 30 14 22 C12 28 9 35 13 44Z" fill="rgba(200,169,81,0.35)" stroke={gD} strokeWidth="0.8" />
      {/* Llama derecha */}
      <path d="M27 44 C25 37 22 30 26 22 C28 28 31 35 27 44Z" fill="rgba(200,169,81,0.35)" stroke={gD} strokeWidth="0.8" />
      {/* Llama central exterior */}
      <path d="M20 47 C24 40 30 33 26 22 C22 13 26 7 20 2 C14 7 18 13 14 22 C10 33 16 40 20 47Z" fill="rgba(200,169,81,0.22)" stroke={g} strokeWidth="1.4" strokeLinejoin="round" />
      {/* Llama central interior — núcleo brillante */}
      <path d="M20 44 C23 37 27 31 24 23 C22 17 24 12 20 7 C16 12 18 17 16 23 C13 31 17 37 20 44Z" fill="rgba(229,201,122,0.5)" stroke={gL} strokeWidth="0.9" />
      {/* Núcleo más brillante */}
      <path d="M20 40 C22 34 24 29 22 23 C21 19 22 16 20 12 C18 16 19 19 18 23 C16 29 18 34 20 40Z" fill="rgba(255,240,180,0.55)" />
      {/* Destello en la punta */}
      <circle cx="20" cy="4.5" r="2.2" fill="rgba(255,245,200,0.7)" />
      <circle cx="20" cy="3.5" r="1" fill="rgba(255,255,255,0.5)" />
      {/* Pequeñas chispas */}
      <circle cx="13" cy="18" r="1.2" fill={gL} opacity="0.6" />
      <circle cx="27" cy="20" r="1" fill={gL} opacity="0.5" />
      <circle cx="17" cy="10" r="0.8" fill={gL} opacity="0.7" />
      <circle cx="23" cy="12" r="0.7" fill={gL} opacity="0.6" />
    </svg>
  );
}

// ─── ÍCONO CÁLIZ + HOSTIA (Primera Comunión) ─────────────────────
export function CalizIcon({ size = 36 }) {
  const g = "#C8A951";
  return (
    <svg width={size} height={size} viewBox="0 0 40 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="6" r="5.5" fill="rgba(200,169,81,0.22)" stroke={g} strokeWidth="1.5" />
      <line x1="20" y1="2.5" x2="20" y2="9.5" stroke={g} strokeWidth="1.1" />
      <line x1="16.5" y1="6" x2="23.5" y2="6" stroke={g} strokeWidth="1.1" />
      <path d="M9 13 Q9 30 20 33 Q31 30 31 13 Z" fill="rgba(200,169,81,0.14)" stroke={g} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M11.5 21 Q20 24 28.5 21" stroke={g} strokeWidth="0.9" opacity="0.5" />
      <ellipse cx="20" cy="34" rx="3" ry="2" fill={g} opacity="0.9" />
      <rect x="14" y="36" width="12" height="3" rx="1.5" fill={g} />
    </svg>
  );
}
