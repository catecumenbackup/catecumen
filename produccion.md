# Producción — guía de despliegue de Catecumen

Checklist para llevar cambios a producción (catecumen.com, Hostinger + Supabase).
La plataforma ya está en producción; **Stripe sigue en modo test**.

---

## ✅ Checklist de lanzamiento

### 🔴 Bloqueantes (sin esto no se puede abrir)

- [ ] **Stripe a producción** — claves *live*, webhook *live* (`stripe-webhook`), probar un pago real completo. (Máximo riesgo.)
- [ ] **Videos** — reemplazar `videos.url_video = 'PENDIENTE'`; subir los videos (1080p) a Bunny y pegar cada URL por sacramento/orden/idioma en el panel → Videos. (54 sembrados; el guion define 103 → faltan ~49 por dar de alta.)
- [ ] **SQL nuevos en Supabase** (idempotentes): `admin-afiliados.sql`, `directorio-flexible.sql`, `preinscripcion.sql`, `preinscripcion-fase2.sql`, `notificaciones-admin.sql`, re-correr `admin-etiquetas.sql`.
- [ ] **Redesplegar edge functions** (`--use-api`, Enforce JWT OFF): `crear-sesion-pago`, `activar-pago`, `stripe-webhook`, `preinscribir`, `avisar-admin`.
- [ ] **Resend (correos)** — crear cuenta, verificar el dominio `catecumen.com` (DNS SPF/DKIM), poner el secret `RESEND_API_KEY`. Sin esto no salen los correos (el aviso del panel sí funciona).
- [ ] **Compilar y subir** — `npm run build` → subir todo `dist/` (incluye `admin/`, `info/`, `.htaccess`, `sw.js`) a Hostinger. Probar en incógnito.

### 🟡 Importante (antes o poco después de abrir)

- [ ] **Prueba integral en incógnito** — registro + pago (Stripe test primero), preinscripción → conversión, avisos (panel + correo), buscador de parroquias, constancias (PDF + QR), todas las pestañas del panel; en los 6 idiomas y en tema claro/oscuro.
- [ ] **Definir la operación de lanzamiento** — ¿abrir con preinscripción activa (sin cobro) y luego convertir, o directo con pago? Si usas preinscripción, probar la conversión en Stripe test.
- [ ] **Limpiar RLS público de `usuarios`** — dejar solo `usuarios_sel_own` (las escrituras las hacen las edge functions con service-role).

### 🟢 Recomendado / deuda menor

- [ ] **Respaldo en GitHub** — resolver permisos del remoto (`neuromundi` sin acceso a `catecumenbackup/catecumen`) y hacer `git push`.
- [ ] **SEO** — alta en Google Search Console + enviar `sitemap.xml`.
- [ ] **Rendimiento (opcional)** — troceo por pantallas con `React.lazy` del núcleo de `App.jsx` (proyecto aparte).

### Verificaciones ya OK

- [x] `TEST_MODE = false` en `src/data/course.js`.
- [x] Sourcemaps desactivados en el build (`build.sourcemap:false`).

---

## 1. Compilar el frontend

```powershell
cd C:\catecumen
Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue
npm run test          # 53+ pruebas de lógica/componentes deben pasar (Vitest)
npm run build         # genera dist/ (multipágina: main, info, recuperar, admin)
```

- Verifica que el **hash del bundle cambió** (`dist/assets/main-XXXX.js`); si no, se compiló código viejo.
- Regla crítica: `info/` y `recuperar/` **siempre** se llaman `index.html` (Vite ignora otros nombres).

## 2. Subir a Hostinger

Sube **todo el contenido de `dist/`**. En particular, no olvidar:

- `dist/index.html`, `dist/assets/…`, `dist/admin/`, `dist/info/`, `dist/recuperar/`.
- **`dist/.htaccess`** (Brotli/Gzip, caché, cabeceras). Contiene `Permissions-Policy: geolocation=(self)` — **necesario** para que el buscador pida ubicación.
- `dist/sw.js` (service worker) y los assets de `public/` (iconos, `tour/`, `videos-prueba/`, `manifest.webmanifest`, `robots.txt`, `sitemap.xml`, `cookies.js`).

