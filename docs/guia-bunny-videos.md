# Guía paso a paso — Servir los videos con Bunny Stream

Guía para subir los videos finales a **Bunny Stream** y conectarlos a Catecumen.

## Lo que ya está listo en la plataforma (no hay que programar nada)

- **Reproductor:** `VideoModal` ya reproduce HLS (`.m3u8`) cargando `hls.js` bajo demanda; Safari/iOS nativo. Los `.mp4` directos también funcionan.
- **Puente:** al arrancar, la app lee `url_video` de la tabla `videos` por (sacramento, orden, **idioma**), ignora `'PENDIENTE'` y reproduce la URL real.
- **Protección (opcional):** edge function `firmar-video` lista para firmar las URLs con Token Authentication; el reproductor propaga el token a los segmentos.
- **Admin:** panel → pestaña **Videos** para pegar la URL de cada video.

Resultado: **no necesitas una página nueva**. Solo subes los videos a Bunny y pegas las URLs en el admin.

---

## Parte A — Crear la biblioteca y subir los videos

1. Crea cuenta en **bunny.net** y agrega método de pago (el plan de Stream es pago por uso, mínimo ~$1/mes).
2. En el panel: **Stream → Video Libraries → Add Video Library**.
   - Nombre: `Catecumen`.
   - **Regiones de replicación:** marca las cercanas a tu público (Sudamérica + Norteamérica/Europa). Más regiones = mejor latencia, un poco más de costo de almacenamiento.
3. Entra a la biblioteca recién creada y anota dos datos (los necesitarás):
   - **CDN Hostname** — algo como `vz-xxxxxxxx.b-cdn.net` (en la pestaña de la library o en su configuración de entrega).
   - **Token Authentication Key** — en **Security** de la library (solo si vas a usar token; ver Parte B).
4. **Sube los videos:** botón **Upload** (arrastrar y soltar, o subir en lote). Bunny los **transcodifica solo** a varias resoluciones (HLS adaptativo). La codificación H.264 hasta 1080p es gratis.
5. Cada video queda con un **GUID** (identificador). Su URL de reproducción HLS es:
   ```
   https://<CDN-Hostname>/<GUID>/playlist.m3u8
   ```
   Ejemplo: `https://vz-ab12cd34.b-cdn.net/9f8e7d6c-1234-.../playlist.m3u8`
   La encuentras en la vista del video (opción de "HLS Playlist URL" / "Direct Play").

---

## Parte B — Elegir la protección

El contenido es de pago, así que conviene que no lo puedan descargar/incrustar libremente. Dos caminos:

### Opción 1 — Allowed Referrers (sin código, para lanzar ya)
En la library → **Security → Allowed Referrers**, agrega:
```
catecumen.com
www.catecumen.com
```
Bunny solo sirve el video si la petición viene de tu sitio. **No requieres la edge function.** Suficiente para arrancar. (Deja **Token Authentication OFF** en este caso.)

### Opción 2 — Token Authentication (más fuerte, ya está programado)
URLs firmadas que expiran. En la library → **Security → Token Authentication: ON**. Luego ve a la Parte C.
(Con el token activo, el *Allowed Referrers* deja de ser necesario.)

---

## Parte C — (Solo Opción 2) Configurar el token en Supabase

1. En Supabase → **Edge Functions → Secrets**, crea:
   - `BUNNY_TOKEN_KEY` = la **Token Authentication Key** de la library (Parte A, punto 3).
   - `BUNNY_CDN_HOST` = el **CDN Hostname**, p. ej. `vz-xxxxxxxx.b-cdn.net` (solo el host, sin `https://`).
2. Despliega la función (en **terminal**, no en el SQL Editor):
   ```
   supabase functions deploy firmar-video --use-api
   ```
   "Enforce JWT" en **OFF** (la función valida el JWT internamente).
   *(Si el CLI da 403 de permisos, despliega desde el Dashboard pegando `supabase/functions/firmar-video/index.ts`.)*

