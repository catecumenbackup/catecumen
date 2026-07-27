// ════════════════════════════════════════════════════════════════════════
//  src/i18n.js — Runtime de internacionalización
//
//  Detecta el idioma activo (LANG) una vez al cargar (localStorage → navegador),
//  y expone T/PICK/SINO que aplican ese idioma sobre las funciones puras de
//  logic.js (probadas con Vitest). Cambiar de idioma recarga la página, así que
//  LANG es constante durante toda la sesión.
// ════════════════════════════════════════════════════════════════════════
import { translate, pick } from "./logic.js";

// Idiomas soportados: es, en, fr, de, pt, it. Si un T() no trae aún la
// traducción de un idioma, cae de vuelta a español (ver logic.translate).
export const SUPPORTED_LANGS = ["es", "en", "fr", "de", "pt", "it"];

export function detectLang() {
  try {
    const stored = localStorage.getItem("catecumen_lang");
    if (stored && SUPPORTED_LANGS.includes(stored)) return stored;
  } catch {}
  const nav = (navigator.language || "es").toLowerCase();
  const base = nav.split("-")[0];
  return SUPPORTED_LANGS.includes(base) ? base : "es";
}

export const LANG = detectLang();

export function setAppLanguage(code) {
  if (!SUPPORTED_LANGS.includes(code)) return;
  try { localStorage.setItem("catecumen_lang", code); } catch {}
  window.location.reload();
}

// T y PICK aplican el idioma activo a las funciones puras de logic.js.
export const T = (es, en = es, fr = es, de = es, pt = es, it = es) =>
  translate(LANG, es, en, fr, de, pt, it);
export const PICK = (obj) => pick(LANG, obj);

// Los valores internos de Sí/No se guardan siempre como "Sí"/"No" (son claves
// de datos); esto solo traduce lo que se MUESTRA.
export const SINO = (val) => PICK({
  es: val, en: val === "Sí" ? "Yes" : "No", fr: val === "Sí" ? "Oui" : "Non",
  de: val === "Sí" ? "Ja" : "Nein", pt: val === "Sí" ? "Sim" : "Não", it: val === "Sí" ? "Sì" : "No",
});
