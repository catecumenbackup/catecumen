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
