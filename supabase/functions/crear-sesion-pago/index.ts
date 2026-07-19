// supabase/functions/crear-sesion-pago/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// Edge Function: Guarda el registro como PENDIENTE (no crea la cuenta todavía)
// y crea una Stripe Checkout Session. La cuenta y el perfil en `usuarios` se
// crean únicamente cuando stripe-webhook confirma el pago (checkout.session.completed).
//
// Por qué: antes la cuenta se creaba client-side ANTES de ir a Stripe. Si el
// pago fallaba o se abandonaba, quedaba un usuario huérfano en auth.users que
// bloqueaba reintentos futuros con "ya existe una cuenta" — aunque nunca
// aparecía una fila en `usuarios`. Este diseño elimina ese problema de raíz.
//
// Requiere la tabla `registros_pendientes` (ver migracion-registro-pago.sql).
//
// Variables de entorno requeridas (Supabase Dashboard > Edge Functions > Secrets):
//   STRIPE_SECRET_KEY          – Clave secreta de Stripe
//   SUPABASE_URL               – URL del proyecto
//   SUPABASE_SERVICE_ROLE_KEY  – Clave de servicio (bypasses RLS)
//
// Invocación (PaymentModal.handlePay en App.jsx):
//   POST https://<project>.supabase.co/functions/v1/crear-sesion-pago
//   Body: {
//     formData:      object  (TODO el objeto de registro, incluida `password` en texto plano —
//                             viaja por HTTPS y solo se guarda en una tabla sin acceso público;
//                             el webhook la usa una sola vez para crear la cuenta y la descarta)
//     userType:      string
//     selectedSacs:  string[]
//     importe:       number  (monto FINAL a cobrar — YA incluye cualquier descuento de beca)
//     moneda:        string  (ISO 4217, ej. "MXN")
//     descuento_pct: number  (solo informativo/auditoría)
//     retorno:       string  (origin del sitio)
//   }
//
// Respuesta: { url: string } → el frontend hace window.location.href = url
//            Error de correo duplicado → { error: "..." } con status 409
//
// Despliegue: mantener "Enforce JWT Verification" DESACTIVADA (igual que ya
// la tienes), ya que esta función no usa el token del usuario para nada.
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
    const {
      formData, userType, selectedSacs,
      importe, moneda, descuento_pct, retorno, metodo,
    } = await req.json();

    // ── Validación de payload ──────────────────────────────────────────────
    if (!formData?.email)    throw new Error("formData.email requerido");
    if (!formData?.password) throw new Error("formData.password requerido");
    if (!userType)            throw new Error("userType requerido");
    if (!moneda)              throw new Error("moneda requerida");
    if (!retorno)             throw new Error("retorno requerido");
    const monto = Number(importe);
    if (!Number.isFinite(monto) || monto <= 0) throw new Error("importe inválido");

    // ── Verificación de correo duplicado (autoridad real — el chequeo del
    //    frontend en PasswordModal es solo un aviso temprano, no la garantía) ──
    const { count, error: countErr } = await supabase
      .from("usuarios")
      .select("id", { count: "exact", head: true })
      .ilike("email", formData.email);
    if (countErr) console.error("[crear-sesion-pago] check email:", countErr);
    if ((count ?? 0) > 0) {
      return new Response(
        JSON.stringify({ error:
          "Ya existe una cuenta con este correo. Inicia sesión o recupera tu contraseña." }),
        { status: 409, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

    // ── Guardar el registro como PENDIENTE (aún no es una cuenta real) ────
    // Si ya existe un registro pendiente con este correo (intento anterior sin
    // completar el pago), lo eliminamos antes de insertar el nuevo — así solo
    // queda UNO por correo, siempre con los datos más recientes.
    await supabase.from("registros_pendientes").delete().ilike("email", formData.email);

    const { data: pendiente, error: pendErr } = await supabase
      .from("registros_pendientes")
      .insert({
        email: formData.email,
        payload: {
          formData, userType, selectedSacs: selectedSacs || [],
          importe: monto, moneda: moneda, descuento_pct: descuento_pct || 0,
        },
      })
      .select("id")
      .single();
    if (pendErr || !pendiente) {
      console.error("[crear-sesion-pago] insert pendiente:", pendErr);
      throw new Error("No se pudo preparar tu registro. Intenta de nuevo.");
    }

    // ── Crear la sesión de Stripe Checkout ─────────────────────────────────
    const cur = String(moneda).toLowerCase();
    const unitAmount = CERO_DECIMALES.has(cur.toUpperCase())
      ? Math.round(monto)
      : Math.round(monto * 100);
    const listaSacs = Array.isArray(selectedSacs) && selectedSacs.length
      ? selectedSacs.join(", ")
      : "Formación Sacramental";

    // ── Método de pago ──────────────────────────────────────────────────────
    // "online"  → tarjeta (disponible en todas las monedas).
    // "voucher" → pago en efectivo/tienda/banco. Cada método solo funciona con
    //   su moneda: OXXO↔MXN, Boleto↔BRL, Multibanco↔EUR. Deben estar HABILITADOS
    //   en el Dashboard de Stripe (Settings → Payment methods) o la creación de
    //   la sesión fallará.
    const VOUCHER_METHOD: Record<string, string> = { MXN: "oxxo", BRL: "boleto", EUR: "multibanco" };
    let payment_method_types: string[];
    if (metodo === "voucher") {
      const vm = VOUCHER_METHOD[String(moneda).toUpperCase()];
      if (!vm) throw new Error("El pago en efectivo/banco no está disponible para esta moneda.");
      payment_method_types = [vm];
    } else {
      payment_method_types = ["card"];
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: payment_method_types as any,
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
      // El webhook usa esto para recuperar el registro pendiente y crear
      // la cuenta SOLO si el pago se confirma.
      metadata: {
        registro_pendiente_id: pendiente.id,
        descuento_pct: String(descuento_pct || 0), // solo auditoría
      },
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
    console.error("[crear-sesion-pago]", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 400, headers: { ...CORS, "Content-Type": "application/json" } },
    );
  }
});