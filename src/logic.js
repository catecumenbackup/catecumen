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

// ─── Serie de la constancia ──────────────────────────────────────────────
// Devuelve el número de serie con el formato canónico:
//   CAT-{ISO2}-{SAC3}-{AÑO4}-{NNNNNN}   ej. "CAT-MX-BAU-2026-000042"
// Normaliza a mayúsculas, descarta caracteres no alfanuméricos, recorta/rellena
// los segmentos a su longitud fija, y el consecutivo a 6 dígitos con ceros.
// La serie REAL (con consecutivo secuencial) la emite la RPC del servidor; este
// formateador se usa en el respaldo local y garantiza el formato del QR/PDF.
export function formatSerie(iso, sac, anio, consecutivo) {
  const p2 = String(iso ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 2).padEnd(2, "X");
  const p3 = String(sac ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3).padEnd(3, "X");
  const y  = String(anio ?? "").replace(/[^0-9]/g, "").slice(0, 4).padStart(4, "0");
  const n  = String(Math.abs(Math.trunc(Number(consecutivo) || 0)) % 1000000).padStart(6, "0");
  return `CAT-${p2}-${p3}-${y}-${n}`;
}

// ─── Selector de país → cuota ────────────────────────────────────────────
// Coerción numérica segura: null/""/inválido → 0 (evita que un NaN llegue al
// precio mostrado o cobrado).
function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

// Normaliza una fila de la tabla `cuotasporpais` de Supabase al objeto de cuota
// interno { b, c, p, pre, cat, pad, cur }. Los importes se parsean de forma
// segura; la moneda cae a "USD" si falta.
export function cuotaFromRow(row) {
  return {
    b:   num(row?.bautismo),
    c:   num(row?.confirmacion),
    p:   num(row?.primera_comunion),
    pre: num(row?.prebautismal),
    cat: num(row?.catequista),
    pad: num(row?.padrino),
    cur: row?.moneda || "USD",
  };
}

// Resuelve la cuota de un país desde una tabla de cuotas; null si no existe
// (el registro no puede continuar sin una cuota válida para el país).
export function resolverCuota(country, cuotas) {
  if (!country || !cuotas) return null;
  return cuotas[country] ?? null;
}
