// ════════════════════════════════════════════════════════════════════════
//  src/ui.js — Estilos base reutilizables (tema, botones, tarjetas, modales…)
//
//  Objetos de estilo PUROS (sin React ni DOM). Los colores son referencias a
//  variables CSS (`var(--c-…)`) que App.jsx inyecta en su bloque <style> según
//  el tema activo. Extraídos de App.jsx para que las pantallas que se saquen
//  del monolito puedan importarlos sin arrastrar todo el ámbito compartido.
// ════════════════════════════════════════════════════════════════════════

// ─── TEMA (variables CSS: cambian según data-theme en <html>) ──────
export const C = {
  bg: "var(--c-bg)", surface: "var(--c-surface)", card: "var(--c-card)", cardH: "var(--c-cardH)",
  border: "var(--c-border)", borderD: "var(--c-borderD)",
  gold: "var(--c-gold)", goldL: "var(--c-goldL)", ivory: "var(--c-ivory)", ivoryM: "var(--c-ivoryM)",
  wine: "var(--c-wine)", green: "var(--c-green)", greenB: "var(--c-greenB)", blue: "var(--c-blue)",
  blueB: "var(--c-blueB)", gray: "var(--c-gray)", t1: "var(--c-ivory)", t2: "var(--c-ivoryM)", tM: "var(--c-tM)",
};

// ─── ESTILOS REUTILIZABLES ────────────────────────────────────────
export const BTN = (v = "pri") => ({
  background: v === "pri" ? `linear-gradient(135deg,${C.goldL} 0%,${C.gold} 45%,var(--c-goldDeep) 100%)` : "transparent",
  color: v === "pri" ? "var(--c-btnPriText)" : C.gold,
  border: v === "pri" ? "none" : `1px solid ${C.gold}60`,
  borderRadius: 10, padding: v === "pri" ? "12px 28px" : "10px 22px",
  fontFamily: "'Cinzel',serif", fontSize: 13, fontWeight: 700, letterSpacing: "0.07em",
  // Solo props compuestas (transform/opacity/box-shadow) para evitar animaciones
  // no compuestas que Lighthouse penaliza; color/background cambian sin transición.
  cursor: "pointer", transition: "transform .22s ease, box-shadow .22s ease, opacity .22s ease", display: "inline-flex", alignItems: "center", gap: 8,
  boxShadow: v === "pri" ? `0 2px 12px rgba(200,169,81,0.35),0 1px 0 rgba(255,255,255,0.15) inset` : "none",
});

export const INP = {
  width: "100%", background: "var(--c-inputBg)", border: `1px solid ${C.border}`,
  borderRadius: 8, padding: "11px 14px", color: C.ivory, fontFamily: "'Crimson Text',serif",
  fontSize: 16, outline: "none", transition: "border-color .2s", boxSizing: "border-box",
  colorScheme: "var(--c-scheme, dark)",
};

export const LBL = {
  fontSize: 12, color: "var(--c-label)", letterSpacing: "0.08em", textTransform: "uppercase",
  marginBottom: 4, display: "block", fontFamily: "'Cinzel',serif", fontWeight: 600,
};

// Checkbox/radio con apariencia 100% controlada (evita que el navegador/SO
// pinte la casilla vacía como "rellena" — bug observado con accent-color
// nativo en combinación con el tema oscuro del sistema en Windows/Edge).
export const checkStyle = (checked, size = 18) => ({
  appearance: "none", WebkitAppearance: "none", MozAppearance: "none",
  width: size, height: size, flexShrink: 0, cursor: "pointer",
  borderRadius: 4, border: `1.5px solid ${checked ? C.gold : C.ivoryM}`,
  background: checked ? C.gold : "transparent",
  transition: "background .15s ease,border-color .15s ease",
});
export const radioStyle = (checked, size = 16) => ({
  ...checkStyle(checked, size),
  borderRadius: "50%",
  background: checked ? `radial-gradient(circle,${C.gold} 42%,transparent 46%)` : "transparent",
});

export const CARD = {
  background: `linear-gradient(145deg,${C.card} 0%,var(--c-cardEnd) 100%)`,
  border: `1px solid ${C.borderD}`, borderRadius: 14, padding: "20px 22px",
  boxShadow: "var(--c-cardShadow)",
};

export const MODAL = {
  background: `linear-gradient(160deg,var(--c-modalStart) 0%,${C.surface} 60%,var(--c-modalEnd) 100%)`,
  border: `1px solid ${C.border}`, borderRadius: 20,
  maxWidth: 700, width: "95%", maxHeight: "88vh", overflowY: "auto", padding: "32px 28px",
  boxShadow: "var(--c-modalShadow)",
  animation: "modalIn .28s cubic-bezier(.34,1.2,.64,1) both",
};

// Estilo de LECTURA para textos largos (encuadres, tarjetas, descripciones).
// Legibilidad: mayor tamaño e interlineado, fuente sans del sistema (sin
// descarga), ancho de columna limitado, alto contraste, sin mayúsculas.
export const FONT_READ = "-apple-system,'Segoe UI',Roboto,system-ui,'Helvetica Neue',Arial,sans-serif";
export const READ = {
  fontFamily: FONT_READ, fontSize: 17, lineHeight: 1.75, color: C.ivory,
  textAlign: "left", letterSpacing: "0.005em", maxWidth: "38em", marginLeft: "auto", marginRight: "auto",
};

export const OVERLAY = {
  position: "fixed", inset: 0,
  background: "rgba(250,247,240,0.82)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 1000, padding: 16,
};
