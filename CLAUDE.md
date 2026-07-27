# Catecumen — contexto del proyecto

Plataforma web de formación sacramental católica a distancia (catecumen.com), en colaboración con CICADI y la Diócesis de Querétaro, México. El idioma de trabajo es **español**.

## Stack y despliegue

- **Frontend:** React 18 + Vite (rolldown-vite v8). SPA monolítica.
- **Backend:** Supabase (Postgres + Auth + Edge Functions). Proyecto ref: `jqlfjfamraavsbhdusuq`.
- **Pagos:** Stripe (actualmente en modo test; el resto de la plataforma ya está en producción).
- **Hosting:** Hostinger. Se despliega **subiendo el contenido de `dist/`** manualmente.
- **Idiomas:** 6 (es, en, fr, de, pt, it). Todo texto nuevo debe traducirse a los 6 mediante el helper `T(es, en, fr, de, pt, it)`.

## Estructura de archivos (raíz: `C:\catecumen\`)

| Archivo | Nota |
|---|---|
| `src/App.jsx` | **Toda la app** (~580 KB, monolítico). Aquí ocurre casi todo. |
| `src/main.jsx` | Punto de entrada; importa App e `index.css`. |
| `index.html` | Entrada principal de Vite. **Debe** cargar `<script type="module" src="/src/main.jsx">`. |
| `info/index.html` | Página pública "Sobre Catecumen" (HTML estático, 6 idiomas). |
| `recuperar/index.html` | Página de recuperación de contraseña (HTML estático). |
| `vite.config.js` | Build multipágina: `main` = `index.html`, `info` = `info/index.html`, `recuperar` = `recuperar/index.html`. |
| `public/videos-prueba/{idioma}/{seccion}.mp4` | Videos por idioma y sección. |
| `.env` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. |

### Regla crítica de nombres
Los archivos de `info/` y `recuperar/` **siempre deben llamarse `index.html`**. Vite compila esos nombres exactos; cualquier otro nombre (`info-index.html`, `info__index.html`) es ignorado silenciosamente y el cambio "no aparece". Este ha sido un error recurrente.

## Base de datos (tablas principales)

- `usuarios` — perfil. `id` = `auth.users.id`. Campos: `tipo_usuario`, `sacramentos_elegidos` (jsonb), `nombre`, `apellido`, `email`, `pais_residencia`, `estado_residencia`, `numero_documento`, `registro_id`, etc.
- `sacramentos` — `slug` (= el `secId` del frontend: `tc1`, `bautismo`, `primera_comunion`, `confirmacion`, `prebautismal`, `catequista`, `tc2_confesion`, `tc2_uncion`), `nombre_es/en`, `orden`.
- `videos` — `sacramento_id` + `orden`. 54 filas sembradas. **`url_video` sigue en `'PENDIENTE'`** (pendiente cargar URLs reales).
- `inscripciones` — única por (`usuario_id`, `sacramento_id`).
- `progreso_videos` — única por (`inscripcion_id`, `video_id`); campos `visto`, `aprobado`.
- `registros_pendientes` — staging del registro antes de confirmar el pago.
- `constancias` — certificados emitidos, con `serie` y `codigo_validacion` (para el QR).
- `encuestas_video` — encuesta de calidad post-video. UNIQUE(`usuario_id`, `video_id`). 4 estrellas (claridad, contenido, audiovideo, utilidad) + comentario opcional.
- `admins` — quién es administrador (`user_id` = `auth.users.id`). Ser admin = estar en esta tabla.
- `admin_log` — auditoría inmutable de acciones de admin (quién, qué, sobre qué, cuándo).
- `conversaciones` / `mensajes` — mensajería interna bidireccional (un hilo por usuario).

### Puente frontend ↔ BD
El frontend identifica secciones y videos con **strings**; la BD usa **UUIDs**. El puente se construye dinámicamente al arrancar (`loadBridge` en `App.jsx`) mapeando por **(slug del sacramento, orden del video)**. No hardcodear UUIDs.

## Edge Functions (Supabase; desplegadas desde el Dashboard, "Enforce JWT" en OFF)

- `crear-sesion-pago` — guarda el registro pendiente y crea la sesión de Stripe Checkout.
  `success_url` debe ser exactamente: `${retorno}/?pago=procesando&session_id={CHECKOUT_SESSION_ID}`
