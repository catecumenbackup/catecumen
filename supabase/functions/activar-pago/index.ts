// supabase/functions/activar-pago/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// Edge Function: RESPALDO de activación de cuenta (independiente del webhook).
//
// Por qué existe: normalmente es stripe-webhook quien, al confirmar el pago,
// crea la cuenta de Auth + el perfil en `usuarios` a partir de
// `registros_pendientes`. Si el webhook falla, no está configurado, o su
// secreto/clave no coincide (fácil de cruzar cuando manejas varias cuentas de
// Stripe), el usuario paga pero queda BLOQUEADO sin poder entrar.
//
// Esta función se llama desde el frontend AL VOLVER de Stripe. Verifica el
// pago directamente contra Stripe y, si está pagado, crea la cuenta ella misma.
// Es IDEMPOTENTE con el webhook: ambos leen el mismo `registros_pendientes` y
// usan la misma guarda + upsert, así que solo se crea UNA cuenta pase lo que
// pase (corra primero el webhook, esta función, o ambos casi a la vez).
//
// Devuelve además el `payment_status` para que el frontend muestre el mensaje
// correcto (paid / unpaid / error) — reemplaza a consultar-estado-pago en el
// flujo de retorno.
//
// Variables de entorno requeridas (Supabase > Edge Functions > Secrets):
//   STRIPE_SECRET_KEY          – misma cuenta/modo que crear-sesion-pago
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   RESEND_API_KEY (opcional)  – para el correo de confirmación
//   RESEND_FROM    (opcional)
//
// Despliegue: supabase functions deploy activar-pago --no-verify-jwt
// (se llama justo al volver de Stripe, sin sesión de usuario iniciada).
// ─────────────────────────────────────────────────────────────────────────────

import { serve }        from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe            from "https://esm.sh/stripe@14?target=deno";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const resendApiKey = Deno.env.get("RESEND_API_KEY");
const resendFrom   = Deno.env.get("RESEND_FROM") || "Catecumen <noreply@catecumen.com>";
const adminEmail   = Deno.env.get("ADMIN_NOTIF_EMAIL") || "admin@catecumen.com";

const CERO_DECIMALES = new Set([
  "BIF","CLP","DJF","GNF","JPY","KMF","KRW","MGA","PYG",
  "RWF","UGX","VND","VUV","XAF","XOF","XPF",
]);

async function enviarCorreo(to: string, subject: string, html: string) {
  if (!resendApiKey) return;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: resendFrom, to: [to], subject, html }),
    });
    if (!res.ok) console.error("[activar-pago] Resend error:", res.status, await res.text());
  } catch (e) { console.error("[activar-pago] Error enviando correo:", e); }
}

const emailConfirmado = (nombre: string, registroId?: string | null) => `
  <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;padding:24px">
    <h1 style="color:#9C7A28;font-size:20px">✅ ¡Tu pago fue confirmado!</h1>
    <p>Hola ${nombre || ""},</p>
    <p>Tu inscripción a Catecumen ya está activa. Puedes iniciar sesión ahora mismo con el correo y la contraseña que creaste durante tu registro.</p>
    ${registroId ? `<div style="margin:20px 0;padding:14px 18px;background:#FBF6EA;border:1px solid #E5C97A;border-radius:8px">
      <p style="margin:0;color:#5A5342;font-size:13px">Tu número de identificación</p>
      <p style="margin:4px 0 0;color:#9C7A28;font-size:20px;font-weight:bold;letter-spacing:1px">${registroId}</p>
      <p style="margin:8px 0 0;color:#5A5342;font-size:12px">Consérvalo: identifica tu formación y aparecerá en tus constancias.</p>
    </div>` : ""}
    <p style="margin-top:24px">
      <a href="https://www.catecumen.com" style="background:#C8A951;color:#2A1E05;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Iniciar sesión →</a>
    </p>
  </div>`;

