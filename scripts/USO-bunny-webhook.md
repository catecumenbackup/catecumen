# Hora real de fin de codificación (webhook de Bunny)

Bunny **no** expone en su API la hora en que terminó de codificar un video (su
`VideoModel` solo tiene `dateUploaded`, la hora de subida). La **única** fuente
real es el **webhook** de Bunny Stream: cuando un video pasa a *Finished*
(`Status = 3`) manda un `Timestamp` con la hora UTC exacta del evento.

Flujo montado:

```
Bunny (webhook, Status=3) ──POST──> edge function bunny-webhook
        (firma HMAC-SHA256 con la Read-Only key)        │
                                                         ▼
                                        tabla bunny_codificaciones (hora real)
                                                         │
                                        RPC bunny_codificaciones_listar
                                                         ▼
                                        bunny_monitor.py → columna «Codificado»
```

## Puesta en marcha (una sola vez)

### 1. SQL — crear la tabla + RPC
En el **SQL Editor** de Supabase, correr `scripts/bunny-codificaciones.sql`
(idempotente).

### 2. Desplegar la edge function (en **terminal**, no en el SQL Editor)
```powershell
cd C:\catecumen
supabase functions deploy bunny-webhook --use-api
```
En el Dashboard de la función deja **"Enforce JWT" en OFF** (Bunny no manda JWT;
la autenticidad la da la firma HMAC).

### 3. Secret — la Read-Only API key de la librería
Bunny firma el webhook con la **Read-Only API key** de la Video Library
(Bunny → Stream → tu librería → pestaña **API** → *Read-Only Password/Key*).
Guárdala como secret (el nombre NO puede empezar con `SUPABASE_`):
```powershell
supabase secrets set BUNNY_READONLY_KEY=<tu-read-only-api-key>
```
> `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` los inyecta Supabase solo.

### 4. Registrar la URL del webhook en Bunny
Bunny → Stream → tu librería → **Settings → Webhook** (o *Integrations*), pega:
```
https://jqlfjfamraavsbhdusuq.supabase.co/functions/v1/bunny-webhook
```
Guarda. A partir de aquí, **cada video que termine de codificar** registra su
hora real automáticamente.

## Qué verás en el monitor (`bunny_monitor.py`)
- **Hora exacta** (p. ej. `2026-11-03 14:32`) = hora real de Bunny (vino del webhook).
- **`~ fecha`** = video que ya estaba codificado **antes** de activar el webhook
  (no tiene hora real; se muestra la fecha de subida como aproximación).
- **`—`** = aún codificando.

## Notas
- El webhook solo puede registrar videos que terminen **después** de activarlo;
  los 8 de Kerigma ya codificados saldrán con `~` (no hay forma de recuperar su
  hora real: Bunny no la guardó).
- La función valida la firma de cada POST; un webhook sin firma válida se
  rechaza con 401, así nadie puede inyectar horas falsas.
- `EventId` se guarda por si quieres deduplicar reenvíos; Bunny reintenta hasta
  ~4 h si tu endpoint no responde 2xx.
- Statuses del webhook (distintos del status de la API): 3 = Finished (el que
  usamos), 4 = Resolution finished, 5 = Failed.