- `activar-pago` — al volver de Stripe, verifica el pago y crea la cuenta. Idempotente con el webhook.
- `stripe-webhook` — crea la cuenta al confirmar el pago (maneja tarjeta y pagos diferidos OXXO/Boleto/Multibanco).
- `reanudar-pago` — reintento de pago para registros pendientes abandonados.
- `admin-eliminar-usuario` — **borrado total** de un usuario (elimina de `auth.users`). Valida internamente el JWT del admin que llama (lo lee del header Authorization y verifica que esté en `public.admins`) antes de usar service-role. Desplegada con `supabase functions deploy admin-eliminar-usuario --use-api` (evita Docker). "Enforce JWT" en OFF. Las variables `SUPABASE_URL`/`SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_ROLE_KEY` las inyecta Supabase automáticamente (no se pueden crear como secrets manualmente: rechaza el prefijo `SUPABASE_`).

Los comandos `supabase functions deploy ...` van en **terminal**, nunca en el SQL Editor.

## Funcionalidad implementada (no romper)

- Registro por tipo de usuario, selección de sacramentos, precios PPP por país, becas (solidaria y de esperanza).
- Pago con tarjeta y en efectivo (OXXO/Boleto/Multibanco según moneda).
- La cuenta se crea **solo después** de confirmar el pago (evita usuarios huérfanos).
- Login carga el curso: perfil → secuencia (`buildSeq`) → inscripciones (upsert) → progreso guardado.
- Progreso persistido en `progreso_videos` al ver un video y al aprobar evaluación.
- Sesión persistente (retoma el curso sin volver a iniciar sesión) y botón "Cerrar sesión" que guarda el progreso antes de salir.
- Constancia en PDF (jsPDF por CDN) con logo, número de serie, QR de verificación y registro en Supabase.
  Serie: `CAT-{ISO}-{SAC}-{AÑO}-{NNNNNN}` — ej. `CAT-MX-BAU-2026-000042`.
  Verificación por QR: `catecumen.com/?validar={codigo}` → RPC `validar_constancia`.
  Catequista que autoriza: **Mtra. Nelly Rocio Montoya Freyre**. Vigencia: 6 meses.
- Tema claro/oscuro sincronizado entre la app y las páginas estáticas vía `localStorage["catecumen_theme"]`.
- Lluvia de estrellas doradas al confirmar el pago, al aprobar una evaluación y al obtener la constancia.

## Consola de administración (`admin/index.html`)

Página estática en `C:\catecumen\admin\index.html` (registrada en `vite.config.js` como `admin`). **Login real** con Supabase Auth (correo + contraseña), NO clave compartida. Todo protegido en el servidor por la función `es_admin()` (verifica que `auth.uid()` esté en `public.admins`). Cada acción sensible se registra en `admin_log`. Paleta: `--gold #C8A951`, `--ivory #F0EAD6`, `--card #112038`, `--bg #060D18`. Importa `createClient` de `https://esm.sh/@supabase/supabase-js@2`.

**Crear un admin:** Supabase → Authentication → Add user (o registrarse como usuario normal) → copiar UUID → `INSERT INTO public.admins (user_id, nombre, email) VALUES ('UUID','Nombre','correo');`

Pestañas del panel:
- **Estadísticas** — encuestas de calidad: promedios globales, distribución de estrellas, tendencia semanal, tabla por video (ordenable, punto débil), videos que necesitan atención (umbral configurable), comentarios (filtrables), export CSV. RPC: `admin_estadisticas_encuestas()`.
- **Videos** — CRUD completo. Crear, editar (incl. URL, para reemplazar los `'PENDIENTE'`), activar/desactivar (borrado suave, reversible) y borrar (duro). RPCs: `admin_listar_videos`, `admin_crear_video`, `admin_editar_video`, `admin_video_activo`, `admin_borrar_video`, `admin_listar_sacramentos`.
- **Evaluaciones** — CRUD de preguntas por video (6 idiomas, respuesta correcta, puntaje, orden, activar/borrar). RPCs: `admin_videos_evaluacion`, `admin_listar_preguntas`, `admin_guardar_pregunta`, `admin_pregunta_activo`, `admin_borrar_pregunta`. SQL: `scripts/admin-evaluaciones.sql`.
- **Tour** — edita las tarjetas de bienvenida (texto 6 idiomas, video mp4/webm, póster, orden, ocultar/borrar). Tabla `tour_tarjetas`; el frontend lee vía `obtener_tour` con respaldo al array fijo. RPCs: `admin_listar_tour`, `admin_guardar_tarjeta_tour`, `admin_tour_activo`, `admin_borrar_tarjeta_tour`. SQL: `scripts/admin-tour.sql`.
- **Etiquetas** — etiquetas configurables ("Próximamente", color rojo/dorado editable) sobre las opciones del modal de registro y los sacramentos. Al activar una etiqueta, esa opción/sacramento queda **inhabilitado** (cliente + validación server-side en `crear-sesion-pago`). Tabla `opciones_etiquetas`; frontend lee `obtener_etiquetas_opciones` (hook `useEtiquetasOpciones` en App.jsx). RPCs: `admin_listar_etiquetas`, `admin_guardar_etiqueta`, `admin_etiqueta_activo`. SQL: `scripts/admin-etiquetas.sql`.
- **Sesiones / Atención / Precios / Constancias** — ya construidas (agendar sesiones, usuarios que no aprueban, cuotas por país, constancias con QR).
- **Usuarios** — buscar, ficha (pago/beca/inscripciones/constancias con PDF), suspender/reactivar, borrado suave y borrado total, y **enviar mensaje** individual. RPCs: `admin_listar_usuarios`, `admin_ficha_usuario`, `admin_suspender_usuario`, `admin_borrado_suave_usuario`; borrado total vía edge function `admin-eliminar-usuario`.
- **Mensajes** — bandeja de conversaciones + chat + responder + difusión (a todos o filtrando por país/tipo/sacramento). RPCs: `admin_conversaciones`, `admin_ver_conversacion`, `admin_enviar_a_usuario`, `admin_difundir`, `admin_no_leidos`, `admin_facetas_usuarios`.
- **Auditoría** — lee `admin_log` (solo lectura).