**Service Worker:** sube el número de `CACHE_VERSION` en `public/sw.js` en **cada** release (última: `catecumen-v82`). Tras subir, puede requerir **recargar dos veces** o probar en **incógnito** (el SW sirve el bundle cacheado hasta activarse).

## 3. Base de datos (Supabase — SQL Editor)

Ejecuta solo los scripts nuevos/cambiados. Nunca pongas al final una línea que llame una RPC protegida por `es_admin()` (en el editor `auth.uid()` es null → "no autorizado" → **rollback de todo el script**).

Orden acumulado base (si se arma de cero):
`encuestas-video.sql` → `admin-fundamentos.sql` → `admin-videos.sql` (FIX) → `admin-usuarios.sql` → `admin-mensajeria.sql` → `admin-constancias.sql` → `admin-filtros.sql` → `scripts/admin-evaluaciones.sql` → `scripts/admin-tour.sql` → `scripts/admin-etiquetas.sql` → **crear el primer admin**.

Módulos adicionales (idempotentes, re-ejecutables):

| Script | Qué hace |
|---|---|
| `scripts/kerigma.sql` | Sacramento/video/nota del Módulo Kerigma |
| `scripts/limite-consultas-ia.sql` | Límite 10 consultas/7 días de Magisterium AI |
| `scripts/schola.sql` → `scripts/schola-foro.sql` → `scripts/admin-scholas.sql` | Scholas (recursos + foro + gestión admin) |
| `scripts/directorio-afiliados.sql` → `scripts/directorio-mx.sql` → **`scripts/directorio-flexible.sql`** | Directorio público de parroquias/diócesis (cercanía + texto flexible sin acentos/erratas) |
| **`scripts/admin-afiliados.sql`** | Gestión de afiliados (parroquias/diócesis/centros/otro): crea `organizaciones_otro` (RLS + GRANT INSERT anon), añade `suspendida`, RPCs `admin_afiliados_listar`/`admin_afiliado_estado` |
| `scripts/directorio-datos-prueba.sql` | (Opcional) 2 parroquias + 2 diócesis de prueba para ver el mapa; borrar al terminar |
| **`scripts/preinscripcion.sql`** | Modo preinscripción: tabla `ajustes`, columna `usuarios.estado_inscripcion`, RPCs `obtener_ajuste`/`admin_guardar_ajuste`/`admin_preinscritos_listar`. El modo arranca APAGADO; se activa desde el panel (pestaña Preinscripción). |
| **`scripts/notificaciones-admin.sql`** | Avisos del panel (pestaña 🔔): tabla `notificaciones_admin` + RPCs. Redesplegar `preinscribir` y `activar-pago` (insertan avisos). |
| **`scripts/preinscripcion-fase2.sql`** | Conversión al abrir: `usuarios.importe_previsto`, RPCs `activar_mi_preinscripcion`/`admin_activar_preinscrito`. Redesplegar `crear-sesion-pago`/`activar-pago`/`stripe-webhook`. |
| **`scripts/rls-usuarios.sql`** | Deuda de seguridad: quita las políticas abiertas al rol `public` de `usuarios` y deja acceso solo a la propia fila (SELECT/INSERT con `id = auth.uid()`). Ver sección 5.1. |
| **`scripts/actualizar-perfil.sql`** | RPC `actualizar_mi_perfil` (SECURITY DEFINER, acotada a `auth.uid()` + lista blanca): persiste los cambios de "Mi Cuenta". Sin ella el botón "Guardar cambios" no guarda en la BD. Requiere subir `dist/`. |

## 4. Edge Functions (Supabase — terminal, no SQL Editor)

Desplegar con `--use-api` (evita Docker) y **"Enforce JWT" en OFF**:

```bash
supabase functions deploy <nombre> --use-api
```

Funciones: `crear-sesion-pago`, `activar-pago`, `stripe-webhook`, `reanudar-pago`,
`admin-eliminar-usuario`, `firmar-video`, `consultar-magisterium`,
`geocodificar-afiliados`, `geocodificar-uno`, **`preinscribir`** (crea la cuenta del
preinscrito con service-role — desplegar para que la preinscripción funcione),
**`avisar-admin`** (avisos al panel + correo a admin@catecumen.com vía Resend).

