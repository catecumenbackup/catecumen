// supabase/functions/demo-sesion/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// Sesión de DEMOSTRACIÓN pública (sin cuenta). Devuelve el video que el admin
// designó en ajustes('demo'), ya FIRMADO con el token de Bunny, para que un
// visitante ANÓNIMO pueda reproducirlo. Firma ÚNICAMENTE ese video (el de la
// demo); ningún otro video del catálogo es accesible por aquí, así que el resto
// del contenido de pago sigue protegido.
//
// Sin auth (Enforce JWT OFF). Lee la config y el video con service role.
// Reutiliza EXACTAMENTE el mismo algoritmo de firma que `firmar-video`
// (token de directorio). Secrets: BUNNY_TOKEN_KEY, BUNNY_CDN_HOST (ya existen).
//
// Despliegue (terminal, NO en el SQL Editor):
//   supabase functions deploy demo-sesion --use-api
//   "Enforce JWT" en OFF.
// ─────────────────────────────────────────────────────────────────────────────
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BUNNY_KEY = Deno.env.get("BUNNY_TOKEN_KEY") ?? "";
const BUNNY_HOST = Deno.env.get("BUNNY_CDN_HOST") ?? "";
const TTL_SEGUNDOS = 60 * 60 * 4; // 4 h

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), { status, headers: { ...cors, "content-type": "application/json" } });
}
function base64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\n/g, "").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
async function firmarDirectorio(dir: string, expires: number): Promise<string> {
  const parameterData = "token_path=" + dir;
  const hashableBase = BUNNY_KEY + dir + expires + "" + parameterData;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(hashableBase));
  return base64url(new Uint8Array(digest));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);
  try {
    const svc = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1) Config de la demo.
    const { data: aj } = await svc.from("ajustes").select("valor").eq("clave", "demo").maybeSingle();
    const cfg = (aj?.valor ?? {}) as { activa?: boolean; slug?: string; orden?: number };
    if (!cfg.activa) return json({ activa: false });
    const slug = cfg.slug || "kerigma";
    const orden = Number(cfg.orden || 1);

    // 2) Sacramento + video (idioma es).
    const { data: sac } = await svc.from("sacramentos").select("id,nombre_es,nombre_en").eq("slug", slug).maybeSingle();
    if (!sac) return json({ activa: true, slug, orden, url: null, sub: null, nombre: null });
    const { data: vid } = await svc.from("videos")
      .select("url_video,url_subtitulos")
      .eq("sacramento_id", sac.id).eq("orden", orden).eq("idioma", "es").maybeSingle();

    const nombre = sac.nombre_es ?? sac.nombre_en ?? slug;
    const sub = vid?.url_subtitulos ?? null;
    let url = vid?.url_video ?? null;

    // 3) Firmar si es una URL de Bunny; si no hay URL real (PENDIENTE), devolver null
    //    para que el frontend caiga al video de prueba de esa sección.
    if (!url || url === "PENDIENTE") {
      return json({ activa: true, slug, orden, url: null, sub, nombre });
    }
    try {
      const u = new URL(url);
      if (BUNNY_KEY && BUNNY_HOST && u.hostname === BUNNY_HOST) {
        const path = u.pathname;
        const dir = path.slice(0, path.lastIndexOf("/") + 1) || "/";
        const expires = Math.floor(Date.now() / 1000) + TTL_SEGUNDOS;
        const token = await firmarDirectorio(dir, expires);
        url = `${u.origin}${path}?token=${token}&token_path=${encodeURIComponent(dir)}&expires=${expires}`;
      }
    } catch { /* no es URL absoluta (mp4 local): se usa tal cual */ }

    return json({ activa: true, slug, orden, url, sub, nombre });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