Salvaguardas: no se puede suspender/eliminar a un admin ni a sí mismo. Borrado total es irreversible (recomendar borrado suave). `pgcrypto` vive en el esquema `extensions` (no `public`): las funciones que usan `crypt` necesitan `search_path = public, extensions`.

**Sesión del panel (crítico — causó un bloqueo largo, jul 2026):** el cliente Supabase del panel usa `storageKey:"catecumen-admin-auth"` **propio**, separado de la app principal. Sin eso, panel y `catecumen.com` compartían la misma sesión en el navegador y, con varias pestañas abiertas, la **rotación del refresh token** de Supabase invalidaba el token de las otras y **cerraba la sesión al cambiar de pestaña**. Además `sb.rpc` está envuelto: ante "no autorizado" intenta `refreshSession()` + reintento, y si la sesión ya no sirve muestra el login (`onAuthStateChange` SIGNED_OUT). Botón **"⏱️ Sesión"**: cierre por inactividad configurable (por defecto 15 min, se guarda en `localStorage["catecumen_admin_idle_min"]`).

**Trampa MFA (jul 2026):** si el admin activa **2FA/MFA**, Supabase exige sesión **AAL2** para cambiar la contraseña → la página de recuperación NO puede completar el reset ("AAL2 session is required…") y muestra un mensaje engañoso de "enlace caducó". Para desbloquear: `DELETE FROM auth.mfa_factors WHERE user_id = ...;` y fijar la clave con `UPDATE auth.users SET encrypted_password = extensions.crypt('nueva', extensions.gen_salt('bf'))`, o crear un admin nuevo. El **código fuente JS de `recuperar/index.html` se perdió** (solo existe el bundle compilado `recuperar--a_g_2Im.js`, referenciado con ruta fija, igual que `/info`): su lógica no se puede editar desde el fuente, solo su CSS. Pendiente reescribirla embebida.

**Legibilidad de `<select>` en el panel:** las opciones nativas salían en texto claro sobre el fondo blanco del sistema. Fijado con `select option{background:#112038;color:#F0EAD6}` y `select optgroup{...}`.

**Lección de despliegue SQL:** no incluir una línea de verificación que ejecute una RPC protegida por `es_admin()` (p.ej. `SELECT admin_listar_videos();`) al final de un script; en el SQL Editor `auth.uid()` es nulo, lanza "no autorizado" y **revierte (rollback) todo el script**. Verificar con `pg_get_functiondef(...)` o desde el panel.

### Mensajería — lado usuario (en `App.jsx`)
- Componente `MensajesTab`: bandeja donde el usuario lee y responde. RPCs: `mis_mensajes`, `marcar_leidos_usuario`, `responder_usuario`.
- Pestaña "Mensajes" dentro de "Mi Cuenta" (Dashboard acepta prop `initialTab`).
- **Campana flotante** ✉️ en el área de estudio (`phase==='course'`), en `bottom:74, right:18, zIndex:901` (encima del botón Soporte que está en `bottom:18, zIndex:900`). Contador rojo de no leídos con polling cada 60s vía `mis_mensajes_no_leidos()`. Estado en App: `msgNoLeidos`, `dashTab`.
- **Cuenta suspendida/eliminada:** en `handleLoginSuccess`, si `u.suspendido || u.eliminado` cierra sesión y muestra el modal (`cuentaSuspendida`), no deja entrar.