**Avisos por correo (Resend):** requiere secret `RESEND_API_KEY` (crear cuenta en Resend,
verificar el dominio `catecumen.com`) y, opcional, `RESEND_FROM` / `ADMIN_NOTIF_EMAIL`.
Redesplegar `avisar-admin`, `preinscribir` y `activar-pago`. Sin la key, el aviso en el
panel funciona igual y solo se omite el correo.

Solo redesplegar las que cambiaron. Secrets manuales requeridos (una vez):
`BUNNY_TOKEN_KEY`, `BUNNY_CDN_HOST` (firmar-video); `MAGISTERIUM_API_KEY`
(+ opcional `MAGISTERIUM_BASE_URL`/`MAGISTERIUM_MODEL`/`MAGISTERIUM_LIMITE_SEMANAL`).
Las `SUPABASE_URL`/`ANON_KEY`/`SERVICE_ROLE_KEY` las inyecta Supabase.

## 4.1 Paso a producción de Stripe (una sola vez)

Toda la integración es **del lado del servidor** (Checkout alojado; no hay clave
pública en el frontend). Solo hay dos secrets: `STRIPE_SECRET_KEY` y
`STRIPE_WEBHOOK_SECRET`. **Nunca** pegar claves en el chat ni en el repo.

1. **Activar la cuenta** en Stripe (datos fiscales + cuenta bancaria de depósito). Sin esto el modo *live* no cobra.
2. **Métodos de pago en modo Live** — Dashboard (interruptor en **Live**, no Test) → Settings → Payment methods: **tarjeta** + los de efectivo por moneda: **OXXO** (MXN), **Boleto** (BRL), **Multibanco** (EUR). OXXO/Boleto requieren aprobación de Stripe → solicitarlos con anticipación.
3. **Clave secreta live** — Developers → API keys (en modo Live) → copiar la **Secret key** (`sk_live_...`).
4. **Webhook live** — Developers → Webhooks → Add endpoint:
   - URL: `https://jqlfjfamraavsbhdusuq.supabase.co/functions/v1/stripe-webhook`
   - Eventos: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed` (los dos últimos = OXXO/Boleto/Multibanco diferidos).
   - Copiar el **Signing secret** (`whsec_...`). ⚠️ El de *live* es **distinto** al de *test*.
5. **Poner los secrets en Supabase** (Edge Functions → Manage secrets, o `supabase secrets set`):
   - `STRIPE_SECRET_KEY` = `sk_live_...`
   - `STRIPE_WEBHOOK_SECRET` = `whsec_...` (el del webhook **live**)
6. **Redesplegar las 4 funciones** que usan Stripe (JWT OFF):

   ```powershell
   supabase functions deploy crear-sesion-pago --use-api
   supabase functions deploy activar-pago --use-api
   supabase functions deploy stripe-webhook --use-api
   supabase functions deploy reanudar-pago --use-api
   ```

7. **URL de retorno** — confirmar que `success_url` = `${retorno}/?pago=procesando&session_id={CHECKOUT_SESSION_ID}` apunta a `https://www.catecumen.com` (no localhost) en `crear-sesion-pago`.
8. **Prueba real controlada** — una inscripción real con tarjeta propia (monto bajo): verificar que se crea la cuenta tras el pago, llega el correo (Resend), aparece el aviso en el panel, y el webhook entrega `checkout.session.completed` con 200. Luego **reembolsar** desde Stripe. Probar también un pago diferido (OXXO) para validar la rama del webhook asíncrono.
9. **Cerrar** — actualizar la nota "Stripe sigue en modo test" en `CLAUDE.md` y este archivo una vez migrado. (El saldo *live* tarda unos días en depositarse según el payout configurado.)

## 4.2 Resend (correos transaccionales — una sola vez)

Sin esto no salen los correos (confirmación de pago ni avisos al admin). El aviso
en el panel funciona igual; solo se omite el correo. **Nunca** pegar la API key en
el chat ni en el repo.

1. **Crear cuenta** en resend.com.
2. **Agregar el dominio** `catecumen.com` (Domains → Add Domain).
3. **Publicar los registros DNS** que Resend indique, en el DNS de `catecumen.com` (en Hostinger o donde esté el DNS): un registro **SPF** (TXT), las claves **DKIM** (CNAME/TXT) y, recomendado, **DMARC** (TXT). Esperar a que Resend marque el dominio como **Verified** (minutos a horas según propagación).
4. **Crear una API key** (Resend → API Keys) — `re_...`.
5. **Poner los secrets en Supabase** (Edge Functions → Manage secrets):
   - `RESEND_API_KEY` = `re_...`
   - `RESEND_FROM` = `Catecumen <noreply@catecumen.com>` (opcional; debe usar el dominio verificado)
   - `ADMIN_NOTIF_EMAIL` = `admin@catecumen.com` (opcional; ya es el valor por defecto)
