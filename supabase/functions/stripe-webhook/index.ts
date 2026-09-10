// supabase/functions/stripe-webhook/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// Edge Function: Confirma el pago del lado del SERVIDOR y, solo entonces, crea
// la cuenta de Supabase Auth + el perfil en `usuarios`. Envía un correo cuando
// el pago se confirma o cuando un vale (OXXO/Boleto/Multibanco/etc.) expira sin
// pagarse.
//
// MÉTODOS DE PAGO INSTANTÁNEOS vs DIFERIDOS
// ───────────────────────────────────────────
// Tarjeta, iDEAL, Bancontact, EPS, Przelewy24: confirman en la misma sesión.
//   → Stripe dispara "checkout.session.completed" con payment_status="paid".
// OXXO, Boleto, Multibanco, Bacs/ACSS/ACH: el cliente recibe un vale/número y
// paga días después (en una tienda, banco o portal bancario).
//   → "checkout.session.completed" SÍ llega de inmediato, pero con
//     payment_status="unpaid" (el cliente solo generó el vale, no ha pagado).
//   → Cuando el pago realmente se confirma (a veces días después), Stripe
//     dispara "checkout.session.async_payment_succeeded".
//   → Si el vale vence sin pagarse, Stripe dispara
//     "checkout.session.async_payment_failed".
// Por eso esta función NUNCA crea la cuenta solo por recibir
// "checkout.session.completed" — siempre verifica payment_status==="paid",
// y además escucha los dos eventos asíncronos.
//
// Variables de entorno requeridas (Supabase Dashboard > Edge Functions > Secrets):
//   STRIPE_SECRET_KEY          – misma clave que usa crear-sesion-pago
//   STRIPE_WEBHOOK_SECRET      – firma del webhook (whsec_...)
//   SUPABASE_URL               – URL del proyecto
//   SUPABASE_SERVICE_ROLE_KEY  – clave de servicio
//   RESEND_API_KEY             – clave de Resend (resend.com) para enviar correos
//   RESEND_FROM                – remitente verificado en Resend,
//                                ej. "Catecumen <noreply@catecumen.com>"
//                                (el dominio debe estar verificado en Resend)
//
// Configuración en Stripe (Developers → Webhooks → tu endpoint → Add events):
//   checkout.session.completed
//   checkout.session.async_payment_succeeded
//   checkout.session.async_payment_failed
//
// Despliegue: supabase functions deploy stripe-webhook --no-verify-jwt
// ─────────────────────────────────────────────────────────────────────────────

import { serve }        from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe            from "https://esm.sh/stripe@14?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const resendApiKey  = Deno.env.get("RESEND_API_KEY");
const resendFrom    = Deno.env.get("RESEND_FROM") || "Catecumen <noreply@catecumen.com>";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const CERO_DECIMALES = new Set([
  "BIF","CLP","DJF","GNF","JPY","KMF","KRW","MGA","PYG",
  "RWF","UGX","VND","VUV","XAF","XOF","XPF",
]);

// ── Envío de correo (best-effort: si falla, se registra pero no rompe el flujo) ──
async function enviarCorreo(to: string, subject: string, html: string) {
  if (!resendApiKey) {
    console.warn("[stripe-webhook] RESEND_API_KEY no configurada — correo no enviado a", to);
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: resendFrom, to: [to], subject, html }),
    });
    if (!res.ok) console.error("[stripe-webhook] Resend error:", res.status, await res.text());
  } catch (e) {
    console.error("[stripe-webhook] Error enviando correo:", e);
  }
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

const emailVencido = (nombre: string) => `
  <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;padding:24px">
    <h1 style="color:#8B1A2E;font-size:20px">⚠️ Tu vale de pago venció</h1>
    <p>Hola ${nombre || ""},</p>
    <p>El plazo para pagar tu vale venció sin que se registrara el pago, así que tu inscripción no se completó y no se te realizó ningún cargo.</p>
    <p>Puedes intentarlo de nuevo cuando gustes desde la plataforma.</p>
    <p style="margin-top:24px">
      <a href="https://www.catecumen.com" style="background:#C8A951;color:#2A1E05;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Intentar de nuevo →</a>
    </p>
  </div>`;