### Orden de ejecución de los SQL (si se arma de cero)
`encuestas-video.sql` → `admin-fundamentos.sql` → `admin-videos.sql` (o `admin-videos-FIX.sql`, que usa `descripcion_es/en`) → `admin-usuarios.sql` → `admin-mensajeria.sql` → **`scripts/admin-evaluaciones.sql`** → **`scripts/admin-tour.sql`** → **`scripts/admin-etiquetas.sql`**. Luego crear el primer admin. Los tres nuevos son idempotentes y re-ejecutables.

### Tabla `preguntas` — SOLO i18n (trampa)
La migración i18n **eliminó** las columnas heredadas `pregunta` y `opcion_a..d`. La tabla real tiene solo `pregunta_es/en/fr/de/pt/it`, `opcion_[a-d]_[es..it]`, `respuesta_correcta`, `explicacion`, `puntaje`, `orden`, `activo`. El `schema.sql` del repo está **desactualizado** (aún muestra las heredadas NOT NULL). Cualquier función sobre `preguntas` debe usar solo las columnas i18n. `admin-evaluaciones.sql` incluye `ADD COLUMN IF NOT EXISTS` defensivo para las 30 columnas i18n.

## Convenciones y trampas conocidas

- **Emojis no renderizan bien en Windows.** Usar SVG inline o Twemoji (las banderas del selector de idioma usan Twemoji).
- **`TEST_MODE`** (constante en `App.jsx`, tras `SEC_META`): en `true` reduce el curso a 1 video + 1 evaluación. **Debe quedar en `false` en producción.**
- **Tree-shaking de rolldown:** una variable de estado que solo se escribe (nunca se lee) puede ser eliminada del bundle y romper en runtime. Evitar estado muerto.
- **CSS con colores fijos** (no variables de tema) rompe el modo claro/oscuro. Todo color debe salir de las variables CSS.
- Tras compilar, **verificar que el hash del bundle cambió** (`dist/assets/main-XXXX.js`); si no cambió, se está sirviendo código viejo.
- Probar siempre en **ventana de incógnito** (caché).

## Flujo de despliegue

```powershell
cd C:\catecumen
Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue
npm run build
# subir el contenido de dist/ a Hostinger y probar en incógnito
```

## Pendientes abiertos

1. **URLs de video reales:** la tabla `videos` tiene `url_video = 'PENDIENTE'`. El reproductor hoy usa los videos de prueba de `public/videos-prueba/{idioma}/{seccion}.mp4` (uno por sección, no por lección). Definir si cada lección tendrá su propia URL y, en ese caso, ajustar el reproductor para leer `url_video` mediante el puente. **Nota:** ya se pueden editar las URLs desde el panel admin → Videos.
2. **Limpiar políticas RLS públicas** de `usuarios` (`usr_select`, `usr_insert`, `usr_update` con rol `public`): son inseguras. Debe quedar solo `usuarios_sel_own` (SELECT, authenticated, `id = auth.uid()`). Las escrituras las hacen las edge functions con service-role, que ignoran RLS.
3. **`estado_residencia` e `idioma` en las edge functions:** ✅ RESUELTO. Se añadió `estado_residencia: formData.estado || null` e `idioma: formData.idioma || null` al objeto `fila` en `activar-pago` y `stripe-webhook`. Requieren redespliegue (`supabase functions deploy activar-pago --use-api` y `... stripe-webhook --use-api`).
4. **Pago aún en modo test de Stripe;** el resto de la plataforma ya está en producción.

## PWA (aplicación instalable)

La plataforma es una PWA instalable. Archivos: `public/manifest.webmanifest` (nombre, iconos, `theme_color #1e3a8a`, `display standalone`), `public/sw.js` (service worker: network-first para HTML, cache-first para estáticos con hash, nunca cachea Supabase; subir `CACHE_VERSION` en cada release para limpiar caché vieja), iconos `public/icon-192.png` / `icon-512.png` / `icon-512-maskable.png` (logo sobre fondo azul marca). El `index.html` raíz enlaza el manifest y registra el SW. Componente `InstallBar` en `App.jsx`: barra fija inferior (no flotante) con botón "Descargar aplicación"; usa `beforeinstallprompt` en Chrome/Android y muestra instrucciones en iOS/Safari; se oculta si ya está instalada (`display-mode: standalone`). Para no tapar otros botones, define la CSS var `--install-offset` (56px cuando la barra está visible) que el botón Soporte y la campana de mensajes suman a su `bottom` vía `calc()`.

