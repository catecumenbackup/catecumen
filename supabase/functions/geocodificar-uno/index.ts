// supabase/functions/geocodificar-uno/index.ts
// Geocodifica UNA organización recién afiliada (parroquia o diócesis) y guarda
// lat/lng. La llama el flujo de registro justo tras insertar (fire-and-forget).
// Lee la dirección de la BD por su registro_id (NO acepta texto arbitrario, así
// no se puede abusar como proxy de geocodificación). Actualiza con service-role.
// Despliegue: supabase functions deploy geocodificar-uno --use-api ; JWT OFF.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (o: unknown, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { ...cors, "content-type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);
  try {
    const { tabla, registro_id } = await req.json().catch(() => ({}));
    if (!["parroquias", "diocesis"].includes(tabla) || !registro_id) return json({ error: "bad request" }, 400);

    const sb = createClient(URL, SERVICE);
    const { data: fila } = await sb.from(tabla).select("direccion, pais").eq("registro_id", registro_id).maybeSingle();
    if (!fila) return json({ error: "not found" }, 404);

    const q = [fila.direccion, fila.pais].filter(Boolean).join(", ");
    if (!q) return json({ ok: false, motivo: "sin dirección" });

    const r = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`,
      { headers: { "User-Agent": "CatecumenAfiliados/1.0 (admin@catecumen.com)" } },
    );
    const arr = r.ok ? await r.json().catch(() => []) : [];
    if (Array.isArray(arr) && arr[0]?.lat && arr[0]?.lon) {
      const lat = parseFloat(arr[0].lat), lng = parseFloat(arr[0].lon);
      await sb.from(tabla).update({ lat, lng }).eq("registro_id", registro_id);
      return json({ ok: true, lat, lng });
    }
    return json({ ok: false, motivo: "sin resultado" });
  } catch (e) {
    console.error("geocodificar-uno:", e);
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
