// supabase/functions/geocodificar-afiliados/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// Rellena lat/lng de parroquias y diócesis afiliadas geocodificando su dirección
// con Nominatim (OpenStreetMap, gratis). Solo para ADMIN. Procesa un lote por
// llamada (respetando el límite de 1 req/seg de Nominatim). Llámala varias veces
// hasta que no queden filas sin coordenadas (devuelve `pendientes`).
//
// Despliegue: supabase functions deploy geocodificar-afiliados --use-api
// "Enforce JWT" OFF (valida admin internamente). Usa SUPABASE_SERVICE_ROLE_KEY
// (auto-inyectada) para escribir las coordenadas.
// ─────────────────────────────────────────────────────────────────────────────
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const URL = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOTE = 12; // filas por llamada (12 × ~1.1s ≈ 14s, dentro del timeout)

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (o: unknown, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { ...cors, "content-type": "application/json" } });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function geocodificar(direccion: string, pais: string): Promise<{ lat: number; lng: number } | null> {
  const q = [direccion, pais].filter(Boolean).join(", ");
  if (!q) return null;
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
  const r = await fetch(url, { headers: { "User-Agent": "CatecumenAfiliados/1.0 (admin@catecumen.com)" } });
  if (!r.ok) return null;
  const arr = await r.json().catch(() => []);
  if (Array.isArray(arr) && arr[0]?.lat && arr[0]?.lon) {
    return { lat: parseFloat(arr[0].lat), lng: parseFloat(arr[0].lon) };
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);
  try {
    // Solo admin.
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "no auth" }, 401);
    const sbUser = createClient(URL, ANON, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await sbUser.auth.getUser();
    if (!user) return json({ error: "unauthorized" }, 401);
    const { data: esAdmin } = await sbUser.rpc("es_admin");
    if (!esAdmin) return json({ error: "forbidden" }, 403);

    const sb = createClient(URL, SERVICE); // service-role para escribir
    let procesadas = 0, fallidas = 0;

    for (const [tabla, campoResp] of [["parroquias", "nombre_pastor"], ["diocesis", "nombre_obispo"]] as const) {
      const { data: filas } = await sb.from(tabla)
        .select("registro_id, nombre, direccion, pais")
        .is("lat", null)
        .limit(LOTE);
      for (const f of (filas ?? [])) {
        const geo = await geocodificar(f.direccion ?? "", f.pais ?? "");
        if (geo) {
          await sb.from(tabla).update({ lat: geo.lat, lng: geo.lng }).eq("registro_id", f.registro_id);
          procesadas++;
        } else { fallidas++; }
        await sleep(1100); // límite de Nominatim: 1 req/seg
      }
    }

    // ¿Cuántas quedan sin coordenadas?
    const { count: pp } = await sb.from("parroquias").select("*", { count: "exact", head: true }).is("lat", null);
    const { count: pd } = await sb.from("diocesis").select("*", { count: "exact", head: true }).is("lat", null);

    return json({ procesadas, fallidas, pendientes: (pp ?? 0) + (pd ?? 0) });
  } catch (e) {
    console.error("geocodificar-afiliados:", e);
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
