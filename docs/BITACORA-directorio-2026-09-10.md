# Bitácora — Directorio de parroquias · 10 de septiembre de 2026

Cierre del directorio diocesano de Querétaro y alta de la primera parroquia
afiliada. Documento de traspaso: léelo antes de tocar el directorio.

---

## Estado final

| | |
|---|---|
| Fichas en `directorio_parroquias` | **136**, todas activas |
| Con coordenada | **136 de 136** |
| `geo_precision = 'templo'` | 118 |
| `geo_precision = 'localidad'` | 18 (todas con `geo_revisar = true`) |
| Sin párroco | 1 — Templo de San Judas Tadeo, filial |
| Parroquias afiliadas (`public.parroquias`, verdes) | **1** |
| Diócesis afiliadas (`public.diocesis`, verdes) | **1** |
| Registros de prueba | **0** |

**Primera parroquia afiliada:** Nuestra Señora de la Esperanza, Corregidora,
Qro. · Pbro. Mtro. Jorge Ramírez Casas · `registro_id` **`MX-PAR-2026-000001`**.

**Diócesis de Querétaro:** `registro_id` **`MX-DIO-2026-000001`** (era
`TEST-DIO-QRO`; se cambió tras comprobar que ningún usuario lo había usado).
S. E. Mons. Fidencio López Plaza · Reforma 48, Col. Centro, C.P. 76000 ·
442 224 0738.

---

## Qué se hizo, en orden

1. **Mapa con marcadores verde/rojo.** `src/components/DirectorioAfiliados.jsx`:
   aro verde = afiliada, aro rojo = en trámite, con leyenda bajo el mapa. Los
   verdes se dibujan por encima (`zIndexOffset`) porque quedaban sepultados bajo
   la pila de rojos de la zona metropolitana.
2. **Directorio diocesano visible en el buscador.** `scripts/directorio-diocesano.sql`
   reescribió `buscar_afiliados_cercanos` y `buscar_afiliados_texto` para unir
   `directorio_parroquias` con una columna `afiliada boolean`. Límite 60 → 200.
3. **Limpieza de datos de prueba.** Se borraron las 4 fichas sembradas
   (2 parroquias inventadas, la Arquidiócesis de Buenos Aires, y la marca de la
   diócesis de Querétaro). `scripts/directorio-datos-prueba.sql` quedó
   **desactivado** con un `raise exception`: volver a correrlo sembraría datos
   falsos en el mapa público.
4. **Datos de la diócesis completados** desde diocesisqro.org y
   cancilleriadiocesisqro.org: 49 coordenadas y 25 correos parroquiales.
5. **Huecos cerrados.** Las 10 parroquias sin coordenada y los párrocos que
   faltaban. Ver «Decisiones» abajo.
6. **Vocabulario de `geo_precision` unificado** y columna `geo_fuente` añadida.
7. **Auditoría de pines.** Sin hallazgos.

---

## Decisiones que conviene no revertir sin pensarlo

### Criterio de publicación
Lo único que hace inútil una ficha es que el catecúmeno **no pueda saber a
dónde ir**. Sin correo, sin teléfono o sin párroco **no bloquea**: se publica
igual, con aviso. Solo se bloquea si falta dirección *y* coordenada.
Fijado por Enyoria. Ver `CLAUDE.md` § Convenciones.

### `geo_precision` / `geo_fuente`
Dos columnas, dos preguntas. `geo_precision` dice **qué es el pin**
(`templo` | `localidad`, con `check constraint`); `geo_fuente` dice **de dónde
salió** (`denue_nombre` | `denue_direccion` | `osm` | `curacion_manual`).
**No se inventa `geo_precision`:** si no se sabe la procedencia, se deja nula.

### Enlace afiliada ↔ directorio
Al afiliar una parroquia hay que apuntar `directorio_parroquias.parroquia_id`
a la ficha nueva de `public.parroquias`. **Sin ese enlace la parroquia sale dos
veces en el mapa**, en verde y en rojo. La plantilla que lo hace bien es
`scripts/afiliar-esperanza-corregidora.sql`.

---

## Trampas encontradas (y esquivadas)

- **`parroquias_geo_osm.sql`, en la raíz del repo: NO EJECUTAR.** Contiene
  `update` con coordenadas **duplicadas** — le asigna el mismo nodo de OSM a dos
  parroquias distintas («Nuestra Señora de Guadalupe» y «…(El Colorado)», que
  están a 20 km una de otra). Nunca se corrió; la base tiene 0 duplicados.
- **Homónimos.** Se rechazó un pin para Santa Teresa del Niño Jesús: el nodo
  «El Campanario» que devolvió la búsqueda es un caserío de 474 habitantes en el
  municipio de **El Marqués**, no el Fraccionamiento El Campanario de Santiago
  de Querétaro. Misma trampa con «San Judas Tadeo y de la Santa Cruz»
  (Juriquilla), que **no** es el Templo de San Judas Tadeo de Lomas del Marqués.
