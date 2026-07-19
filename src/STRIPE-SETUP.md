# Guía de Integración con Stripe — CICADI

## 1. Crear cuenta y obtener claves

1. Ve a [stripe.com](https://stripe.com) y crea una cuenta gratuita.
2. En el **Dashboard de Stripe**, navega a **Developers → API Keys**.
3. Copia la **Publishable key** (empieza con `pk_live_` o `pk_test_`).
4. Copia la **Secret key** (empieza con `sk_live_` o `sk_test_`).

> Usa las claves `test_` durante el desarrollo y `live_` en producción.

---

## 2. Instalar el SDK de Stripe

### Para el Frontend (Vite + React):
```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### Para el Backend (Supabase Edge Function):
Ya incluido vía URL en el edge function. No se instala adicionalmente.

---

## 3. Configurar las variables de entorno

### En tu archivo `.env` (frontend):
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_TU_CLAVE_PUBLICA_AQUÍ
VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_CLAVE_ANON_AQUI
```

### En Supabase Dashboard → Edge Functions → Secrets:
```
STRIPE_SECRET_KEY=sk_test_TU_CLAVE_SECRETA_AQUÍ
STRIPE_WEBHOOK_SECRET=whsec_TU_WEBHOOK_SECRET_AQUÍ
RESEND_API_KEY=re_TU_API_KEY_RESEND
APP_BASE_URL=https://tu-dominio.com
FROM_EMAIL=noreply@tu-parroquia.com
```

---

## 4. Crear Productos y Precios en Stripe

Ve a **Stripe Dashboard → Products → Add product** y crea:

| Producto             | Precio | Moneda | ID sugerido          |
|----------------------|--------|--------|----------------------|
| Bautismo - MX        | 800    | MXN    | `price_bautismo_mxn` |
| Confirmación - MX    | 800    | MXN    | `price_confirm_mxn`  |
| Primera Comunión - MX| 800    | MXN    | `price_pc_mxn`       |
| 3 Sacramentos - MX   | 2100   | MXN    | `price_3sac_mxn`     |
| Bautismo - USD       | 60     | USD    | `price_bautismo_usd` |
| ... (un precio por país y sacramento)

> **Tip:** Usa `metadata` en cada precio para anotar el país y el sacramento.

---

## 5. Supabase Edge Function — Crear Payment Intent

Crea el archivo `supabase/functions/crear-pago/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.6.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
});

serve(async (req) => {
  const { importe, moneda, metadata } = await req.json();

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(importe * 100), // Stripe usa centavos
    currency: moneda.toLowerCase(),
    automatic_payment_methods: { enabled: true },
    metadata,
  });

  return new Response(
    JSON.stringify({ clientSecret: paymentIntent.client_secret }),
    { headers: { "Content-Type": "application/json" } }
  );
});
```

---

## 6. Supabase Edge Function — Webhook de Stripe

Crea `supabase/functions/stripe-webhook/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.6.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  const body = await req.text();
  const sig  = req.headers.get("stripe-signature")!;
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as Stripe.PaymentIntent;
    const userId = pi.metadata.usuario_id;

    // 1. Marcar pago como completado
    await supabase.from("pagos")
      .update({ estado: "completado", stripe_payment_intent: pi.id })
      .eq("stripe_payment_intent", pi.id);

    // 2. Marcar usuario como pagado
    await supabase.from("usuarios")
      .update({ pago_realizado: true, stripe_payment_id: pi.id })
      .eq("id", userId);

    // 3. Llamar edge function de bienvenida/email
    await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/enviar-bienvenida`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` },
      body: JSON.stringify({ usuario_id: userId }),
    });
  }

  return new Response(JSON.stringify({ received: true }));
});
```

---

## 7. Configurar el Webhook en Stripe Dashboard

1. Ve a **Stripe Dashboard → Developers → Webhooks → Add endpoint**.
2. URL del endpoint:
   ```
   https://TU_PROYECTO.supabase.co/functions/v1/stripe-webhook
   ```
3. Selecciona el evento: `payment_intent.succeeded`
4. Copia el **Signing secret** y agrégalo como `STRIPE_WEBHOOK_SECRET` en Supabase.

---

## 8. Integración en el Frontend (React)

En `SacramentosV2.jsx`, reemplaza la función `simulatePayment` con:

```jsx
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

async function createPaymentIntent(importe, moneda, userId) {
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crear-pago`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        importe,
        moneda,
        metadata: { usuario_id: userId },
      }),
    }
  );
  const { clientSecret } = await res.json();
  return clientSecret;
}
```

---

## 9. Modo de Prueba — Tarjetas de Test

| Número               | Resultado        |
|----------------------|------------------|
| 4242 4242 4242 4242  | Pago exitoso     |
| 4000 0000 0000 9995  | Pago declinado   |
| 4000 0025 0000 3155  | Requiere 3D Secure|

Usa cualquier fecha futura (MM/AA), CVC 3 dígitos, CP 5 dígitos.

---

## 10. Lista de verificación para producción

- [ ] Cambiar `pk_test_` → `pk_live_` en variables de entorno
- [ ] Cambiar `sk_test_` → `sk_live_` en Supabase Secrets
- [ ] Actualizar URL del webhook al dominio de producción
- [ ] Activar HTTPS en el dominio
- [ ] Configurar Stripe Radar para prevención de fraude
- [ ] Revisar cumplimiento PCI DSS (Stripe Elements lo gestiona automáticamente)
- [ ] Configurar emails transaccionales con dominio verificado en Resend

---

## Soporte

- Documentación de Stripe: https://stripe.com/docs
- Documentación de Supabase Edge Functions: https://supabase.com/docs/guides/functions
- Foro de Stripe: https://support.stripe.com
