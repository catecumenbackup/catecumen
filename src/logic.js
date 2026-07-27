// ════════════════════════════════════════════════════════════════════════
//  src/logic.js — Lógica PURA y testeable extraída de App.jsx
//
//  Solo funciones sin estado ni dependencias del DOM/navegador, para poder
//  probarlas con Vitest sin montar React. App.jsx las importa (no se duplica
//  la lógica: esta es la única fuente de verdad). Primer paso de modularización.
// ════════════════════════════════════════════════════════════════════════

// ─── Secuencia del curso ────────────────────────────────────────────────
// Devuelve el orden de secciones (secId) que cursa un usuario según su tipo y
// los sacramentos elegidos. El Módulo 0 "kerigma" va antes de TC1 y UNA sola
// vez, solo para catecúmenos (no papás/prebautismal ni padrinos ni catequistas).
// `testMode` reduce todo a una sola sección (fase de pruebas).
export function buildSeq(uType, sacs = [], testMode = false) {
  if (testMode) return ["tc1"];
  // El catequista solo cursa el Módulo I de Neuropedagogía Catequética.
  if (uType === "catequista") return ["catequista"];

  const list = Array.isArray(sacs) ? sacs : [];
  const s = ["tc1"];
  if (uType === "catecumeno") {
    s.unshift("kerigma"); // Módulo 0, antes de TC1, una sola vez
    ["bautismo", "confirmacion", "primera_comunion"].forEach((x) => {
      if (list.includes(x)) s.push(x);
    });
  } else if (uType === "prebautismal") {
    s.push("prebautismal");
  } else if (uType === "padrino") {
    s.push("bautismo");
  }
  s.push("tc2_confesion", "tc2_uncion");
  return s;
}

// ─── Internacionalización (i18n) ─────────────────────────────────────────
// Devuelve el texto en el idioma pedido; si falta, cae a español.
export function translate(lang, es, en = es, fr = es, de = es, pt = es, it = es) {
  const map = { es, en, fr, de, pt, it };
  return map[lang] ?? es;
}

// Selector para objetos con forma {es,en,fr,de,pt,it,...}: usa el idioma
// activo y cae de vuelta a español, luego inglés, y por último cadena vacía.
export function pick(lang, obj) {
  return obj?.[lang] ?? obj?.es ?? obj?.en ?? "";
}

// ─── Precios PPP (paridad de poder adquisitivo) ──────────────────────────
// Cuota completa en USD por nivel de país.
export const PPP_TIER_USD = { 1: 130, 2: 66, 3: 30, 4: 10 };
// Ratios internos entre tipos de cuota (derivados del patrón en producción):
// sacramentos = cuota completa; presacramental/padrino ≈60%; catequista ≈77%.
export const RATIO_PRE = 0.60, RATIO_CAT = 0.77, RATIO_PAD = 0.60;
// Beca de Esperanza: 20% de descuento (pacientes en rehabilitación).
export const BECA_ESPERANZA_PCT = 20;

// Redondeo "amigable" según la magnitud del monto en moneda local.
export function redondearCuota(monto) {
  if (monto >= 10000) return Math.round(monto / 100) * 100;
  if (monto >= 1000)  return Math.round(monto / 10) * 10;
  if (monto >= 100)   return Math.round(monto / 5) * 5;
  return Math.round(monto);
}

// Calcula todas las cuotas de un país a partir de { tier, fx, cur, chargeInUSD }.
export function calcularCuotaPais(info) {
  const full = redondearCuota(PPP_TIER_USD[info.tier] * info.fx);
  return {
    b: full, c: full, p: full,
    pre: redondearCuota(full * RATIO_PRE),
    cat: redondearCuota(full * RATIO_CAT),
    pad: redondearCuota(full * RATIO_PAD),
    cur: info.cur, tier: info.tier, chargeInUSD: !!info.chargeInUSD,
  };
}

// Aplica el descuento de Beca de Esperanza (20%) a un monto base y redondea a
// entero. Sin beca, devuelve el monto base redondeado. Es la matemática exacta
// que usa el desglose de precio en el registro.
export function aplicarBeca(base, esRehab) {
  const disc = esRehab ? 1 - BECA_ESPERANZA_PCT / 100 : 1;
  return Math.round(base * disc);
}
