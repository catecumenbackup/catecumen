// Cliente Supabase compartido. Se extrae de App.jsx para que cualquier
// componente/pantalla que salga del monolito lo importe directamente.
import { createClient } from "@supabase/supabase-js";

// IMPORTANTE: sanear la URL y la clave. Si la variable de entorno (o el Secret
// de CI en GitHub) se pegó con un salto de línea, un espacio o CUALQUIER basura
// extra alrededor, ese contenido se cuela en las cabeceras HTTP y rompe TODAS
// las llamadas a Supabase: con un \n fetch lanza "Invalid value"; con caracteres
// de más el servidor responde 401 "Invalid API key". Para blindarlo:
//  · URL: trim.
//  · Clave anon: se EXTRAE el JWT válido (eyJ….eyJ….firma) de lo que haya en la
//    variable, ignorando cualquier cosa pegada antes o después. Si no parece un
//    JWT (p. ej. clave con formato nuevo sb_…), se cae a quitar solo whitespace.
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || "").trim();
const _rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();
const _jwt = _rawKey.match(/eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/);
const SUPABASE_ANON_KEY = _jwt ? _jwt[0] : _rawKey.replace(/\s+/g, "");
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Catecumen: faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY en el archivo .env — ver PRODUCCION.md");
}

export const supabase = createClient(
  SUPABASE_URL || "https://invalid.supabase.co",
  SUPABASE_ANON_KEY || "anon",
);