## Consola de administración — etapas construidas y pendientes

Construido (requiere ejecutar sus SQL y desplegar): **Etapa 0** fundamentos de seguridad (login real, `es_admin`, `admin_log`). **Etapa 1** gestión de videos. **Etapa 2** gestión de usuarios (suspender/reactivar, borrado suave/total). **Etapa 3** mensajería bidireccional (campana+bandeja del usuario, difusión y mensaje individual del admin). **Etapa 4** constancias (revisar, descargar PDF, verificar QR, revocar/reactivar, revocar+reemitir). **Etapa 5** filtros del panel de usuarios (país/idioma/tipo/estado de pago) + tarjetas resumen de pagos + columna de idioma y de estado de pago. **Etapa 6** PWA instalable + barra "Descargar aplicación".

Todas las etapas están construidas. SQL de cada una en los archivos entregados; orden acumulado: `encuestas-video.sql` → `admin-fundamentos.sql` → `admin-videos.sql` (FIX) → `admin-usuarios.sql` → `admin-mensajeria.sql` → `admin-constancias.sql` → `admin-filtros.sql`.

## Rendimiento (PageSpeed) — hallazgos medidos, julio 2026

Punto de partida **73** → actual **85** (móvil). FCP 0.8 s, Speed Index ~2 s,
TBT ~10 ms, CLS 0.015. El único aviso rojo restante es *"Reduce el código
JavaScript sin usar — 122 KiB"*.

**Qué FUNCIONÓ (no quitar):**
- **`.htaccess`** con Brotli/Gzip: el bundle de ~914 KB viaja como ~254 KB. La
  mejora más rentable de todas. Incluye caché larga para `/assets/` y **nunca**
  para HTML ni `sw.js`.
- **Pantalla de carga inline** en `index.html` (`#cat-splash`): HTML+CSS puro,
  sin peticiones. Bajó el FCP de 3.2 s a 0.8 s. React la reemplaza al montar.
- **Precarga del fondo** (`<link rel="preload" as="image" fetchpriority="high">`
  **estático** en el HTML): el `div` con `background-image` a pantalla completa
  es el **elemento LCP** de la app. Debe ir estático, no creado por JS, para que
  el escáner de precarga del navegador lo vea. Redujo el "retraso en la carga
  de recursos" del LCP de 620 ms a ~120 ms.
- **Imágenes en WebP** (calidad 65 para fondos): −683 KB.
- **Pósters `.webp` de las tarjetas del tour** (`/tour/<clave>.webp`): pintan
  mientras el video descarga.
- **CSS incrustado en el HTML** (plugin `inlineCss` en `vite.config.js`):
  elimina una petición que bloqueaba el render (~170 ms).

**Qué NO funcionó (no reintentar sin medir):**
- **Vendor splitting** (`manualChunks` separando React/Supabase): **empeoró de
  84 a 70**. Más archivos = más viajes de ida y vuelta en hosting compartido, y
  esos chunks se necesitan todos de inmediato. El Speed Index subió de 1.2 s a
  4.9 s. Está documentado en `vite.config.js`.
- **Precargar recursos que NO son el LCP** (logo, póster del tour): roban ancho
  de banda en la conexión móvil simulada sin mejorar la métrica.

**Metodología obligatoria:** una optimización por despliegue y medir entre cada
una. Las corridas de PageSpeed varían ±10 puntos; **hacer 3-4 y tomar la
mediana** antes de concluir que algo mejoró o empeoró (un FCP de 3.2 s resultó
ser un dato atípico frente a 0.8 s reales).

**Pendiente (única palanca grande que queda):** troceo por pantallas con
`React.lazy`. Requiere extraer primero el ámbito compartido de `App.jsx`
(`C`, `T`, `PICK`, `BTN`, `OVERLAY`, `supabase`…) a un módulo y luego mover una
pantalla a la vez (constancias, mensajería, panel de cuenta, registro), probando
el flujo de pago entre cada paso. Es la intervención de mayor riesgo del
proyecto: abordarla como proyecto propio, no al final de una sesión.

## Pruebas automatizadas (Vitest)

