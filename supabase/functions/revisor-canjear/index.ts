// supabase/functions/revisor-canjear/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// Canjea un ENLACE PROPIO de revisor (token de la tabla revisor_enlaces) por un
// enlace de recuperación de Supabase, generado al momento de abrirlo. Permite
// tener VARIOS enlaces por revisor, cada uno rastreable, revocable y borrable
// desde el panel (a diferencia del token único de Supabase).
//
// Público (sin auth): el token es el secreto. Un solo uso (usado_en), y deja de
// servir si está revocado o si la cuenta está suspendida/eliminada.
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (auto), REVISOR_REDIRECT_URL (opc).
// Body POST { token } → { enlace }  |  { error }
// Despliegue: supabase functions deploy revisor-canjear --use-api, "Enforce JWT" OFF.
// ─────────────────────────────────────────────────────────────────────────────

import { serve }        from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const REDIRECT_URL = Deno.env.get("REVISOR_REDIRECT_URL") || "https://www.catecumen.com/recuperar";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const { token } = await req.json();
    if (!token || typeof token !== "string") return json({ error: "token requerido" }, 400);

    const { data: row } = await admin.from("revisor_enlaces")
      .select("id, usuario_id, revocado, usado_en").eq("token", token).maybeSingle();
    if (!row) return json({ error: "enlace no válido" }, 400);
    if (row.revocado) return json({ error: "este enlace fue anulado" }, 400);
    if (row.usado_en) return json({ error: "este enlace ya se usó" }, 400);

    const { data: prof } = await admin.from("usuarios")
      .select("email, tipo_usuario, suspendido, eliminado").eq("id", row.usuario_id).maybeSingle();
    if (!prof || prof.tipo_usuario !== "revisor") return json({ error: "cuenta no válida" }, 400);
    if (prof.suspendido || prof.eliminado) return json({ error: "el acceso de este revisor fue revocado" }, 403);

    const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
      type: "recovery", email: prof.email, options: { redirectTo: REDIRECT_URL },
    });
    const action = link?.properties?.action_link;
    if (linkErr || !action) return json({ error: "no se pudo generar el acceso" }, 500);

    // Un solo uso: se marca tras generar con éxito.
    await admin.from("revisor_enlaces").update({ usado_en: new Date().toISOString() }).eq("id", row.id);

    return json({ enlace: action });
  } catch (e) {
    return json({ error: String((e as Error)?.message || e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...CORS, "Content-Type": "application/json" },
  });
}
