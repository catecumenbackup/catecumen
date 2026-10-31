// supabase/functions/admin-crear-usuario/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// Edge Function: el ADMIN crea un usuario directamente (sin pasar por el pago).
//   · tipo_acceso = "pago"     → cuenta activa normal (como si hubiera pagado).
//   · tipo_acceso = "cortesia" → acceso gratuito con VIGENCIA: fija
//       formacion_inicio=now y formacion_limite=now+vigencia_dias, así el
//       bloqueo de plazo existente corta el acceso al expirar. Marca cortesia=true.
//
// SEGURIDAD (igual que admin-eliminar-usuario):
//   1) Lee el JWT del que llama (Authorization).  2) Verifica que esté en
//   public.admins.  3) Solo entonces usa service-role.  4) Audita en admin_log.
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY.
// Body POST (Authorization: Bearer <jwt-admin>):
//   { email, password?, nombre, apellido, tipo_usuario, sacramentos?[],
//     pais?, estado?, idioma?, tipo_acceso: "pago"|"cortesia", vigencia_dias? }
//   → { ok, user_id, email, password }  (password = la usada/generada, para
//      que el admin la comparta)  |  { error }
//
// Despliegue: supabase functions deploy admin-crear-usuario --use-api
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

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

const TIPOS = ["catecumeno", "prebautismal", "padrino", "catequista"];
const SACS_VALIDOS = ["bautismo", "confirmacion", "primera_comunion"];

function genPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const buf = new Uint8Array(14);
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

    // 3) Validar entrada
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const tipo_usuario = String(body.tipo_usuario || "").trim();
    const tipo_acceso = body.tipo_acceso === "cortesia" ? "cortesia" : "pago";
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "correo inválido" }, 400);
    if (!TIPOS.includes(tipo_usuario)) return json({ error: "tipo de usuario inválido" }, 400);

    let sacramentos: string[] | null = null;
    if (tipo_usuario === "catecumeno") {
      sacramentos = (Array.isArray(body.sacramentos) ? body.sacramentos : [])
        .filter((s: unknown) => SACS_VALIDOS.includes(String(s)));
      if (!sacramentos.length) return json({ error: "elige al menos un sacramento para el catecúmeno" }, 400);
    }

    let vigenciaLimite: string | null = null;
    if (tipo_acceso === "cortesia") {
      const dias = Math.round(Number(body.vigencia_dias));
      if (!Number.isFinite(dias) || dias < 1 || dias > 3650)
        return json({ error: "vigencia_dias debe ser un número entre 1 y 3650" }, 400);
      vigenciaLimite = new Date(Date.now() + dias * 86400000).toISOString();
    }

    // Acceso restringido (solo cortesía): acceso total (default) o solo una lista.
    const accesoRestringido = tipo_acceso === "cortesia" && !!body.acceso_restringido;
    const videosPermitidos: string[] = accesoRestringido && Array.isArray(body.videos_permitidos)
      ? body.videos_permitidos.filter((v: unknown) => typeof v === "string" && v) : [];
    if (accesoRestringido && videosPermitidos.length === 0)
      return json({ error: "elige al menos un video para el acceso restringido" }, 400);

    const password = String(body.password || "").trim() || genPassword();
    if (password.length < 6) return json({ error: "la contraseña debe tener al menos 6 caracteres" }, 400);

    // 4) Crear la cuenta de auth
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email, password, email_confirm: true,
    });
    if (createErr || !created?.user) {
      const msg = createErr?.message || "no se pudo crear la cuenta";
      const dup = /already|registered|exists/i.test(msg);
      return json({ error: dup ? "ya existe una cuenta con ese correo" : msg }, 400);
    }
    const uid = created.user.id;

    // 5) Insertar el perfil
    const registroId = "ADM-" + Date.now().toString(36).toUpperCase() + "-" +
      Math.random().toString(36).slice(2, 7).toUpperCase();
    const fila: Record<string, unknown> = {
      id: uid,
      tipo_usuario,
      nombre: String(body.nombre || "").trim(),
      apellido: String(body.apellido || "").trim(),
      email,
      pais_residencia: body.pais || null,
      estado_residencia: body.estado || null,
      idioma: body.idioma || null,
      sacramentos_elegidos: sacramentos,
      registro_id: registroId,
      estado_inscripcion: "activo",
      cortesia: tipo_acceso === "cortesia",
      acceso_restringido: accesoRestringido,
      formacion_gratuita: tipo_acceso === "cortesia",
      pago_realizado: tipo_acceso === "pago",
    };
    if (vigenciaLimite) {
      fila.formacion_inicio = new Date().toISOString();
      fila.formacion_limite = vigenciaLimite;
    }

    const { error: insErr } = await admin.from("usuarios").insert(fila);
    if (insErr) {
      // Rollback: si falla el perfil, borra la cuenta de auth para no dejar huérfanos.
      await admin.auth.admin.deleteUser(uid).catch(() => {});
      return json({ error: "no se pudo crear el perfil: " + insErr.message }, 500);
    }

    // Acceso restringido: guarda la lista de videos permitidos.
    if (accesoRestringido && videosPermitidos.length) {
      const filas = videosPermitidos.map((v) => ({ usuario_id: uid, video_id: v }));
      const { error: avErr } = await admin.from("acceso_videos_usuario").insert(filas);
      if (avErr) console.error("[admin-crear-usuario] acceso_videos:", avErr);
    }

    // 6) Auditoría
    try {
      await admin.from("admin_log").insert({
        admin_id: callerId, admin_email: callerEmail,
        accion: "usuario.creado_" + tipo_acceso,
        entidad: "usuarios", entidad_id: uid,
        detalle: { email, tipo_usuario, tipo_acceso, vigencia_limite: vigenciaLimite, sacramentos },
      });
    } catch (_) { /* la auditoría no debe tumbar la creación */ }

    return json({ ok: true, user_id: uid, email, password,
      vigencia_limite: vigenciaLimite, tipo_acceso });
  } catch (e) {
    return json({ error: String((e as Error)?.message || e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...CORS, "Content-Type": "application/json" },
  });
}