// ── Crea la cuenta + perfil a partir de un registro pendiente ya PAGADO ──────
async function activarRegistro(session: Stripe.Checkout.Session, pendienteId: string) {
  const { data: pendiente, error: pendErr } = await supabase
    .from("registros_pendientes")
    .select("id, email, payload")
    .eq("id", pendienteId)
    .maybeSingle();

  if (pendErr) {
    console.error("[stripe-webhook] Error leyendo registro pendiente:", pendErr);
    return { ok: false, status: 500, error: pendErr.message };
  }
  if (!pendiente) {
    // Ya fue procesado antes (Stripe reintentó el evento) — no-op seguro.
    console.log(`[stripe-webhook] ${pendienteId} ya procesado o inexistente — no-op`);
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
    const cur2 = (session.currency || "").toUpperCase();
    const amt2 = session.amount_total ?? 0;
    const pagado2 = CERO_DECIMALES.has(cur2) ? amt2 : amt2 / 100;
    const { error: updErr } = await supabase.from("usuarios").update({
      estado_inscripcion: "activo",
      pago_realizado: true,
      importe_pagado: pagado2,
      moneda_pago: cur2,
      stripe_customer_id: (session.customer as string) || null,
      stripe_payment_id: (session.payment_intent as string) || null,
    }).eq("id", payload.usuario_id).eq("estado_inscripcion", "preinscrito");
    if (updErr) {
      console.error("[stripe-webhook] Error activando preinscrito:", updErr);
      return { ok: false, status: 500, error: updErr.message };
    }
    await supabase.from("registros_pendientes").delete().eq("id", pendienteId);
    console.log(`[stripe-webhook] Preinscrito activado: usuario=${payload.usuario_id} monto=${pagado2} ${cur2}`);
    return { ok: true, note: "preinscrito activado" };
  }

  // Cuenta en Supabase Auth (email ya confirmado, sin depender de la
  // configuración global de "Confirm email")
  const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
    email: formData.email, password: formData.password, email_confirm: true,
  });
  let uid: string | undefined = authUser?.user?.id;
  if (authErr || !uid) {
    const yaExiste = /already|registered|exists/i.test(authErr?.message || "");
    if (!yaExiste) {
      console.error("[stripe-webhook] Error creando usuario Auth:", authErr);
      return { ok: false, status: 500, error: authErr?.message || "No se pudo crear la cuenta" };
    }
    // Búsqueda directa por email (no listUsers(): está paginado a 50 y fallaba
    // en producción con >50 usuarios, dejando sin cuenta a quien pagó).
    const { data: uidEnc } = await supabase.rpc("uid_por_email", { p_email: formData.email });
    uid = (uidEnc as string | null) || undefined;
    if (!uid) return { ok: false, status: 500, error: "No se pudo resolver la cuenta del usuario" };
    // El auth user ya existía (registro/intento previo). Actualizamos su
    // contraseña a la del registro más reciente y confirmamos el email, para
    // que el usuario pueda iniciar sesión con la que acaba de escribir.
    const { error: updErr } = await supabase.auth.admin.updateUserById(uid, {
      password: formData.password, email_confirm: true,
    });
    if (updErr) console.error("[stripe-webhook] No se pudo actualizar contraseña:", updErr);
  }

  const iso = formData.codigo_iso_pais || "XX";
  let registroId: string | null = null;
  try {
    const { data: rid, error: ridErr } = await supabase.rpc("generar_registro_id",
      { p_tipo_usuario: userType, p_codigo_iso: iso });
    if (!ridErr && rid) registroId = rid as string;
  } catch (e) { console.error("[stripe-webhook] generar_registro_id:", e); }

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
    console.error("[stripe-webhook] Error insertando usuarios:", insErr);
    return { ok: false, status: 500, error: insErr.message };
  }

  await supabase.from("registros_pendientes").delete().eq("id", pendienteId);
  await enviarCorreo(formData.email, "✅ Tu pago fue confirmado — Catecumen",
    emailConfirmado(formData.nombre, registroId));

  console.log(`[stripe-webhook] Cuenta creada: usuario=${uid} registro_id=${registroId} monto=${importePagado} ${currency}`);
  return { ok: true, uid, registroId };
}

// ── Vale vencido sin pagar: avisa por correo y limpia el registro pendiente ──
async function expirarRegistro(pendienteId: string) {
  const { data: pendiente } = await supabase
    .from("registros_pendientes")
    .select("id, email, payload")
    .eq("id", pendienteId)
    .maybeSingle();
  if (!pendiente) return; // ya procesado o no existe — nada que hacer

  const nombre = (pendiente.payload as any)?.formData?.nombre || "";
  await enviarCorreo(pendiente.email, "⚠️ Tu vale de pago venció — Catecumen", emailVencido(nombre));
  await supabase.from("registros_pendientes").delete().eq("id", pendienteId);
  console.log(`[stripe-webhook] Registro pendiente ${pendienteId} expirado y notificado`);
}

serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const signature = req.headers.get("stripe-signature");
  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    if (!signature) throw new Error("Falta el header stripe-signature");
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[stripe-webhook] Firma inválida:", msg);
    return new Response(`Webhook signature error: ${msg}`, { status: 400 });
  }

  try {
    const session = event.data.object as Stripe.Checkout.Session;
    const pendienteId = session.metadata?.registro_pendiente_id || session.client_reference_id;

    if (!pendienteId) {
      return new Response(JSON.stringify({ received: true, warning: "sin registro_pendiente_id" }),
        { headers: { "Content-Type": "application/json" } });
    }

    let resultado: { ok: boolean; status?: number; error?: string } = { ok: true };

    if (event.type === "checkout.session.completed") {
      // OJO: este evento llega también para métodos diferidos (OXXO/Boleto/
      // Multibanco) en cuanto se genera el VALE — payment_status será "unpaid"
      // en ese caso. Solo activamos si realmente está pagado.
      if (session.payment_status === "paid") {
        resultado = await activarRegistro(session, pendienteId);
      } else {
        console.log(`[stripe-webhook] ${pendienteId}: sesión completa pero pago pendiente (${session.payment_status}) — esperando confirmación asíncrona`);
      }
    } else if (event.type === "checkout.session.async_payment_succeeded") {
      resultado = await activarRegistro(session, pendienteId);
    } else if (event.type === "checkout.session.async_payment_failed") {
      await expirarRegistro(pendienteId);
    } else {
      // Otros eventos: reconocidos sin acción.
    }

    if (!resultado.ok) {
      return new Response(JSON.stringify({ error: resultado.error }),
        { status: resultado.status || 500, headers: { "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ received: true }),
      { headers: { "Content-Type": "application/json" } });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[stripe-webhook]", msg);
    return new Response(JSON.stringify({ error: msg }),
      { status: 500, headers: { "Content-Type": "application/json" } });
  }
});