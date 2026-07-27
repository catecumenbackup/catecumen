// supabase/functions/consultar-magisterium/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// Proxy al Chat Completions de Magisterium AI (API OpenAI-compatible). Oculta la
// API key (nunca llega al navegador), exige que el solicitante sea un usuario
// autenticado, e inyecta un system prompt que fija el idioma y el contexto de
// catequesis. Devuelve { content, citations, related_questions }.
//
// Despliegue (terminal, NO en el SQL Editor):
//   supabase functions deploy consultar-magisterium --use-api   (evita Docker)
//   "Enforce JWT" en OFF: la función valida el JWT internamente.
// Secrets a crear en Supabase (Edge Functions → Secrets):
//   MAGISTERIUM_API_KEY   = la API key de tu cuenta Magisterium (developers/docs)
//   MAGISTERIUM_BASE_URL  = (opcional) por defecto https://www.magisterium.com/api/v1
//   MAGISTERIUM_MODEL     = (opcional) por defecto magisterium-1
// (SUPABASE_URL / SUPABASE_ANON_KEY los inyecta Supabase automáticamente.)
// ─────────────────────────────────────────────────────────────────────────────
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const KEY = Deno.env.get("MAGISTERIUM_API_KEY") ?? "";
const BASE = (Deno.env.get("MAGISTERIUM_BASE_URL") ?? "https://www.magisterium.com/api/v1").replace(/\/$/, "");
const MODEL = Deno.env.get("MAGISTERIUM_MODEL") ?? "magisterium-1";
const LIMITE_SEMANAL = Number(Deno.env.get("MAGISTERIUM_LIMITE_SEMANAL") ?? "10"); // consultas por alumno / 7 días
const VENTANA_DIAS = 7;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (o: unknown, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { ...cors, "content-type": "application/json" } });

const LANG_NAME: Record<string, string> = {
  es: "español", en: "English", fr: "français", de: "Deutsch", pt: "português", it: "italiano",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);
  if (!KEY) return json({ error: "server not configured" }, 500);

  try {
    // 1) Usuario autenticado (alumno con sesión).
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "no auth" }, 401);
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: uErr } = await sb.auth.getUser();
    if (uErr || !user) return json({ error: "unauthorized" }, 401);

    // 1.5) Límite por alumno (10 / 7 días). Se comprueba ANTES de gastar en la
    // API; solo se registra la consulta si Magisterium responde (más abajo).
    const { data: cupo } = await sb.rpc("consultas_ia_disponibles", {
      p_limite: LIMITE_SEMANAL, p_dias: VENTANA_DIAS,
    });
    const usadas = Number(cupo?.usadas ?? 0);
    const limite = Number(cupo?.limite ?? LIMITE_SEMANAL);
    if (usadas >= limite) {
      return json({ limited: true, usadas, limite }, 200); // regla de negocio, no error
    }

    // 2) Sanitizar la conversación: solo role/content, últimos turnos, con tope.
    const body = await req.json().catch(() => ({}));
    const rawMsgs = Array.isArray(body?.messages) ? body.messages : [];
    const clean = rawMsgs
      .filter((m: unknown): m is { role: string; content: string } =>
        !!m && (( m as { role?: string }).role === "user" || (m as { role?: string }).role === "assistant") &&
        typeof (m as { content?: unknown }).content === "string")
      .slice(-12)
      .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
    if (!clean.length) return json({ error: "no messages" }, 400);

    const idioma = LANG_NAME[body?.lang] ?? "español";
    const system = {
      role: "system",
      content: `Eres un asistente de catequesis católica para la plataforma Catecumen. ` +
        `Responde SIEMPRE en ${idioma}, con fidelidad al Magisterio de la Iglesia Católica, ` +
        `de forma clara, caritativa y apropiada para personas en formación sacramental. ` +
        `Cita las fuentes magisteriales cuando corresponda y evita opinar sobre temas ajenos a la fe.`,
    };

    // 3) Llamada a Magisterium (OpenAI-compatible).
    const r = await fetch(`${BASE}/chat/completions`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ model: MODEL, messages: [system, ...clean], stream: false }),
    });
    if (!r.ok) {
      const detail = await r.text().catch(() => "");
      return json({ error: "magisterium_error", status: r.status, detail: detail.slice(0, 600) }, 502);
    }
    const data = await r.json();

    // Consulta exitosa → registrar el consumo (cuenta para el límite semanal).
    await sb.rpc("registrar_consulta_ia").catch(() => {});

    return json({
      content: data?.choices?.[0]?.message?.content ?? "",
      citations: data?.citations ?? [],
      related_questions: data?.related_questions ?? [],
      restantes: Math.max(0, limite - (usadas + 1)),
    });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