Existe suite de pruebas con **Vitest**: `npm run test` (una pasada) y `npm run test:watch`. La lógica **pura** vive en **`src/logic.js`** (fuente única; `App.jsx` la importa y delega, no se duplica). Probado en `src/logic.test.js`:
- `buildSeq(uType, sacs, testMode)` — secuencia del curso; el Módulo 0 `kerigma` solo para catecúmenos, una vez, antes de `tc1`; papás/padrinos/catequista sin Kerigma.
- `translate` / `pick` — i18n con respaldo es→en→"".
- `redondearCuota`, `calcularCuotaPais`, `aplicarBeca` (Beca de Esperanza 20%) — precios PPP.

Al extraer más lógica de `App.jsx` (siguiente paso de modularización), moverla a `logic.js` y añadir pruebas. Es la red de seguridad para el pendiente grande (troceo del bundle).

**Pruebas de COMPONENTES (React Testing Library + jsdom):** configurado en `vite.config.js` (bloque `test`, con `esbuild.jsx:"automatic"` para el runtime JSX). Separación por extensión: **`*.test.js` → Node** (lógica pura, rápido); **`*.test.jsx` → jsdom** (componentes). Setup en `src/test-setup.js` (matchers de jest-dom + `cleanup`). DevDeps: `jsdom`, `@testing-library/{react,jest-dom,user-event}`. Requiere `npm i` tras el pull. Al trocear `App.jsx`, cada pantalla extraída se prueba con un `*.test.jsx`.

