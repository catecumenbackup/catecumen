# Cómo cargar los videos de Bunny a la plataforma (`bunny_urls.py`)

Esta herramienta toma los videos de tu librería de Bunny y escribe sus URLs en
Supabase (tabla `videos`), para que se reproduzcan en la plataforma. Jala los
GUID directo de la API de Bunny, así que **nunca copias una URL a mano** y es
imposible que se cuele un token, un `expires` o un GUID mal pegado.

---

## 0) Requisito previo: nombrar bien los videos en Bunny

El emparejado automático se basa en el **título** del video en Bunny. Cada video
debe empezar con su **código**:

- Kerygma: `KER-01 A · …`, `KER-02 B · …` (tema de 2 dígitos, bloque A/B/C/D)
- Tronco Común 1: `TC1-03 D · …`
- Confirmación: `CONF-04 B · …`
- Unción: `UNC-09 A · …`
- Confesión/Reconciliación: `REC-08 C · …`

Regla del `orden`: `orden = (tema − 1) × 4 + bloque` (A=1, B=2, C=3, D=4).
Ej.: `KER-02 B` → (2−1)×4 + 2 = **orden 6**.

> Los videos que ya subiste siguen esta convención. Si subes uno nuevo, ponle el
> código al inicio del título y listo. Lo que no tenga código, el script lo ignora
> y te avisa (no rompe nada).

---

## 1) Consigue tu API Key de Bunny (una sola vez)

En Bunny: **Stream → tu librería (796078) → pestaña "API" → copia "API Key"**.
Es un secreto de esa librería; se usa solo en tu computadora.

---

## 2) Abre PowerShell en la carpeta del proyecto

```powershell
cd C:\catecumen
```

---

## 3) Define tu API Key en ESA ventana

```powershell
$env:BUNNY_API_KEY="pega-aqui-tu-api-key"
```

Compruébalo (debe imprimir tu clave):

```powershell
echo $env:BUNNY_API_KEY
```

> La variable vive solo en esa ventana. Si cierras PowerShell o abres otra, hay
> que volver a definirla. No uses `set NOMBRE=...` (eso es de CMD, no de PowerShell).

---

## 4) Corre el script en modo REVISIÓN (no toca la base)

```powershell
python scripts\bunny_urls.py
```

Verás algo así:

```
Videos en la librería Bunny: 17
Emparejados por código de título: 17
   kerigma        orden  1  ←  KER-01 A · DIOS TE AMA Y TE LLAMA · En voz…
   kerigma        orden  6  ←  KER-02 B · EL PECADO Y LA NECESIDAD…
   ...
SQL escrito en: bunny-videos.sql  (17 UPDATE)
```

Revisa que:
- El número de "Emparejados" sea el que esperas.
- No haya avisos de **"Sin código reconocible"** (títulos mal nombrados) ni de
  **"CONFLICTO"** (dos videos distintos para el mismo tema/bloque). Si los hay,
  corrige el título en Bunny y vuelve a correr.

Esto creó el archivo **`bunny-videos.sql`** en `C:\catecumen`.

---

## 5) Súbelo a Supabase — elige UN camino

### Camino A (fácil, sin más claves)

1. Abre el archivo `C:\catecumen\bunny-videos.sql`.
2. Copia **todo** su contenido.
3. En Supabase → **SQL Editor** → pega → **Run**.

Eso escribe las URLs en la tabla `videos`. **No hace falta recompilar ni
`git push`**: la plataforma lee esas URLs de la base al abrir cada video.

### Camino B (un solo comando, escribe solo)

Necesitas además el **service role key** (Supabase → Project Settings → API →
`service_role` → Reveal). Luego:

```powershell
$env:SUPABASE_SERVICE_ROLE_KEY="pega-aqui-el-service-role"
python scripts\bunny_urls.py --apply
```

El script escribe directo en Supabase y te dice cuántas filas actualizó.

**Opciones extra de `--apply`:**
- `--activar` → además de poner la URL, marca el video como **activo** (útil si
  alguno estaba desactivado). Ej.: `python scripts\bunny_urls.py --apply --activar`
- `--crear` → si el `orden` de un video **aún no existe** en la tabla, **crea la
  fila** (con el título y la duración que tiene en Bunny, y activo). Así no tienes
  que crearla a mano en la pestaña "Videos".
  Ej.: `python scripts\bunny_urls.py --apply --crear`
- Puedes combinarlas: `python scripts\bunny_urls.py --apply --activar --crear`
  (lo más completo: pone URL, activa, y crea lo que falte).

> `SUPABASE_URL` se toma solo de tu `.env` (`VITE_SUPABASE_URL`); no hace falta
> definirla.

---

## Actualizar SOLO un video

Si solo cambiaste o subiste **un** video, usa `--solo` con su código:

```powershell
# Revisar (genera un .sql con una sola línea):
python scripts\bunny_urls.py --solo "KER-03 B"

# Escribir solo ese (con service key):
python scripts\bunny_urls.py --apply --solo "KER-03 B"
```

También sirve con `--activar` / `--crear`. Alternativa sin filtro: corre la
herramienta normal (es idempotente, re-pone las URLs correctas de todos sin dañar
nada) o abre el `bunny-videos.sql` y copia solo la línea del video que te interesa.

## 6) Verifica que quedó bien

```powershell
python scripts\bunny_urls.py --verify
```

(También necesita el service role key, igual que `--apply`.) Debe decir:

```
✅ Todo correcto: formato limpio /<guid>/playlist.m3u8 y sin GUID duplicados.
```

Si algo está mal, te marca exactamente qué: URL con token, placeholder, formato
inválido o GUID duplicado.

Prueba final: abre uno de esos videos en el curso (en incógnito) y confirma que
reproduce.

---

## 7) Tu rutina de ahora en adelante (videos nuevos)

1. Sube el video a Bunny **con el código en el título** (`KER-03 B · …`).
2. `python scripts\bunny_urls.py` (revisa el resumen).
3. Corre el `bunny-videos.sql` en Supabase **o** usa `--apply`.
4. `python scripts\bunny_urls.py --verify`.

Sin copiar URLs, sin tokens, sin errores.

---

## Problemas comunes

| Síntoma | Causa / arreglo |
|---|---|
| `Falta la API key de Bunny` | No definiste `BUNNY_API_KEY` en esa ventana. Repite el paso 3. |
| `Para --apply necesito … SERVICE_ROLE_KEY` | Define `$env:SUPABASE_SERVICE_ROLE_KEY="…"` antes, o usa el Camino A. |
| Un video sale en "Sin código reconocible" | El título no empieza con `KER/TC1/CONF/UNC/REC-NN L`. Renómbralo en Bunny. |
| "CONFLICTO: dos videos para el mismo orden" | Dos videos con el mismo código. Deja uno; borra/renombra el otro en Bunny. |
| `· sin fila para … orden N` (al aplicar) | Ese `orden` aún no existe en la tabla `videos` para ese sacramento. Es inofensivo. |

## Reglas de oro
- En `videos.url_video` va **solo** `https://vz-20178245-a58.b-cdn.net/<guid>/playlist.m3u8`.
- **Nunca** pegues la "HLS Playlist URL" firmada de Bunny (lleva `bcdn_token=…&expires=…`): la app la firma sola.
- El script hace todo esto por ti; úsalo y no copies URLs a mano.
