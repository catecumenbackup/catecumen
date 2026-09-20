// supabase/functions/crear-donativo/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// Edge Function: DONATIVO de apoyo a la plataforma.
// Registra el donativo como PENDIENTE y crea una Stripe Checkout Session
// (pago único → mode "payment"; mensual → mode "subscription").
// `stripe-webhook` lo marca COMPLETADO al confirmarse (metadata.tipo="donativo").
//
// A diferencia de `crear-sesion-pago`, aquí el MONTO lo elige libremente el
// donante (es un donativo), así que NO se recalcula contra una tarifa; solo se
// valida un rango sano server-side para evitar abusos (0, negativos, absurdos).
//
// Secrets requeridos (los mismos que crear-sesion-pago):
//   STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// Invocación (frontend):
//   POST .../functions/v1/crear-donativo
//   Body: { monto:number, moneda:string, recurrente:boolean, email?:string, retorno:string }
//   Respuesta: { url } → el frontend hace window.location.href = url
//
// Desplegar: supabase functions deploy crear-donativo --use-api  (Enforce JWT OFF)
// Requiere la tabla `donativos` (scripts/donativos.sql).
// ─────────────────────────────────────────────────────────────────────────────

import { serve }        from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe            from "https://esm.sh/stripe@14?target=deno";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CERO_DECIMALES = new Set([
  "BIF","CLP","DJF","GNF","JPY","KMF","KRW","MGA","PYG",
  "RWF","UGX","VND","VUV","XAF","XOF","XPF",
]);

// Rango sano para un donativo (en unidades mayores de la moneda). No es una
// tarifa: solo evita 0/negativos y cantidades absurdas por manipulación.
const MONTO_MIN = 5;
const MONTO_MAX = 1_000_000;

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const { monto, moneda, recurrente, email, retorno } = await req.json();

    // ── Validación ──────────────────────────────────────────────────────────
    if (!retorno) throw new Error("retorno requerido");
    const cantidad = Number(monto);
    if (!Number.isFinite(cantidad) || cantidad < MONTO_MIN || cantidad > MONTO_MAX) {
      return new Response(
        JSON.stringify({ error: "El monto del donativo no es válido." }),
        { status: 400, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }
    const cur = String(moneda || "MXN").toLowerCase();
    const esRecurrente = !!recurrente;
    const correo = typeof email === "string" && email.includes("@") ? email : null;

    // ── Registrar el donativo como PENDIENTE ──────────────────────────────────
    const { data: don, error: donErr } = await supabase
      .from("donativos")
      .insert({
        email: correo,
        monto: cantidad,
        moneda: cur.toUpperCase(),
        recurrente: esRecurrente,
        estado: "pendiente",
      })
      .select("id")
      .single();
    if (donErr || !don) {
      console.error("[crear-donativo] insert donativo:", donErr);
      throw new Error("No se pudo preparar el donativo. Intenta de nuevo.");
    }

    // ── Crear la sesión de Stripe Checkout ────────────────────────────────────
    const unitAmount = CERO_DECIMALES.has(cur.toUpperCase())
      ? Math.round(cantidad)
      : Math.round(cantidad * 100);

    const nombre = esRecurrente
      ? "Donativo mensual — Apoyo a Catecumen"
      : "Donativo — Apoyo a Catecumen";

    const price_data: Record<string, unknown> = {
      currency: cur,
      unit_amount: unitAmount,
      product_data: { name: nombre },
    };
    if (esRecurrente) price_data.recurring = { interval: "month" };

    const params: Record<string, unknown> = {
      mode: esRecurrente ? "subscription" : "payment",
      payment_method_types: ["card"],
      // Datos de facturación OPCIONALES: en vez del campo nativo de Stripe
      // ("Compro como empresa", solo para identificaciones fiscales de empresa),
      // usamos campos PROPIOS con etiqueta clara para que también las personas
      // físicas los entiendan. Son opcionales: quien quiere factura escribe su
      // RFC; quien no, solo dona. Los valores llegan en session.custom_fields
      // (webhook) y se ven en el panel de Stripe bajo el pago.
      billing_address_collection: "auto",
      custom_fields: [
        {
          key: "rfc",
          label: { type: "custom", custom: "RFC para factura (opcional)" },
          type: "text",
          optional: true,
          text: { minimum_length: 12, maximum_length: 13 },
        },
        {
          key: "razonsocial",
          label: { type: "custom", custom: "Nombre o razón social para factura (opcional)" },
          type: "text",
          optional: true,
        },
      ],
      client_reference_id: don.id,
      line_items: [{ price_data, quantity: 1 }],
      metadata: { tipo: "donativo", donativo_id: don.id },
      success_url: `${retorno}/?donativo=gracias`,
      cancel_url:  `${retorno}/?donativo=cancelado`,
    };
    if (correo) params.customer_email = correo;
    if (esRecurrente) {
      // Que la metadata también viaje en la suscripción (para el webhook).
      params.subscription_data = { metadata: { tipo: "donativo", donativo_id: don.id } };
    } else {
      params.customer_creation = "always";
    }

    const session = await stripe.checkout.sessions.create(params as any);
    if (!session.url) throw new Error("Stripe no devolvió una URL de checkout");

    // Guardar el id de sesión para conciliar con el webhook.
    await supabase.from("donativos")
      .update({ stripe_session_id: session.id })
      .eq("id", don.id);

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...CORS, "Content-Type": "application/json" } },
    );

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[crear-donativo]", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 400, headers: { ...CORS, "Content-Type": "application/json" } },
    );
  }
});
