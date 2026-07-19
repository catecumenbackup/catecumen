// supabase/functions/admin-eliminar-usuario/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// Edge Function: BORRADO TOTAL e irreversible de un usuario.
// Elimina la fila de auth.users (y en cascada sus datos ligados por FK).
// Requiere service-role, por eso va aquí y NO en el frontend.
//
// SEGURIDAD: valida que QUIEN LLAMA es un administrador autenticado.
//   1) Lee el JWT del usuario que llama (header Authorization).
//   2) Con ese JWT resuelve su id y comprueba que está en public.admins.
//   3) Solo entonces usa service-role para borrar al usuario objetivo.
//   4) Registra la acción en admin_log.
//
// Variables de entorno requeridas:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY
//
// Invocación: POST { user_id, motivo? } con header Authorization: Bearer <jwt-del-admin>
//   → { ok: true } | { error }
//
// Despliegue: mantener "Enforce JWT Verification" DESACTIVADA
//   (validamos el JWT nosotros mismos dentro de la función).
// ─────────────────────────────────────────────────────────────────────────────

import { serve }        from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL  = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY      = Deno.env.get("SUPABASE_ANON_KEY")!;

// Cliente con service-role (puede borrar de auth.users)
const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    // 1) Autenticación: ¿quién llama?
    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace("Bearer ", "").trim();
    if (!jwt) {
      return json({ error: "falta autenticación" }, 401);
    }

    // Cliente que actúa como el usuario que llama, para resolver su identidad
    const asCaller = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const { data: userData, error: userErr } = await asCaller.auth.getUser();
    if (userErr || !userData?.user) {
      return json({ error: "sesión inválida" }, 401);
    }
    const callerId = userData.user.id;
    const callerEmail = userData.user.email;

    // 2) ¿Es admin? (consulta con service-role a public.admins)
    const { data: adminRow } = await admin
      .from("admins").select("user_id").eq("user_id", callerId).maybeSingle();
    if (!adminRow) {
      return json({ error: "no autorizado" }, 403);
    }

    // 3) Datos de la petición
    const { user_id, motivo } = await req.json();
    if (!user_id) return json({ error: "falta user_id" }, 400);
    if (user_id === callerId) return json({ error: "no puedes eliminarte a ti mismo" }, 400);

    // No permitir eliminar a otro admin
    const { data: targetAdmin } = await admin
      .from("admins").select("user_id").eq("user_id", user_id).maybeSingle();
    if (targetAdmin) return json({ error: "no se puede eliminar a un administrador" }, 400);

    // 4) Registrar en auditoría ANTES de borrar (para conservar el rastro)
    await admin.from("admin_log").insert({
      admin_id: callerId,
      admin_email: callerEmail,
      accion: "usuario.borrado_total",
      entidad: "auth.users",
      entidad_id: user_id,
      detalle: { motivo: motivo || null },
    });

    // 5) Borrado total e irreversible
    const { error: delErr } = await admin.auth.admin.deleteUser(user_id);
    if (delErr) {
      return json({ error: "error al eliminar: " + delErr.message }, 500);
    }

    return json({ ok: true });
  } catch (e) {
    return json({ error: String(e?.message || e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
