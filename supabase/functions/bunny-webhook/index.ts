// supabase/functions/bunny-webhook/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// Recibe el WEBHOOK de Bunny Stream y registra la HORA REAL de fin de
// codificación de cada video. Bunny no expone esa hora en su API; el webhook es
// la única fuente real: al pasar un video a "Finished" (Status=3) manda
// `{ VideoLibraryId, VideoGuid, Status, EventId, Timestamp }` donde `Timestamp`
// es la hora UTC del evento (no de la entrega). La guardamos en
// `bunny_codificaciones`; el monitor la lee por la RPC pública.
//
// SEGURIDAD: validamos la firma HMAC-SHA256 del cuerpo CRUDO con la Read-Only
// API key de la librería (secret BUNNY_READONLY_KEY). Si no coincide → 401.
// Sin esa validación cualquiera podría inyectar horas falsas.
//
// Despliegue (terminal, NO en el SQL Editor):
//   supabase functions deploy bunny-webhook --use-api
//   "Enforce JWT" en OFF (Bunny no manda JWT; la autenticidad la da la firma).
// Secret:  supabase secrets set BUNNY_READONLY_KEY=<Read-Only API key de la librería>
//   (SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY los inyecta Supabase solo.)
// ─────────────────────────────────────────────────────────────────────────────
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const READONLY_KEY = Deno.env.get("BUNNY_READONLY_KEY") ?? "";
const STATUS_FINISHED = 3; // 3 = Finished (codificación terminada, video disponible)

function resp(body: string, status = 200): Response {
  return new Response(body, { status, headers: { "content-type": "text/plain" } });
}

async function hmacHex(key: string, body: string): Promise<string> {
  const k = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(body));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Comparación en tiempo constante de dos cadenas hex de igual longitud.
function timingSafeEqual(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return resp("method not allowed", 405);

  // 1) Cuerpo CRUDO (la firma se calcula sobre estos bytes exactos; NO re-serializar).
  const raw = await req.text();

  // 2) Validar la firma del webhook.
  const ver = req.headers.get("X-BunnyStream-Signature-Version") ?? "";
  const alg = req.headers.get("X-BunnyStream-Signature-Algorithm") ?? "";
  const sig = (req.headers.get("X-BunnyStream-Signature") ?? "").toLowerCase();
  if (!READONLY_KEY) return resp("server not configured", 500);
  if (ver !== "v1" || alg !== "hmac-sha256") return resp("bad signature headers", 401);
  const expected = await hmacHex(READONLY_KEY, raw);
  if (!timingSafeEqual(expected, sig)) return resp("invalid signature", 401);

  // 3) Procesar. Respondemos 2xx siempre que la firma sea válida (aunque el
  //    evento no sea "Finished") para que Bunny no reintente.
  try {
    const d = JSON.parse(raw) as {
      VideoLibraryId?: number;
      VideoGuid?: string;
      Status?: number;
      EventId?: string;
      Timestamp?: string;
      IsLiveStreamWebhook?: boolean;
    };

    if (d.IsLiveStreamWebhook) return resp("ok (live ignored)");
    if (d.Status !== STATUS_FINISHED || !d.VideoGuid) return resp("ok");

    const svc = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    // Upsert por guid: guardamos la hora REAL del evento (Timestamp de Bunny).
    const { error } = await svc.from("bunny_codificaciones").upsert({
      guid: d.VideoGuid,
      library_id: d.VideoLibraryId ?? null,
      status: d.Status,
      codificado_en: d.Timestamp ?? new Date().toISOString(),
      event_id: d.EventId ?? null,
      actualizado_en: new Date().toISOString(),
    }, { onConflict: "guid" });
    if (error) return resp("db error: " + error.message, 500);

    return resp("ok");
  } catch (e) {
    return resp("bad payload: " + String((e as Error)?.message ?? e), 400);
  }
});
