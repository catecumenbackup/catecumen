# Producción — guía de despliegue de Catecumen

Checklist para llevar cambios a producción (catecumen.com, Hostinger + Supabase).
La plataforma ya está en producción; **Stripe sigue en modo test**.

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

## 4. Edge Functions (Supabase — terminal, no SQL Editor)

Desplegar con `--use-api` (evita Docker) y **"Enforce JWT" en OFF**:

```bash
supabase functions deploy <nombre> --use-api
```

Funciones: `crear-sesion-pago`, `activar-pago`, `stripe-webhook`, `reanudar-pago`,
`admin-eliminar-usuario`, `firmar-video`, `consultar-magisterium`,
`geocodificar-afiliados`, `geocodificar-uno`.

Solo redesplegar las que cambiaron. Secrets manuales requeridos (una vez):
`BUNNY_TOKEN_KEY`, `BUNNY_CDN_HOST` (firmar-video); `MAGISTERIUM_API_KEY`
(+ opcional `MAGISTERIUM_BASE_URL`/`MAGISTERIUM_MODEL`/`MAGISTERIUM_LIMITE_SEMANAL`).
Las `SUPABASE_URL`/`ANON_KEY`/`SERVICE_ROLE_KEY` las inyecta Supabase.

## 5. Verificación post-despliegue (en incógnito)

- [ ] La app carga y arranca en el tour (pantalla de carga → bienvenida).
- [ ] Registro de alumno + flujo de pago (Stripe test) llega a Checkout y regresa.
- [ ] Buscador de parroquias: pide **ubicación**, muestra cercanas; búsqueda sin acentos funciona; el modal no se corta.
- [ ] Panel `/admin/`: login real; pestaña **Afiliados** lista/aprueba/suspende/borra parroquias, diócesis, centros y "otras organizaciones".
- [ ] Consola sin errores 500 (Magisterium, edge functions).
- [ ] Tema claro/oscuro y los 6 idiomas.

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