### Modularización de `App.jsx` (en curso)
Se está sacando el ámbito compartido y las pantallas del monolito, una pieza a la vez, con red de pruebas:
- **`src/logic.js`** — lógica pura (buildSeq, translate, pick, precios PPP, formatSerie, cuotaFromRow, resolverCuota).
- **`src/ui.js`** — estilos base (C, BTN, INP, LBL, checkStyle, radioStyle, CARD, MODAL, READ, FONT_READ, OVERLAY).
- **`src/i18n.js`** — runtime i18n (SUPPORTED_LANGS, detectLang, LANG, setAppLanguage, T, PICK, SINO). Depende de logic.js.
- **`src/supabaseClient.js`** — el cliente `supabase` (antes creado en App.jsx).
- **`src/data/encuadres.js`** — el objeto `ENCUADRES` (~1600 líneas de texto, 6 idiomas). Solo lo usa `EncuadreModal`.
- **`src/data/countries.js`** — datos geográficos/telefónicos: `PHONE_CODES` (claves telefónicas), `CDOCS` (documento de identidad por país) y `COUNTRIES` (lista ordenada). Sin dependencias. Los consumen `App.jsx` (formularios de registro) y `fields.jsx` (`PhoneField`/`CountrySelect`).
- **`src/data/course.js`** — **contenido del curso y helpers puros** (probado en `course.test.js`): `TC1_MODULES`/`TC1_ALL`/`TC2_CONFESION`/`TC2_UNCION`/`KERIGMA`/`COURSES` (secciones y videos), `Q` (banco de preguntas, con el `forEach` que reutiliza las de TC1 para los sacramentos), `videoPruebaUrls`, `SEC_META` (metadatos por sección: nombre 6-idiomas, icono, `cert`, videos, videoPrueba), `TEST_MODE` (**false en producción**), `isSectionDone`, `videoState`. Es el ámbito compartido que desbloquea las pantallas pesadas (Dashboard/CertificatesModal/CourseSectionView/VideoModal). `App.jsx` conserva solo el wrapper `buildSeq(uType,sacs)=buildSeqCore(...,TEST_MODE)`.
- **`src/components/icons.jsx`** — iconos SVG compartidos (`FlameIcon`, `CalizIcon`) y rutas (`iconoBautismo`, `iconoConfirmacion`).
- **`src/components/SecIcon.jsx`** — componente que resuelve los marcadores de `SEC_META` (`__caliz__`/`__flame__`/`__bautismo_img__`/`__confirmacion_img__`) a SVG/img, con respaldo a emoji. Depende de `data/course.js` + `icons.jsx`. Probado en `SecIcon.test.jsx`.
- **`src/components/fields.jsx`** — primitivas de formulario: `FRow`, `Input`, `PasswordInput` (solo dependen de `ui.js`) y `PhoneField`/`CountrySelect` (además de `i18n.js` + `data/countries.js`). Compartidas por los formularios de registro y por `Dashboard`.
- **`src/components/support.jsx`** — cluster de soporte y biblioteca compartido por varias pantallas: `SoporteModal`, `SoporteLink`, `SoporteFloat`, `LibraryButton`, `ConsultarDudasButton` (+ helpers internos `SOPORTE_EMAIL`, `soporteTexto`, `abrirCorreo`, `LIBRARY_LINKS`). Solo depende de `ui.js` + `i18n.js` (T, LANG). Era prerequisito de `CourseSectionView`.
- **`src/components/CourseSectionView.jsx`** — área de estudio de una sección (línea de tiempo de videos con estado bloqueado/disponible/visto/aprobado). Depende de `data/course.js` (SEC_META, videoState), `SecIcon`, `support.jsx` y `ui/i18n`. Diferida (`React.lazy`). Probada en `CourseSectionView.test.jsx`.
- **Flujo de video/evaluación (diferido):** `VideoModal` (reproductor: URL real vía puente o video de prueba), `EncuestaVideoModal` (encuesta de calidad obligatoria, guarda vía `guardar_encuesta_video`), `EvalModal` (evaluación, califica sobre 10, ≥8 aprueba; usa el banco `Q`), `ResultModal` (resultado aprobado/no aprobado) y `SectionCompleteModal` (sección completada). Cada uno en su archivo en `components/`. Comparten un **único `<Suspense>`** en el bloque "OVERLAY MODALS" de App (solo uno se muestra a la vez). Pruebas: `EvalModal.test.jsx` (calificación 10/10 y 5/10), `ResultModal.test.jsx`.
- **`src/components/CertificatesModal.jsx`** — constancias en PDF (jsPDF + QR por CDN). Sus helpers exclusivos (`genCode`, `cargarScript`, `imgToDataURL`, `generarQRDataURL`, `JSPDF_CDN`, `QRCODE_CDN`) viven en este archivo, no en el ámbito global. Depende de `data/course.js`, `SecIcon`, `supabaseClient`, `formatSerie` (logic) y `ui/i18n`. Diferida.
- **`src/components/Dashboard.jsx`** — panel "Mi Cuenta": progreso global/por sección, datos personales editables, constancias y las pestañas Agenda/Mensajes (que carga diferidas con su propio `lazy`+`Suspense`). Depende de `data/course.js`, `SecIcon`, `fields.jsx` (incl. `PhoneField`), `supabaseClient` y `ui/i18n`. Diferida. Probada en `Dashboard.test.jsx`.
- **`src/components/`** — pantallas/componentes extraídos, cada uno con su `*.test.jsx`: `EstrellasInput`, `AgendaTab`, `MensajesTab`, `EncuadreModal`, `LoginModal`, `ValidarConstanciaModal`, `CourseSectionView`, `EvalModal`, `ResultModal`, `Dashboard` (+ `VideoModal`, `EncuestaVideoModal`, `SectionCompleteModal`, `CertificatesModal` sin prueba propia aún).
- **Carga diferida (`React.lazy` + `<Suspense>`):** `EncuadreModal`, `LoginModal`, `ValidarConstanciaModal`, `CourseSectionView`, `VideoModal`, `EncuestaVideoModal`, `EvalModal`, `ResultModal`, `SectionCompleteModal`, `CertificatesModal`, `Dashboard` (y dentro de éste, `AgendaTab`/`MensajesTab`) — chunks aparte, fuera del bundle inicial. Es el "buen" troceo: pantallas que se abren DESPUÉS, no en la ruta crítica (distinto del vendor splitting que empeoró el arranque).
- **Código muerto eliminado:** `IntroVideo` (ya no se usa desde que se quitó el video intro).

Patrón para seguir: extraer pantalla → importar sus deps de esos módulos → escribir `*.test.jsx` (mockeando `i18n.js` y `supabaseClient.js` para aislar) → `React.lazy` + `Suspense`. `App.jsx` solo importa y usa. El premio grande (los "122 KiB de JS sin usar") llega al diferir las pantallas PESADAS (`RegisterForm`, `PaymentModal`, `CertificatesModal`, `Dashboard`, `EncuadreModal`) — dejar `RegisterForm`/`PaymentModal` para el final y probar el flujo de pago entre cada paso.

## Control de versiones (git)

El proyecto usa **git** (rama `main`, repo local en `C:\catecumen\.git`). Flujo: `git add -A` → `git commit -m "..."` tras cada cambio que funciona; commitear **antes** de subir `dist/` a Hostinger para tener punto de retorno. El `.gitignore` excluye `node_modules`, `dist`, `.env`/`.env.*` (claves) y `_archivo`.

**Carpeta `_archivo/`** (ignorada por git, NO se despliega): backups y duplicados sacados de la raíz/`src`, capturas de documentación, assets de `public/` sin uso, y videos fuente sin optimizar (`_archivo/fuentes-video/`). Nada de ahí forma parte del build. Ver `_archivo/LEEME.md`.