6. **Redesplegar** las funciones que envían correo: `avisar-admin`, `preinscribir`, `activar-pago`.
7. **Probar** — provocar un aviso (una consulta de soporte o una preinscripción) y confirmar que llega el correo a `admin@catecumen.com` y que no cae en spam (si cae, revisar SPF/DKIM/DMARC).

## 4.3 Videos (contenido — el bloqueante de mayor volumen)

La tabla `videos` tiene `url_video = 'PENDIENTE'` en las 54 filas sembradas; el
guion define **103** videos (~25.75 h a ~15 min c/u), así que faltan **~49 filas**
por dar de alta además de cargar todas las URLs.

1. **Producir** los 103 videos (ver la nota de producción; recomendado 1080p).
2. **Subir a Bunny Stream** — plan recomendado **1080p H.264** (la codificación 1080p es gratis; 4K/1440p cuesta $0.150/min). Cada video queda con un **GUID** y una URL HLS `.m3u8`.
3. **Protección de contenido** — si activas Token Authentication en la Video Library de Bunny, poner los secrets `BUNNY_TOKEN_KEY` y `BUNNY_CDN_HOST` y desplegar `firmar-video`. El reproductor tiene *fallback* a la URL cruda si el token está apagado.
4. **Dar de alta / editar las URLs** desde el panel → **Videos**: crear las filas faltantes y pegar cada URL por **(sacramento, orden, idioma)**. `VideoModal` reproduce `.m3u8` (HLS vía hls.js) y `.mp4` directo.
5. **Mientras tanto** el reproductor usa los videos de prueba de `public/videos-prueba/{idioma}/{seccion}.mp4` (uno por sección). No abrir a producción con los de prueba si el contenido real es requisito de lanzamiento.

## 5. Verificación post-despliegue (en incógnito)

- [ ] La app carga y arranca en el tour (pantalla de carga → bienvenida).
- [ ] Registro de alumno + flujo de pago (Stripe test) llega a Checkout y regresa.
- [ ] Buscador de parroquias: pide **ubicación**, muestra cercanas; búsqueda sin acentos funciona; el modal no se corta.
- [ ] Panel `/admin/`: login real; pestaña **Afiliados** lista/aprueba/suspende/borra parroquias, diócesis, centros y "otras organizaciones".
- [ ] Consola sin errores 500 (Magisterium, edge functions).
- [ ] Tema claro/oscuro y los 6 idiomas.

## 5.1 Importantes (antes o poco después de abrir)

### A) Prueba integral en incógnito

Además de la lista de la sección 5, cubrir el ciclo completo:

- [ ] **Registro + pago con tarjeta** (Stripe **test** primero, luego un pago real de la sección 4.1): la cuenta se crea **solo tras el pago**, regreso correcto a `?pago=procesando`.
- [ ] **Pago diferido** (OXXO/Boleto/Multibanco según moneda): la cuenta se crea al confirmar el pago asíncrono (webhook `async_payment_succeeded`).
- [ ] **Preinscripción** (si se usa): capturar un preinscrito con el modo activo → aparece la pantalla de espera; apagar el modo → al entrar, gratuito se autoactiva y de pago va a conversión (Stripe) → queda `activo`.
- [ ] **Avisos**: llegan al panel (🔔) **y** por correo (registro, preinscripción, soporte, consulta).
- [ ] **Constancias**: PDF con QR; el QR valida en `catecumen.com/?validar=<codigo>`.
- [ ] **Panel** completo: todas las pestañas (Afiliados, Preinscripción, Avisos, Videos, Usuarios, Mensajes, etc.).
- [ ] **6 idiomas** y **tema claro/oscuro** sin textos ilegibles.

### B) Definir la operación de lanzamiento

Decidir **cómo** se abre, porque cambia qué probar primero:

