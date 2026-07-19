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
- **Usuarios** — buscar, ficha (pago/beca/inscripciones/constancias con PDF), suspender/reactivar, borrado suave y borrado total, y **enviar mensaje** individual. RPCs: `admin_listar_usuarios`, `admin_ficha_usuario`, `admin_suspender_usuario`, `admin_borrado_suave_usuario`; borrado total vía edge function `admin-eliminar-usuario`.
- **Mensajes** — bandeja de conversaciones + chat + responder + difusión (a todos o filtrando por país/tipo/sacramento). RPCs: `admin_conversaciones`, `admin_ver_conversacion`, `admin_enviar_a_usuario`, `admin_difundir`, `admin_no_leidos`, `admin_facetas_usuarios`.
- **Auditoría** — lee `admin_log` (solo lectura).

Salvaguardas: no se puede suspender/eliminar a un admin ni a sí mismo. Borrado total es irreversible (recomendar borrado suave). `pgcrypto` vive en el esquema `extensions` (no `public`): las funciones que usan `crypt` necesitan `search_path = public, extensions`.

**Lección de despliegue SQL:** no incluir una línea de verificación que ejecute una RPC protegida por `es_admin()` (p.ej. `SELECT admin_listar_videos();`) al final de un script; en el SQL Editor `auth.uid()` es nulo, lanza "no autorizado" y **revierte (rollback) todo el script**. Verificar con `pg_get_functiondef(...)` o desde el panel.

### Mensajería — lado usuario (en `App.jsx`)
- Componente `MensajesTab`: bandeja donde el usuario lee y responde. RPCs: `mis_mensajes`, `marcar_leidos_usuario`, `responder_usuario`.
- Pestaña "Mensajes" dentro de "Mi Cuenta" (Dashboard acepta prop `initialTab`).
- **Campana flotante** ✉️ en el área de estudio (`phase==='course'`), en `bottom:74, right:18, zIndex:901` (encima del botón Soporte que está en `bottom:18, zIndex:900`). Contador rojo de no leídos con polling cada 60s vía `mis_mensajes_no_leidos()`. Estado en App: `msgNoLeidos`, `dashTab`.
- **Cuenta suspendida/eliminada:** en `handleLoginSuccess`, si `u.suspendido || u.eliminado` cierra sesión y muestra el modal (`cuentaSuspendida`), no deja entrar.

### Orden de ejecución de los SQL (si se arma de cero)
`encuestas-video.sql` → `admin-fundamentos.sql` → `admin-videos.sql` (o `admin-videos-FIX.sql`, que usa `descripcion_es/en`) → `admin-usuarios.sql` → `admin-mensajeria.sql`. Luego crear el primer admin.

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
