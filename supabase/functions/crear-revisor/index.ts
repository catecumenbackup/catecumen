// supabase/functions/crear-revisor/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// Edge Function: el ADMIN da de alta un REVISOR ECLESIÁSTICO.
//   · Crea la cuenta de auth (contraseña aleatoria, email confirmado).
//   · Inserta el perfil con tipo_usuario='revisor', estado_inscripcion='activo'
//     (acceso total sin pago, sin sacramentos, sin exigir datos de perfil).
//   · Genera un ENLACE DE INVITACIÓN de Supabase (type=recovery) para que el
//     sacerdote abra el enlace y SOLO fije su contraseña (página /recuperar).
//   · NO envía correo: devuelve el enlace para que el admin se lo haga llegar.
//
// SEGURIDAD (igual que admin-crear-usuario): valida el JWT del que llama y que
// esté en public.admins antes de usar service-role. Audita en admin_log.
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY,
//      REVISOR_REDIRECT_URL (opcional; default https://catecumen.com/recuperar/)
// Body POST (Authorization: Bearer <jwt-admin>):
//   { email?, telefono?, nombre?, apellido? }   (correo O teléfono; si no hay
//   correo, se genera un usuario de acceso sintético rev<digitos>@revisor.catecumen.com)
//   → { ok, user_id, email, telefono, enlace }  |  { error }
//
// Despliegue: supabase functions deploy crear-revisor --use-api
//   "Enforce JWT Verification" DESACTIVADA (validamos el JWT nosotros).
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
const ANON_KEY     = Deno.env.get("SUPABASE_ANON_KEY")!;
const REDIRECT_URL = Deno.env.get("REVISOR_REDIRECT_URL") || "https://www.catecumen.com/recuperar";
const SITE_URL     = Deno.env.get("REVISOR_SITE_URL") || "https://www.catecumen.com";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

function genPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const buf = new Uint8Array(20);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => chars[b % chars.length]).join("");
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    // 1) ¿Quién llama?
    const jwt = (req.headers.get("Authorization") || "").replace("Bearer ", "").trim();
    if (!jwt) return json({ error: "falta autenticación" }, 401);
    const asCaller = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const { data: userData, error: userErr } = await asCaller.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "sesión inválida" }, 401);
    const callerId = userData.user.id;
    const callerEmail = userData.user.email;

    // 2) ¿Es admin?
    const { data: adminRow } = await admin
      .from("admins").select("user_id").eq("user_id", callerId).maybeSingle();
    if (!adminRow) return json({ error: "no autorizado" }, 403);

    // 3) Validar entrada. Se acepta correo O teléfono. Si no hay correo, se
    //    genera un "usuario de acceso" sintético a partir del teléfono (el
    //    sacerdote nunca recibe correo: el admin le manda el ENLACE por WhatsApp).
    const body = await req.json();
    let email = String(body.email || "").trim().toLowerCase();
    const telefono = String(body.telefono || "").trim();
    const digits = telefono.replace(/\D/g, "");
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "correo inválido" }, 400);
    if (!email) {
      if (digits.length < 7) return json({ error: "indica un correo válido o un teléfono (mínimo 7 dígitos)" }, 400);
      email = "rev" + digits + "@revisor.catecumen.com";
    }
    const nombre   = String(body.nombre || "Revisor").trim() || "Revisor";
    const apellido = String(body.apellido || "eclesiástico").trim();

    // 4) Crear la cuenta de auth (contraseña aleatoria; el sacerdote la cambia por enlace)
    let uid: string;
    let reutilizada = false;
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email, password: genPassword(), email_confirm: true,
      user_metadata: { rol: "revisor" },
    });
    if (createErr || !created?.user) {
      const msg = createErr?.message || "no se pudo crear la cuenta";
      const dup = /already|registered|exists/i.test(msg);
      if (!dup) return json({ error: msg }, 400);
      // Ya existe: si es un REVISOR, reutilizamos la cuenta y regeneramos el enlace
      // (permite reenviar un enlace institucional nuevo sin duplicar).
      const { data: prof } = await admin.from("usuarios")
        .select("id, tipo_usuario").eq("email", email).maybeSingle();
      if (!prof || prof.tipo_usuario !== "revisor")
        return json({ error: "ya existe una cuenta con ese correo/usuario y no es un revisor" }, 400);
      uid = prof.id as string;
      reutilizada = true;
    } else {
      uid = created.user.id;
    }

    // 5) Insertar el perfil de revisor (solo si es cuenta nueva)
    if (!reutilizada) {
      const registroId = "REV-" + Date.now().toString(36).toUpperCase() + "-" +
        Math.random().toString(36).slice(2, 7).toUpperCase();
      const fila: Record<string, unknown> = {
        id: uid,
        tipo_usuario: "revisor",
        nombre, apellido, email,
        telefono: telefono || null,
        sacramentos_elegidos: null,
        registro_id: registroId,
        estado_inscripcion: "activo",
        cortesia: true,
        formacion_gratuita: true,
        pago_realizado: false,
      };
      const { error: insErr } = await admin.from("usuarios").insert(fila);
      if (insErr) {
        await admin.auth.admin.deleteUser(uid).catch(() => {});
        return json({ error: "no se pudo crear el perfil: " + insErr.message }, 500);
      }
    }

    // 6) Generar el enlace para que el sacerdote fije su contraseña (no envía correo)
    let enlace: string | null = null;
    try {
      const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
        type: "recovery", email,
        options: { redirectTo: REDIRECT_URL },
      });
      if (!linkErr) enlace = link?.properties?.action_link || null;
    } catch (_) { /* si falla, el admin puede regenerar desde el panel */ }

    // Enlace INSTITUCIONAL: envuelve el enlace de Supabase en catecumen.com/acceso/
    // (en el hash, para no mandar el token al servidor). La página /acceso redirige
    // al endpoint de verificación de Supabase. Así el sacerdote ve un enlace de la marca.
    const enlaceBranded = enlace ? (SITE_URL + "/acceso/#" + encodeURIComponent(enlace)) : null;

    // 7) Auditoría
    try {
      await admin.from("admin_log").insert({
        admin_id: callerId, admin_email: callerEmail,
        accion: reutilizada ? "revisor.enlace_regenerado" : "revisor.creado",
        entidad: "usuarios", entidad_id: uid,
        detalle: { email, nombre, apellido },
      });
    } catch (_) { /* la auditoría no debe tumbar la creación */ }

    return json({ ok: true, user_id: uid, email, telefono: telefono || null, reutilizada,
      enlace: enlaceBranded || enlace, enlace_directo: enlace });
  } catch (e) {
    return json({ error: String((e as Error)?.message || e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...CORS, "Content-Type": "application/json" },
  });
}
