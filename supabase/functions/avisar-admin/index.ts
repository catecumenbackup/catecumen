// supabase/functions/avisar-admin/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// Registra un aviso para el admin (tabla notificaciones_admin) Y envía un correo
// a admin@catecumen.com vía Resend. Punto único para los eventos del CLIENTE
// (soporte, consulta al catequista, registro gratuito por beca/afiliación).
// Los eventos del servidor (preinscribir, activar-pago) insertan el aviso y
// envían su propio correo directamente.
//
// Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY,
//          RESEND_FROM (opcional), ADMIN_NOTIF_EMAIL (opcional, def admin@catecumen.com).
// Despliegue: supabase functions deploy avisar-admin --use-api  (JWT OFF: soporte
// y consulta pueden dispararse sin sesión iniciada).
// ─────────────────────────────────────────────────────────────────────────────

import { serve }        from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM     = Deno.env.get("RESEND_FROM") || "Catecumen <noreply@catecumen.com>";
const ADMIN_EMAIL     = Deno.env.get("ADMIN_NOTIF_EMAIL") || "admin@catecumen.com";

const esc = (s: unknown) => String(s ?? "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function enviarCorreoAdmin(titulo: string, detalle: Record<string, unknown> | null) {
  if (!RESEND_API_KEY) return;
  const filas = Object.entries(detalle || {})
    .filter(([, v]) => v != null && v !== "")
    .map(([k, v]) => `<tr><td style="color:#5A5342;padding:3px 10px;font-size:13px">${esc(k)}</td><td style="padding:3px 10px;font-size:13px">${esc(v)}</td></tr>`)
    .join("");
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:540px;margin:0 auto;padding:20px">
    <h2 style="color:#9C7A28;font-size:18px">🔔 ${esc(titulo)}</h2>
    ${filas ? `<table style="border-collapse:collapse;margin:8px 0">${filas}</table>` : ""}
    <p style="margin-top:18px"><a href="https://www.catecumen.com/admin/" style="background:#C8A951;color:#2A1E05;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Abrir el panel →</a></p>
  </div>`;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: RESEND_FROM, to: [ADMIN_EMAIL], subject: `Catecumen · ${titulo}`, html }),
    });
    if (!res.ok) console.error("[avisar-admin] Resend:", res.status, await res.text());
  } catch (e) { console.error("[avisar-admin] Resend error:", e); }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const { tipo, titulo, detalle } = await req.json();
    if (!titulo) throw new Error("titulo requerido");
    // 1) Aviso en el panel (siempre, aunque falle el correo).
    try {
      await supabase.from("notificaciones_admin").insert({ tipo: tipo || "aviso", titulo, detalle: detalle || null });
    } catch (e) { console.error("[avisar-admin] insert:", e); }
    // 2) Correo al admin (best-effort).
    await enviarCorreoAdmin(titulo, detalle || null);
    return new Response(JSON.stringify({ ok: true }), { headers: { ...CORS, "Content-Type": "application/json" } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });
  }
});