Pendiente/opcional: respaldo en **GitHub privado** (`git remote add origin ...` + `git push`), aún sin configurar.

## Cambios recientes (julio 2026)

- **Favicon e íconos de app = monograma.** `public/cat.ico` es un **ICO válido cuadrado** con el monograma (letra "C" + cruz, dorado en degradado sobre azul marca `#1e3a8a`) — reemplazó al antiguo `catecumenlogo.ico` (archivado). Los 4 iconos PWA (`icon-192.png`, `icon-512.png`, `icon-512-maskable.png` con margen de seguridad, `apple-touch-icon-pwa.png`) se regeneraron con el mismo monograma. Scripts en `_archivo/build_iconos.py`. El favicon está en las 4 páginas (`index.html`, `info/`, `recuperar/`, `admin/`) como `/cat.ico`.
- **Título del tab localizado.** `index.html` fija `document.title` según idioma (localStorage `catecumen_lang` o `navigator.language`) vía script inline en `<head>`: "Catecumen: El Aula Global de la Catequesis" (traducido a los 6 idiomas). `<title>` estático = versión ES de respaldo.
- **Banner de `/info` = video.** `info/index.html` usa un `<video>` (`.hero-video`, autoplay/loop/muted) con `public/info-catecumen.webm` + `.mp4` (720p sin audio, `+faststart`) y `public/info-catecumen-poster.jpg`, en lugar de `bienvenida-comunidad.jpg`.
- **Novena tarjeta del tour.** `WelcomeModal` en `App.jsx` tiene una tarjeta final `scene:"comunidad"` (comunidad/seguimiento pastoral) con video `public/tour/comunidad.mp4/.webm`; `"comunidad"` añadido a `CON_VIDEO` y escena CSS de respaldo.
- **Admin — botón "Agendar" en Usuarios.** Cada fila tiene `window.__agendarUsuario(id)` que abre un modal para agendar sesión a ese usuario individual (reutiliza la RPC `admin_crear_sesion` con un solo `p_usuario_ids`). El panel admin real incluye además de las pestañas ya documentadas las de **Sesiones, Atención y Constancias**.
- **Anti-clonación / licencia.** `vite.config.js` con `build.sourcemap:false` explícito; avisos de copyright en `index.html` (comentario, `<meta>`, consola). Los PDF de T&C (`normatividad_catecumen.pdf` ES, `norms_catecumen_en.pdf` EN) llevan una página-anexo **"12. Licencia de Software"** (Copyright, software propietario, NO open source, prohibición de copia/ingeniería inversa). Generador: `_archivo/build_licencia.py`.
- **Preview de WhatsApp/OG.** `og:image`/`twitter:image` = `catecumenlogo.png`; descripción (meta/og/twitter): "Comunidad virtual de preparación a los sacramentos en la Iglesia Católica desde la neuropedagogía catequética. Formación integral a tu propio ritmo."
- **PWA:** `sw.js` `CACHE_VERSION` va ahora en **`catecumen-v14`** (subió varias veces esta sesión). Recordar subirlo en cada release. Los íconos de una PWA ya instalada los cachea el SO: para ver el ícono nuevo puede requerirse **desinstalar y reinstalar** la app.
- **Analytics + cookies (RGPD).** `public/cookies.js` muestra un banner de consentimiento (6 idiomas) y **solo carga Google Analytics (GA4 `G-YDQW0M852Y`) tras aceptar** (`anonymize_ip`). Incluido en `index.html` e `info/` (NO en `recuperar/` — lleva token en la URL — ni en `admin/`). Reabrir banner: `window.catecumenCookies.abrir()`.
- **SEO.** `index.html`: `canonical`, `meta robots`, y **JSON-LD** (`EducationalOrganization` + `WebSite` + `Course`). Nuevos `public/robots.txt` y `public/sitemap.xml`. `noindex` en `admin/` y `recuperar/`. Pendiente del usuario: alta en Google Search Console + enviar sitemap.
- **Video intro eliminado.** Se quitó `catecumenvideo.mp4` (2.2 MB, archivado). La app arranca directo en el tour (`phase` inicial `"welcome"`); la "intro" es la pantalla de carga `#cat-splash`. Las guardas de "salir del sitio" ahora eximen `phase==="welcome"`.
- **Página `/recuperar` — contraste.** Arreglado el tema claro (panel/etiquetas/botón eran ilegibles por colores oscuros y `#fff` fijos). Su **lógica JS no tiene fuente** (ver trampa MFA arriba).
