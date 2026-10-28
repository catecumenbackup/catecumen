// supabase/functions/resend-webhook/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// Recibe los webhooks de Resend (entrega, apertura, rebote, queja…) y los
// guarda en public.correos_eventos para que el admin confirme recibido/leído.
//
// Verifica la firma Svix que envía Resend (cabeceras svix-id/svix-timestamp/
// svix-signature) con el secret del webhook. Si NO está configurado el secret
// (RESEND_WEBHOOK_SECRET), registra igual pero deja constancia de "sin firma"
// (útil para pruebas; en producción conviene fijar el secret).
//
// Secrets:  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (inyectados por Supabase),
//           RESEND_WEBHOOK_SECRET (lo da Resend al crear el endpoint: whsec_...).
// Despliegue:  supabase functions deploy resend-webhook --use-api   (JWT OFF:
//           lo llama Resend, no un usuario con sesión).
// ─────────────────────────────────────────────────────────────────────────────

import { serve }        from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const WEBHOOK_SECRET = Deno.env.get("RESEND_WEBHOOK_SECRET") || "";

const b64decode = (s: string): Uint8Array =>
  Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const b64encode = (b: ArrayBuffer): string =>
  btoa(String.fromCharCode(...new Uint8Array(b)));

// Verificación de firma estilo Svix (la que usa Resend).
async function firmaValida(payload: string, headers: Headers): Promise<boolean> {
  if (!WEBHOOK_SECRET) return true; // sin secret configurado: no se exige firma
  const id  = headers.get("svix-id");
  const ts  = headers.get("svix-timestamp");
  const sig = headers.get("svix-signature");
  if (!id || !ts || !sig) return false;

  const secretB64 = WEBHOOK_SECRET.startsWith("whsec_")
    ? WEBHOOK_SECRET.slice(6) : WEBHOOK_SECRET;
  let keyBytes: Uint8Array;
  try { keyBytes = b64decode(secretB64); }
  catch { keyBytes = new TextEncoder().encode(secretB64); }

  const key = await crypto.subtle.importKey(
    "raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signed = `${id}.${ts}.${payload}`;
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signed));
  const expected = b64encode(mac);

  // svix-signature = "v1,<base64>  v1,<base64> ..."
  return sig.split(" ").some((part) => {
    const v = part.includes(",") ? part.split(",")[1] : part;
    return v === expected;
  });
}

serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("ok");
  const body = await req.text();

  if (!(await firmaValida(body, req.headers))) {
    console.error("[resend-webhook] firma inválida");
    return new Response("invalid signature", { status: 401 });
  }

  let evt: any;
  try { evt = JSON.parse(body); } catch { return new Response("bad json", { status: 400 }); }

  const tipo = String(evt?.type || "");                 // p.ej. "email.delivered"
  const evento = tipo.startsWith("email.") ? tipo.slice(6) : tipo;
  const data = evt?.data || {};
  const to = Array.isArray(data.to) ? data.to.join(", ") : (data.to || null);
  // Etiqueta: buscamos un tag llamado "categoria" si lo enviamos al mandar el correo.
  let etiqueta: string | null = null;
  if (Array.isArray(data.tags)) {
    const t = data.tags.find((x: any) => x?.name === "categoria");
    if (t) etiqueta = String(t.value);
  }

  try {
    await supabase.from("correos_eventos").insert({
      email_id:     data.email_id || data.id || null,
      evento:       evento || "desconocido",
      destinatario: to,
      asunto:       data.subject || null,
      etiqueta,
      ocurrido:     evt?.created_at || data.created_at || null,
      payload:      evt,
    });
  } catch (e) {
    console.error("[resend-webhook] insert:", e);
    // 200 igual: evita que Resend reintente en bucle por un fallo de BD.
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
