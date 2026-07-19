// supabase/functions/reanudar-pago/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// Edge Function: Permite a un usuario con un registro PENDIENTE de pago
// (llenó el formulario pero nunca completó el pago) generar una NUEVA sesión
// de Stripe Checkout sin volver a capturar sus datos — usando lo que ya
// quedó guardado en `registros_pendientes` cuando llamó a crear-sesion-pago.
//
// Flujo: el usuario escribe solo su correo → esta función busca su registro
// pendiente → si existe, crea una nueva sesión de Stripe con el mismo
// importe/moneda/datos ya capturados → el frontend redirige a esa URL.
//
// Variables de entorno requeridas:
//   STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// Invocación: POST { email, retorno } → { url } | { error }
//
// Despliegue: mantener "Enforce JWT Verification" DESACTIVADA.
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
    const { email, retorno } = await req.json();
    if (!email)   throw new Error("email requerido");
    if (!retorno) throw new Error("retorno requerido");

    // ── Si ya existe una cuenta activa con este correo, no hay nada que
    //    reanudar — debe iniciar sesión. ──────────────────────────────────
    const { count: yaActivo } = await supabase
      .from("usuarios")
      .select("id", { count: "exact", head: true })
      .ilike("email", email);
    if ((yaActivo ?? 0) > 0) {
      return new Response(
        JSON.stringify({ error: "cuenta_activa",
          mensaje: "Ya existe una cuenta activa con este correo. Inicia sesión." }),
        { status: 409, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

    // ── Buscar el registro pendiente ───────────────────────────────────
    const { data: pendiente, error: findErr } = await supabase
      .from("registros_pendientes")
      .select("id, payload")
      .ilike("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (findErr) {
      console.error("[reanudar-pago]", findErr);
      throw new Error("No se pudo buscar tu registro. Intenta de nuevo.");
    }
    if (!pendiente) {
      return new Response(
        JSON.stringify({ error: "no_encontrado",
          mensaje: "No encontramos un registro pendiente con ese correo." }),
        { status: 404, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

    const payload = pendiente.payload as {
      formData: Record<string, any>; userType: string; selectedSacs: string[];
      importe: number; moneda: string; descuento_pct: number;
    };
    const { formData, selectedSacs, importe, moneda } = payload;
    if (!importe || !moneda) {
      throw new Error("Tu registro pendiente no tiene datos de pago completos. Por favor regístrate de nuevo.");
    }

    // ── Crear una NUEVA sesión de Stripe para el MISMO registro pendiente ──
    const cur = String(moneda).toLowerCase();
    const unitAmount = CERO_DECIMALES.has(cur.toUpperCase())
      ? Math.round(importe)
      : Math.round(importe * 100);
    const listaSacs = Array.isArray(selectedSacs) && selectedSacs.length
      ? selectedSacs.join(", ")
      : "Formación Sacramental";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: formData.email,
      customer_creation: "always",
      client_reference_id: pendiente.id,
      line_items: [{
        price_data: {
          currency: cur,
          unit_amount: unitAmount,
          product_data: { name: `Catecumen — ${listaSacs}` },
        },
        quantity: 1,
      }],
      metadata: { registro_pendiente_id: pendiente.id },
      success_url: `${retorno}/?pago=procesando&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${retorno}/?pago=cancelado`,
    });

    if (!session.url) throw new Error("Stripe no devolvió una URL de checkout");

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...CORS, "Content-Type": "application/json" } },
    );

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[reanudar-pago]", msg);
    return new Response(
      JSON.stringify({ error: "error", mensaje: msg }),
      { status: 400, headers: { ...CORS, "Content-Type": "application/json" } },
    );
  }
});