El reproductor detecta las URLs de Bunny (`*.b-cdn.net`), pide la firma a `firmar-video` y reproduce la URL firmada. Si el token está apagado o la función no responde, **cae a la URL cruda** automáticamente (no se rompe nada).

---

## Parte D — Pegar las URLs en el admin

1. Entra al **panel admin → pestaña Videos**.
2. Para cada lección, edita su fila y pega en **`url_video`** la URL HLS:
   ```
   https://<CDN-Hostname>/<GUID>/playlist.m3u8
   ```
3. **Por idioma:** cada idioma es una **fila propia** (columna `idioma`). Pega la URL de la versión doblada/subtitulada de ese idioma en su fila.
   - Los idiomas que aún no tengan URL real siguen mostrando el **video de prueba** automáticamente (no rompe nada). Puedes ir completando idiomas poco a poco.

---

## Parte E — Probar

1. Abre la plataforma en **ventana de incógnito** (evita caché).
2. Entra al curso y abre una lección con URL real.
3. Verifica:
   - Reproduce el video real (ya NO aparece el cartel "VIDEO DE PRUEBA").
   - La calidad se ajusta a la conexión (adaptativo).
   - En móvil/datos, arranca sin trabarse.
4. Si activaste token (Opción 2) y un **segmento** diera error 403, casi seguro es un detalle de formato del `token_path`: avísame con el error de consola y lo ajusto en `firmar-video`.

---

## Parte F — Subir muchos videos en lote (los 54)

Con decenas de videos × idiomas, subir uno por uno es lento. Opciones, de más simple a más automática:

### F.1 — Arrastrar en lote (lo más simple)
En la library → **Upload**, selecciona o arrastra **varios archivos a la vez**. Bunny los encola y transcodifica en paralelo. Suficiente para una carga inicial.

### F.2 — Nombrar los archivos con orden (para no perderte)
Antes de subir, renombra los archivos con un patrón claro que refleje (sacramento, orden, idioma), p. ej.:
```
tc1-01-es.mp4   tc1-01-en.mp4   ...
bautismo-01-es.mp4   bautismo-02-es.mp4   ...
```
Así, al pegar las URLs en el admin, sabes de inmediato qué GUID corresponde a qué fila. Después de subir, exporta/copia la lista de videos de Bunny (cada uno muestra su nombre + GUID) y vas emparejando.

### F.3 — Carga por API (si automatizas o son muchísimos)
Bunny Stream tiene API. El flujo por video es dos pasos:
1. **Crear el video** (devuelve el `guid`):
   `POST https://video.bunnycdn.com/library/<LIBRARY_ID>/videos` con header `AccessKey: <API_KEY_de_la_library>` y body `{"title":"tc1-01-es"}`.
2. **Subir el archivo** a ese guid:
   `PUT https://video.bunnycdn.com/library/<LIBRARY_ID>/videos/<guid>` con el binario del video y el mismo `AccessKey`.
La URL de reproducción final es `https://<CDN-Hostname>/<guid>/playlist.m3u8`.
> Si quieres, te preparo un script (Node o Python) que suba una carpeta completa y te devuelva un CSV de `nombre,guid,url` listo para pegar en el admin. Solo dime y lo armo.

### F.4 — Consejo de orden de trabajo
1. Sube **primero un solo idioma completo** (p. ej. español) y pega esas URLs. Lanza con eso.
2. Ve agregando los demás idiomas después; los que falten siguen mostrando el video de prueba, así que la plataforma nunca queda "rota".

## Notas

- **Costos (jul 2026):** entrega $0.01/GB (NA-EU), $0.035/GB (Sudamérica); almacenamiento $0.01/GB/mes; codificación gratis. El adaptativo además **reduce** los GB entregados a quien tiene conexión lenta.
- **No borres** los videos de prueba locales (`public/videos-prueba/...`): son el respaldo mientras completas las URLs reales.
- **`catecumenlogo.png`** y demás no tienen que ver aquí; esto es solo la tabla `videos`.
- Si algún día cambias de host (Cloudflare Stream, etc.), el reproductor ya soporta HLS: solo pegas las nuevas URLs `.m3u8` en el admin.
