// Cliente Supabase compartido. Se extrae de App.jsx para que cualquier
// componente/pantalla que salga del monolito lo importe directamente.
import { createClient } from "@supabase/supabase-js";

// IMPORTANTE: limpiar espacios/saltos de línea. Si la variable de entorno (o el
// Secret de CI en GitHub) se pega con un \n o un espacio al final, ese carácter
// se cuela como valor de cabecera HTTP y fetch lanza
// "Failed to execute 'fetch' on 'Window': Invalid value", tumbando TODAS las
// llamadas a Supabase (login incluido). Un JWT no lleva espacios internos, así
// que quitar todo whitespace de la clave es seguro; a la URL se le hace trim.
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || "").trim();
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").replace(/\s+/g, "");
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Catecumen: faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY en el archivo .env — ver PRODUCCION.md");
}

export const supabase = createClient(
  SUPABASE_URL || "https://invalid.supabase.co",
  SUPABASE_ANON_KEY || "anon",
);