- **Una ficha sin coordenada pasa todos los filtros de distancia** del buscador
  por cercanía, así que aparece en «cerca de mí» a cualquier radio.

---

## Abierto

1. **Templo de San Judas Tadeo — sin párroco.** Es un templo filial. No usar el
   Pbro. Dr. Rubén Cabrera López: ese es de la parroquia homónima de Juriquilla.
   Discrepa además el municipio entre fuentes (Querétaro 76144 / El Marqués
   76144 / Santiago de Querétaro 76146). Confirmar con la Curia.
2. **Parroquia de Nuestra Señora de la Paz (Col. Satélite) — párroco en duda.**
   Tres páginas de la diócesis dan tres nombres: Bernardo Reséndiz Vizcaya
   (2022), José Rodrigo López Cepeda (sin fecha), Iván García Avendaño
   (10/03/2025). El tercero es el que la base ya tiene como párroco de la
   Esperanza en Colón, así que uno de los dos registros está desactualizado.
   Se dejó **vacío** a propósito. Confirmar por teléfono: 442 224 0738.
3. **Las 18 fichas con `geo_precision = 'localidad'`** llevan un pin al centro
   del pueblo o de la colonia, no al templo. Utilizables; afinables.
4. **Botón «Buscar parroquia afiliada» en la portada:** sigue con el distintivo
   COMING SOON. Decidir si se habilita ya.
5. **Hoy solo hay 1 parroquia afiliada de 136.** El mapa se verá casi todo rojo
   hasta que se afilien más. La leyenda lo explica, pero conviene tenerlo en
   cuenta al presentarlo.

---

## Scripts creados (todos en `scripts/`)

| Archivo | Qué hace | ¿Correr otra vez? |
|---|---|---|
| `directorio-diocesano.sql` | RPCs con columna `afiliada`, une el directorio | idempotente |
| `afiliados-queretaro.sql` | Borra datos de prueba, corrige la diócesis | idempotente |
| `completar-directorio-diocesano.sql` | 49 coordenadas + 25 correos | idempotente |
| `correccion-parrocos.sql` | Párroco de la Esperanza (Corregidora) | idempotente |
| `completar-huecos-directorio.sql` | 8 coordenadas + 10 párrocos | idempotente |
| `parroco-cristo-de-la-montana.sql` | Párroco del templo filial | idempotente |
| `coordenadas-ultimas-dos.sql` | Las 2 últimas coordenadas, a mano | idempotente |
| `registro-id-queretaro.sql` | `TEST-DIO-QRO` → `MX-DIO-2026-000001` | ya aplicado |
| `previo-afiliar-esperanza.sql` | Ensayo, solo lee | cuando quieras |
| `afiliar-esperanza-corregidora.sql` | **Plantilla** para afiliar una parroquia | adaptar y correr |
| `normalizar-geo-precision.sql` | Vocabulario único + `geo_fuente` | idempotente |
| `auditar-pines-osm.sql` | Auditoría de pines, solo lee | cuando quieras |
| `verificar-directorio.sql` | Estado del directorio en una consulta | cuando quieras |
| `directorio-datos-prueba.sql` | **DESACTIVADO** — sembraría datos falsos | ✗ nunca |

---

## Auditoría — resultado

`scripts/auditar-pines-osm.sql`, ejecutado el 10-sep-2026:

- **0** coordenadas duplicadas.
- **0** parroquias a menos de 150 m una de otra.
- 26 fichas señaladas como «lejos del centroide de su municipio». Se verificaron
  las 9 que eran señal real —las de municipios con suficientes fichas como para
  que el centroide signifique algo, más las 2 de origen OSM— contra la dirección
  publicada por la diócesis y 2–3 fuentes independientes cada una. **Las 9
  coinciden.** Las 17 restantes son ruido del método: en municipios con 2 o 3
  parroquias, el «centroide excluyendo la propia» es simplemente la otra
  parroquia, y en la Sierra Gorda 37 km entre dos parroquias es normal.

Explicación de las que parecían anómalas: cinco están en **Santa Rosa Jáuregui**
(Jofrito, Puerto de Aguirre, Montenegro, Buenavista, la cabecera), que pertenece
al municipio de Querétaro pero se extiende ~30 km al norte de la ciudad;
Nuestra Señora del Rosario está en la **comunidad de Bravo**, punta sur de
Corregidora; San Felipe de Jesús está en **Chichimequillas**, El Marqués.

Los 2 pines de origen OSM verificados coinciden con la dirección publicada a
**13 m** y **3 m**.
