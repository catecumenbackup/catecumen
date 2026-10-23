// src/track.js
// Monitor de clics ANÓNIMO. Registra un evento de interfaz en el backend propio
// (RPC pública `registrar_evento`, sin cookies ni datos personales) y, si el
// usuario aceptó cookies y GA está cargado, también manda el evento a GA4.
//
// Es "fire-and-forget": nunca lanza ni bloquea la UI; si falla la red, se ignora.
import { supabase } from "./supabaseClient.js";

export function track(evento) {
  if (!evento) return;
  // 1) Backend propio (anónimo, siempre).
  try {
    supabase.rpc("registrar_evento", {
      p_evento: evento,
      p_ua: (typeof navigator !== "undefined" && navigator.userAgent) || null,
      p_lang: (typeof navigator !== "undefined" && navigator.language) || null,
      p_ref: (typeof document !== "undefined" && document.referrer) || null,
    }).then(() => {}, () => {});
  } catch { /* no-op */ }
  // 2) Google Analytics (solo si el usuario aceptó cookies → gtag existe).
  try {
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", evento, { event_category: "home" });
    }
  } catch { /* no-op */ }
}