// ── Crea la cuenta + perfil a partir de un registro pendiente ya PAGADO ──────
// Idéntico en efecto a activarRegistro() de stripe-webhook, endurecido para
// que la ejecución concurrente (webhook + esta función) sea segura:
//  · guarda por existencia del registro pendiente (si ya no está → no-op)
//  · upsert con ignoreDuplicates sobre `usuarios` (evita error de PK en carrera)
async function activarRegistro(session: Stripe.Checkout.Session, pendienteId: string) {
  const { data: pendiente, error: pendErr } = await supabase
    .from("registros_pendientes")
    .select("id, email, payload")
    .eq("id", pendienteId)
    .maybeSingle();

  if (pendErr) {
    console.error("[activar-pago] Error leyendo registro pendiente:", pendErr);
    return { ok: false, error: pendErr.message };
  }
  if (!pendiente) {
    // Ya lo procesó el webhook (o una llamada previa) — no-op seguro.
    return { ok: true, note: "ya procesado" };
  }

  const payload = pendiente.payload as {
    formData: Record<string, any>; userType: string; selectedSacs: string[];
    conversion?: boolean; usuario_id?: string;
  };
  const { formData, userType, selectedSacs } = payload;

  // ── Fase 2 — CONVERSIÓN de preinscrito: la cuenta YA existe; solo la
  //    activamos (no se crea otra). Idempotente por el filtro estado. ──────────
  if (payload.conversion && payload.usuario_id) {
    const currency = (session.currency || "").toUpperCase();
    const amountTotal = session.amount_total ?? 0;
    const importePagado = CERO_DECIMALES.has(currency) ? amountTotal : amountTotal / 100;
    const { error: updErr } = await supabase.from("usuarios").update({
      estado_inscripcion: "activo",
      pago_realizado: true,
      importe_pagado: importePagado,
      moneda_pago: currency,
      stripe_customer_id: (session.customer as string) || null,
      stripe_payment_id: (session.payment_intent as string) || null,
    }).eq("id", payload.usuario_id).eq("estado_inscripcion", "preinscrito");
    if (updErr) {
      console.error("[activar-pago] Error activando preinscrito:", updErr);
      return { ok: false, error: updErr.message };
    }
    await supabase.from("registros_pendientes").delete().eq("id", pendienteId);
    await enviarCorreo(formData?.email || "", "✅ Tu pago fue confirmado — Catecumen",
      emailConfirmado(formData?.nombre || "", null));
    try {
      await supabase.from("notificaciones_admin").insert({
        tipo: "registro", titulo: "Preinscrito completó su inscripción (pago)",
        detalle: { email: formData?.email || "", monto: importePagado, moneda: currency },
        ref_id: `conv-${payload.usuario_id}`,
      });
      await enviarCorreo(adminEmail, "Catecumen · Preinscrito completó su inscripción",
        `<div style="font-family:Arial,sans-serif"><h2 style="color:#9C7A28">🔔 Preinscrito completó su inscripción (pago)</h2>
         <p>${formData?.email || ""} — ${importePagado} ${currency}</p>
         <p><a href="https://www.catecumen.com/admin/">Abrir el panel →</a></p></div>`);
    } catch (e) { console.error("[activar-pago] notif:", e); }
    console.log(`[activar-pago] Preinscrito activado: usuario=${payload.usuario_id} monto=${importePagado} ${currency}`);
    return { ok: true, uid: payload.usuario_id, note: "preinscrito activado" };
  }

  const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
    email: formData.email, password: formData.password, email_confirm: true,
  });
  let uid: string | undefined = authUser?.user?.id;
  if (authErr || !uid) {
    const yaExiste = /already|registered|exists/i.test(authErr?.message || "");
    if (!yaExiste) {
      console.error("[activar-pago] Error creando usuario Auth:", authErr);
      return { ok: false, error: authErr?.message || "No se pudo crear la cuenta" };
    }
    // Búsqueda directa por email (no listUsers(): está paginado a 50 y fallaba
    // en producción con >50 usuarios, dejando sin cuenta a quien pagó).
    const { data: uidEnc } = await supabase.rpc("uid_por_email", { p_email: formData.email });
    uid = (uidEnc as string | null) || undefined;
    if (!uid) return { ok: false, error: "No se pudo resolver la cuenta del usuario" };
    // El auth user ya existía (registro/intento previo). Su contraseña podría
    // ser de un intento anterior y no coincidir con la que el usuario acaba de
    // escribir → login 400. La actualizamos a la del registro más reciente y
    // confirmamos el email, para que pueda entrar con lo que registró ahora.
    // (crear-sesion-pago ya rechaza correos con cuenta REAL en `usuarios`, así
    //  que aquí solo llegan huérfanos del propio usuario, no cuentas ajenas.)
    const { error: updErr } = await supabase.auth.admin.updateUserById(uid, {
      password: formData.password, email_confirm: true,
    });
    if (updErr) console.error("[activar-pago] No se pudo actualizar contraseña:", updErr);
  }

  const iso = formData.codigo_iso_pais || "XX";
  let registroId: string | null = null;
  try {
    const { data: rid, error: ridErr } = await supabase.rpc("generar_registro_id",
      { p_tipo_usuario: userType, p_codigo_iso: iso });
    if (!ridErr && rid) registroId = rid as string;
  } catch (e) { console.error("[activar-pago] generar_registro_id:", e); }

  const currency = (session.currency || "").toUpperCase();
  const amountTotal = session.amount_total ?? 0;
  const importePagado = CERO_DECIMALES.has(currency) ? amountTotal : amountTotal / 100;

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
    formacion_gratuita: false,
    beca_solidaria: !!formData.estaInternado,
    beca_esperanza: !!formData.esPacienteRehabilitacion,
    pago_realizado: true,
    importe_pagado: importePagado,
    moneda_pago: currency,
    stripe_customer_id: (session.customer as string) || null,
    stripe_payment_id: (session.payment_intent as string) || null,
  };

  const { error: insErr } = await supabase
    .from("usuarios")
    .upsert(fila, { onConflict: "id", ignoreDuplicates: true });
  if (insErr) {
    console.error("[activar-pago] Error insertando usuarios:", insErr);
    return { ok: false, error: insErr.message };
  }

  await supabase.from("registros_pendientes").delete().eq("id", pendienteId);
  await enviarCorreo(formData.email, "✅ Tu pago fue confirmado — Catecumen",
    emailConfirmado(formData.nombre, registroId));
  // Aviso para el panel (dedup por ref_id = uid; el webhook no vuelve a insertarlo).
  try {
    await supabase.from("notificaciones_admin").insert({
      tipo: "registro", titulo: "Nuevo registro (pago confirmado)",
      detalle: { nombre: `${formData.nombre||""} ${formData.apellido||""}`.trim(),
                 email: formData.email, pais: formData.country||"", perfil: userType,
                 monto: importePagado, moneda: currency },
      ref_id: uid,
    });
    await enviarCorreo(adminEmail, "Catecumen · Nuevo registro (pago confirmado)",
      `<div style="font-family:Arial,sans-serif"><h2 style="color:#9C7A28">🔔 Nuevo registro (pago confirmado)</h2>
       <p><b>${(formData.nombre||"")} ${(formData.apellido||"")}</b> — ${formData.email}<br>${formData.country||""} · ${userType} · ${importePagado} ${currency}</p>
       <p><a href="https://www.catecumen.com/admin/">Abrir el panel →</a></p></div>`);
  } catch (e) { console.error("[activar-pago] notif:", e); }

  console.log(`[activar-pago] Cuenta creada: usuario=${uid} registro_id=${registroId} monto=${importePagado} ${currency}`);
  return { ok: true, uid, registroId };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const { session_id } = await req.json();
    if (!session_id) throw new Error("session_id requerido");

    const session = await stripe.checkout.sessions.retrieve(session_id);
    const payment_status = session.payment_status; // "paid" | "unpaid" | "no_payment_required"

    let activated = false;
    if (payment_status === "paid") {
      const pendienteId = session.metadata?.registro_pendiente_id || session.client_reference_id;
      if (pendienteId) {
        const r = await activarRegistro(session, pendienteId as string);
        // Si falla la activación NO rompemos el retorno: el pago está confirmado
        // y el webhook puede completarla; el frontend igual mostrará "paid".
        activated = !!r.ok;
        if (!r.ok) console.error("[activar-pago] activación no completada:", r.error);
      } else {
        console.warn("[activar-pago] sesión pagada sin registro_pendiente_id");
      }
    }

    return new Response(JSON.stringify({ payment_status, activated }),
      { headers: { ...CORS, "Content-Type": "application/json" } });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[activar-pago]", msg);
    return new Response(JSON.stringify({ error: msg }),
      { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });
  }
});