// supabase/functions/preinscribir/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// Edge Function: crea la cuenta de un PREINSCRITO (sin pago) del lado del
// servidor con service-role. Igual que activar-pago pero SIN Stripe: deja al
// usuario en estado 'preinscrito'. Se hace en el servidor (no en el cliente)
// para evitar el bloqueo de RLS al insertar en `usuarios` y para resolver de
// forma segura un auth.user huérfano de un intento previo (createUser + update).
//
// Body: { formData, userType, selectedSacs, importe_previsto }
// Respuesta: { ok:true, uid } · o { error } con status 4xx.
//
// Despliegue: supabase functions deploy preinscribir --use-api  (JWT OFF).
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
async function emailAdmin(subject: string, html: string) {
  if (!RESEND_API_KEY) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: RESEND_FROM, to: [ADMIN_EMAIL], subject, html }),
    });
  } catch (e) { console.error("[preinscribir] emailAdmin:", e); }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const { formData, userType, selectedSacs, importe_previsto } = await req.json();
    if (!formData?.email)    throw new Error("formData.email requerido");
    if (!formData?.password) throw new Error("formData.password requerido");
    if (!userType)           throw new Error("userType requerido");

    // Rechaza si ya existe una cuenta REAL (fila en usuarios) con ese correo.
    const { count } = await supabase.from("usuarios")
      .select("id", { count: "exact", head: true }).ilike("email", formData.email);
    if ((count ?? 0) > 0) {
      return new Response(JSON.stringify({ error:
        "Ya existe una cuenta con este correo. Inicia sesión o recupera tu contraseña." }),
        { status: 409, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    // Cuenta de Auth (email confirmado). Si ya existe un huérfano de un intento
    // previo, lo resolvemos y le fijamos la contraseña actual.
    const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
      email: formData.email, password: formData.password, email_confirm: true,
    });
    let uid: string | undefined = authUser?.user?.id;
    if (authErr || !uid) {
      const yaExiste = /already|registered|exists/i.test(authErr?.message || "");
      if (!yaExiste) throw new Error(authErr?.message || "No se pudo crear la cuenta");
      const { data: lista } = await supabase.auth.admin.listUsers();
      uid = lista?.users?.find(u => u.email?.toLowerCase() === formData.email.toLowerCase())?.id;
      if (!uid) throw new Error("No se pudo resolver la cuenta del usuario");
      await supabase.auth.admin.updateUserById(uid, {
        password: formData.password, email_confirm: true,
      });
    }

    const iso = formData.codigo_iso_pais || "XX";
    let registroId: string | null = null;
    try {
      const { data: rid, error: ridErr } = await supabase.rpc("generar_registro_id",
        { p_tipo_usuario: userType, p_codigo_iso: iso });
      if (!ridErr && rid) registroId = rid as string;
    } catch (e) { console.error("[preinscribir] generar_registro_id:", e); }

    const pb = importe_previsto || formData.priceBreakdown || null;
    const fila = {
      id: uid, tipo_usuario: userType,
      nombre: formData.nombre || "", apellido: formData.apellido || "",
      email: formData.email, fecha_nacimiento: formData.dob || null,
      pais_residencia: formData.country || "", codigo_iso_pais: iso,
      estado_residencia: formData.estado || null,
      idioma: formData.idioma || null,
      tipo_documento: formData.tipo_documento || "", numero_documento: formData.docNum || "",
      codigo_pais_tel: formData.phoneCode || null, telefono: formData.phone || null,
      parroquia_nombre: formData.parroquia || null, parroquia_no_segura: !!formData.noSure,
      par_estado: formData.parEstado || null, par_municipio: formData.parMunicipio || null,
      par_calle: formData.parCalle || null, par_numero: formData.parNumero || null,
      afiliada_org: formData.afiliadaOrg || null, org_registro_id: formData.orgRegistroId || null,
      estado_civil: formData.estadoCivil || null,
      vive_con_pareja: formData.viveConPareja || null,
      vive_con_pareja_soltero: formData.viveConParejaSoltero || null,
      plan_casarse_iglesia: formData.planCasarseIglesia || null,
      vive_nueva_pareja: formData.viveNuevaPareja || null,
      esta_internado: !!formData.estaInternado,
      tipo_inst_internado: formData.tipoInstInternado || null,
      nombre_inst: formData.nombreInst || null, pais_inst: formData.paisInst || null,
      estado_inst: formData.estadoInst || null, municipio_inst: formData.municipioInst || null,
      instalacion_inst: formData.instalacionInst || null,
      tel_inst_codigo: formData.telInstCodigo || null, tel_inst: formData.telInst || null,
      familiar_nombre: formData.familiarNombre || null,
      familiar_tel_codigo: formData.familiarTelCodigo || null, familiar_tel: formData.familiarTel || null,
      es_paciente_rehab: !!formData.esPacienteRehabilitacion,
      nombre_centro_rehab: formData.nombreCentroRehab || null,
      pais_centro_rehab: formData.paisCentroRehab || null,
      estado_centro_rehab: formData.estadoCentroRehab || null,
      sacs_beneficiario: formData.sacsBeneficiario || null,
      sacramentos_elegidos: (selectedSacs && selectedSacs.length ? selectedSacs : null),
      registro_id: registroId,
      formacion_gratuita: !!formData.freeRegistration,
      beca_solidaria: !!formData.estaInternado,
      beca_esperanza: !!formData.esPacienteRehabilitacion,
      pago_realizado: false,
      importe_pagado: null,
      moneda_pago: pb?.cur || null,
      estado_inscripcion: "preinscrito",
      importe_previsto: pb,
    };

    const { error: insErr } = await supabase.from("usuarios")
      .upsert(fila, { onConflict: "id", ignoreDuplicates: true });
    if (insErr) {
      console.error("[preinscribir] insert usuarios:", insErr);
      throw new Error(insErr.message);
    }

    // Aviso para el panel de administración (no bloquea si falla).
    try {
      await supabase.from("notificaciones_admin").insert({
        tipo: "preinscripcion", titulo: "Nueva preinscripción",
        detalle: { nombre: `${formData.nombre||""} ${formData.apellido||""}`.trim(),
                   email: formData.email, pais: formData.country||"", perfil: userType },
        ref_id: uid,
      });
      await emailAdmin("Catecumen · Nueva preinscripción",
        `<div style="font-family:Arial,sans-serif"><h2 style="color:#9C7A28">🔔 Nueva preinscripción</h2>
         <p><b>${(formData.nombre||"")} ${(formData.apellido||"")}</b> — ${formData.email}<br>${formData.country||""} · ${userType}</p>
         <p><a href="https://www.catecumen.com/admin/">Abrir el panel →</a></p></div>`);
    } catch (e) { console.error("[preinscribir] notif:", e); }

    console.log(`[preinscribir] Preinscrito creado: usuario=${uid} registro_id=${registroId}`);
    return new Response(JSON.stringify({ ok: true, uid, registroId }),
      { headers: { ...CORS, "Content-Type": "application/json" } });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[preinscribir]", msg);
    return new Response(JSON.stringify({ error: msg }),
      { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });
  }
});
