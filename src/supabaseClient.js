// Cliente Supabase compartido. Se extrae de App.jsx para que cualquier
// componente/pantalla que salga del monolito lo importe directamente.
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Catecumen: faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY en el archivo .env — ver PRODUCCION.md");
}

export const supabase = createClient(
  SUPABASE_URL || "https://invalid.supabase.co",
  SUPABASE_ANON_KEY || "anon",
);
