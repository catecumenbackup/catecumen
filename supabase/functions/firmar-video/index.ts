// supabase/functions/firmar-video/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// Firma una URL de Bunny Stream (HLS) con Token Authentication para proteger el
// contenido de pago. Solo firma URLs del host configurado (BUNNY_CDN_HOST) y solo
// para usuarios autenticados. Usa "token de directorio" (token_path = la carpeta
// del video) para que el playlist Y todos los segmentos .ts/.m4s validen con el
// mismo token — requisito de HLS.
//
// Algoritmo Bunny (Token Authentication v1):
//   hashableBase = securityKey + token_path + expires + userIp("") + "token_path="+token_path
//   token = base64url( SHA256_raw(hashableBase) )   ('+'->'-', '/'->'_', quita '=' y '\n')
//   urlFirmada = origin + path + "?token=<token>&token_path=<enc(dir)>&expires=<expires>"
// Ref: https://support.bunny.net/hc/en-us/articles/360016055099
//
// Despliegue (terminal, NO en el SQL Editor):
//   supabase functions deploy firmar-video --use-api      (evita Docker)
//   "Enforce JWT" en OFF: la función valida el JWT internamente.
// Secrets a crear en Supabase (Edge Functions → Secrets):
//   BUNNY_TOKEN_KEY  = la "Token Authentication Key" de tu Video Library
//   BUNNY_CDN_HOST   = el hostname de la library, p. ej. vz-abcd1234.b-cdn.net
// (SUPABASE_URL / SUPABASE_ANON_KEY los inyecta Supabase automáticamente.)
// ─────────────────────────────────────────────────────────────────────────────
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BUNNY_KEY = Deno.env.get("BUNNY_TOKEN_KEY") ?? "";
const BUNNY_HOST = Deno.env.get("BUNNY_CDN_HOST") ?? "";
const TTL_SEGUNDOS = 60 * 60 * 4; // 4 h — cubre una sesión de estudio larga

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...cors, "content-type": "application/json" },
  });
}

// Base64 URL-safe de bytes crudos, según el formato que exige Bunny.
function base64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\n/g, "").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

async function firmarDirectorio(dir: string, expires: number): Promise<string> {
  // Un solo parámetro firmado (token_path), sin IP (las IP móviles cambian y
  // romperían la reproducción a media sesión).
  const parameterData = "token_path=" + dir;
  const hashableBase = BUNNY_KEY + dir + expires + "" + parameterData;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(hashableBase));
  return base64url(new Uint8Array(digest));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  if (!BUNNY_KEY || !BUNNY_HOST) return json({ error: "server not configured" }, 500);

  try {
    // 1) El solicitante debe ser un usuario autenticado (alumno con sesión).
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "no auth" }, 401);
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: uErr } = await sb.auth.getUser();
    if (uErr || !user) return json({ error: "unauthorized" }, 401);

    // 2) Parsear y validar la URL solicitada (solo tu host de Bunny).
    const body = await req.json().catch(() => ({}));
    const raw = typeof body?.url === "string" ? body.url : "";
    if (!raw) return json({ error: "missing url" }, 400);
    let u: URL;
    try { u = new URL(raw); } catch { return json({ error: "bad url" }, 400); }
    if (u.hostname !== BUNNY_HOST) return json({ error: "host not allowed" }, 403);

    // 3) token_path = carpeta del archivo (/<guid>/) → cubre playlist + segmentos.
    const path = u.pathname;                                  // /<guid>/playlist.m3u8
    const dir = path.slice(0, path.lastIndexOf("/") + 1) || "/"; // /<guid>/
    const expires = Math.floor(Date.now() / 1000) + TTL_SEGUNDOS;
    const token = await firmarDirectorio(dir, expires);
    const signed = `${u.origin}${path}?token=${token}&token_path=${encodeURIComponent(dir)}&expires=${expires}`;

    return json({ url: signed, expires });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
