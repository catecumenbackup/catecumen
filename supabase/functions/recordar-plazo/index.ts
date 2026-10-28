// supabase/functions/recordar-plazo/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// Recordatorios de vencimiento del plazo de formación. Un cron diario (pg_cron
// + pg_net) invoca esta función; ella pide los avisos pendientes a la RPC
// `plazo_recordatorios_pendientes`, envía un correo por Resend a cada alumno en
// su idioma y marca el hito con `plazo_recordatorio_marcar` (no se repite).
//
// Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (inyectados),
//          RESEND_API_KEY, RESEND_FROM (opcional; si hay ajuste correo_remitente
//          se usa ese), RECORDATORIOS_SECRET (opcional; si se define, se exige
//          la cabecera x-cron-secret con ese valor).
// Despliegue: supabase functions deploy recordar-plazo --use-api  (JWT OFF).
// Cron: ver scripts/cron-recordatorios.sql
// ─────────────────────────────────────────────────────────────────────────────

import { serve }        from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM_DEF = Deno.env.get("RESEND_FROM") || "Catecumen <noreply@catecumen.com>";
const CRON_SECRET     = Deno.env.get("RECORDATORIOS_SECRET") || "";

const esc = (s: unknown) => String(s ?? "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function remitenteFrom(): Promise<string> {
  try {
    const { data } = await supabase.from("ajustes").select("valor").eq("clave", "correo_remitente").maybeSingle();
    const f = (data?.valor as any)?.from;
    if (f && typeof f === "string" && f.trim()) return f.trim();
  } catch { /* usa el valor por defecto */ }
  return RESEND_FROM_DEF;
}

// Textos por idioma. {n} = nombre, {d} = días restantes.
const L: Record<string, { subject: (d: number) => string; saludo: string; cuerpo: (d: number) => string; cta: string; cierre: string }> = {
  es: { subject: (d) => `Tu formación en Catecumen vence en ${d} día${d === 1 ? "" : "s"}`,
        saludo: "Hola", cta: "Entrar a mi formación",
        cuerpo: (d) => `Te recordamos que el plazo para concluir tu formación vence en <b>${d} día${d === 1 ? "" : "s"}</b>. Al vencer, el acceso al curso se bloqueará. Si necesitas más tiempo, puedes solicitar una prórroga desde la plataforma y la administración la revisará.`,
        cierre: "Que Dios te bendiga. — Equipo Catecumen" },
  en: { subject: (d) => `Your Catecumen formation ends in ${d} day${d === 1 ? "" : "s"}`,
        saludo: "Hello", cta: "Go to my formation",
        cuerpo: (d) => `This is a reminder that your deadline to complete your formation is in <b>${d} day${d === 1 ? "" : "s"}</b>. When it ends, access to the course will be blocked. If you need more time, you can request an extension from the platform and the administration will review it.`,
        cierre: "God bless you. — The Catecumen Team" },
  fr: { subject: (d) => `Votre formation Catecumen se termine dans ${d} jour${d === 1 ? "" : "s"}`,
        saludo: "Bonjour", cta: "Accéder à ma formation",
        cuerpo: (d) => `Nous vous rappelons que le délai pour terminer votre formation expire dans <b>${d} jour${d === 1 ? "" : "s"}</b>. À l'expiration, l'accès au cours sera bloqué. Si vous avez besoin de plus de temps, vous pouvez demander une prolongation depuis la plateforme.`,
        cierre: "Que Dieu vous bénisse. — L'équipe Catecumen" },
  de: { subject: (d) => `Deine Catecumen-Ausbildung endet in ${d} Tag${d === 1 ? "" : "en"}`,
        saludo: "Hallo", cta: "Zu meiner Ausbildung",
        cuerpo: (d) => `Zur Erinnerung: Die Frist zum Abschluss deiner Ausbildung läuft in <b>${d} Tag${d === 1 ? "" : "en"}</b> ab. Danach wird der Zugang zum Kurs gesperrt. Wenn du mehr Zeit brauchst, kannst du über die Plattform eine Verlängerung beantragen.`,
        cierre: "Gott segne dich. — Das Catecumen-Team" },
  pt: { subject: (d) => `Sua formação no Catecumen termina em ${d} dia${d === 1 ? "" : "s"}`,
        saludo: "Olá", cta: "Acessar minha formação",
        cuerpo: (d) => `Lembramos que o prazo para concluir sua formação termina em <b>${d} dia${d === 1 ? "" : "s"}</b>. Ao vencer, o acesso ao curso será bloqueado. Se precisar de mais tempo, pode solicitar uma prorrogação pela plataforma.`,
        cierre: "Que Deus te abençoe. — Equipe Catecumen" },
  it: { subject: (d) => `La tua formazione su Catecumen scade tra ${d} giorno${d === 1 ? "" : "i"}`,
        saludo: "Ciao", cta: "Vai alla mia formazione",
        cuerpo: (d) => `Ti ricordiamo che il termine per completare la tua formazione scade tra <b>${d} giorno${d === 1 ? "" : "i"}</b>. Alla scadenza l'accesso al corso verrà bloccato. Se ti serve più tempo, puoi richiedere una proroga dalla piattaforma.`,
        cierre: "Dio ti benedica. — Il team Catecumen" },
};

function correoHtml(lang: string, nombre: string, d: number): { subject: string; html: string } {
  const t = L[lang] || L.es;
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:22px;color:#2A1E05">
    <h2 style="color:#9C7A28;font-size:20px;margin:0 0 12px">⏳ ${esc(t.subject(d))}</h2>
    <p style="font-size:15px">${esc(t.saludo)}${nombre ? " " + esc(nombre) : ""},</p>
    <p style="font-size:15px;line-height:1.5">${t.cuerpo(d)}</p>
    <p style="margin:22px 0"><a href="https://www.catecumen.com/" style="background:#C8A951;color:#2A1E05;padding:11px 22px;border-radius:8px;text-decoration:none;font-weight:bold">${esc(t.cta)} →</a></p>
    <p style="font-size:13px;color:#5A5342;margin-top:18px">${esc(t.cierre)}</p>
  </div>`;
  return { subject: t.subject(d), html };
}

serve(async (req: Request) => {
  if (CRON_SECRET && req.headers.get("x-cron-secret") !== CRON_SECRET) {
    return new Response("forbidden", { status: 403 });
  }
  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY no configurada" }), { status: 500 });
  }

  const { data: pend, error } = await supabase.rpc("plazo_recordatorios_pendientes");
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  const from = await remitenteFrom();
  let enviados = 0, fallidos = 0;
  for (const row of (pend || []) as any[]) {
    const lang = (row.idioma || "es").slice(0, 2).toLowerCase();
    const { subject, html } = correoHtml(lang, row.nombre || "", row.dias_restantes);
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [row.email], subject, html,
          tags: [{ name: "categoria", value: "recordatorio_plazo" }] }),
      });
      if (!res.ok) { fallidos++; console.error("[recordar-plazo] Resend", res.status, await res.text()); continue; }
      await supabase.rpc("plazo_recordatorio_marcar", { p_usuario: row.usuario_id, p_hito: row.hito });
      enviados++;
    } catch (e) { fallidos++; console.error("[recordar-plazo]", e); }
  }
  return new Response(JSON.stringify({ ok: true, enviados, fallidos, candidatos: (pend || []).length }),
    { headers: { "Content-Type": "application/json" } });
});