- **Opción 1 — Preinscripción sin cobro:** activar el modo (panel → Preinscripción), abrir para reservar lugar; cuando el contenido esté listo, apagar el modo y convertir (los de pago pasan por Stripe). Requiere Fase 2 desplegada y probada en Stripe test.
- **Opción 2 — Apertura directa con pago:** modo preinscripción apagado; todo registro pasa por Stripe (ya en modo live). Requiere el paso a producción de Stripe (4.1) hecho.

En ambos casos, probar el flujo elegido en **Stripe test** antes de abrir al público.

### C) Limpiar RLS público de `usuarios` (`scripts/rls-usuarios.sql`)

Hoy existen políticas con rol `public` (`usr_select`/`usr_insert`/`usr_update`) que
dejan a cualquiera (incluido anon) leer y escribir **todas** las filas.

**No** basta con "dejar solo el SELECT": la ruta de **registro gratuito/beca**
inserta su propia fila desde el cliente (`PaymentModal.crearCuentaUsuario`, ya
autenticado tras `signUp`), así que hace falta también un **INSERT** acotado a
`id = auth.uid()`. El Dashboard **no** persiste el perfil en la BD (solo estado
local), por lo que **no** se necesita política de UPDATE para el cliente; todas
las actualizaciones reales las hacen las edge functions con service-role (ignoran
RLS).

El script deja: `usuarios_sel_own` (SELECT propio) + `usuarios_ins_own` (INSERT
propio), y elimina las tres políticas `public`. Correr en SQL Editor y verificar
con `select policyname, cmd, roles from pg_policies where tablename='usuarios';`.
Probar después: login (carga perfil), registro gratuito (inserta), y que un
usuario **no** pueda leer filas de otros.

## 6. Control de versiones

Antes de subir `dist/`: `git add -A && git commit -m "…"` (punto de retorno).
Pendiente/opcional: remoto en GitHub privado (`git remote add origin … && git push`).

---

## Pendientes abiertos (deuda conocida)

1. **URLs de video reales:** `videos.url_video = 'PENDIENTE'`. El reproductor usa los videos de prueba por sección. `VideoModal` ya soporta HLS (`.m3u8`, Bunny/Cloudflare) y MP4 directo; editar URLs desde el panel → Videos.
2. **Limpiar RLS público de `usuarios`** (`usr_select/insert/update` con rol `public`): dejar solo `usuarios_sel_own`. Las escrituras las hacen las edge functions con service-role.
3. **Stripe en modo test** — pasar a producción cuando corresponda.
4. **Tarjetas del tour vía BD:** si `tour_tarjetas` tiene filas, `obtener_tour` **reemplaza** las tarjetas del código. Los cambios en `cardsBase` de `App.jsx` (p. ej. quitar una diapositiva o cambiar textos/videos) solo aplican si esa tabla está vacía; si no, editar también desde el panel → **Tour**.
5. **`generar_registro_id` para "otro":** la afiliación "otro" depende de que esa función reconozca el tipo `otro`; si no, la fila queda sin `registro_id` (no rompe el registro). Revisar/ampliar si se requiere el folio oficial.
6. **Afiliados nuevos entran como `pendiente`** (parroquias/diócesis/centros/otro): hay que **aprobarlos** desde el panel para que aparezcan en el directorio público.
7. **Troceo por pantallas restante / rendimiento:** ver CLAUDE.md (sección PageSpeed).
8. **Preinscripción — Fase 2 (conversión) — IMPLEMENTADA, requiere despliegue + prueba.** Captura + control de admin (Fase 1) y conversión (Fase 2) ya construidas. Para activarla: (a) correr **`scripts/preinscripcion-fase2.sql`**; (b) **redesplegar** `crear-sesion-pago`, `activar-pago` y `stripe-webhook` (`--use-api`, JWT OFF); (c) subir `dist/` + `admin/`. Flujo: preinscrito gratuito (beca 100%) se autoactiva al entrar tras abrir; de pago va a PaymentModal en modo conversión (usa `usuarios.importe_previsto`) → Stripe → las edge functions ACTUALIZAN la cuenta a `activo` (rama `payload.conversion`, no crean otra). El admin puede activar manual con el botón "Activar". **Probar el ciclo completo en Stripe TEST** (preinscribir → apagar modo → login → pagar → activo) antes de abrir al público.
