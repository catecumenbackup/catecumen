-- scripts/diagnostico-directorio.sql
-- Corre las tres consultas en el SQL Editor y pásame las tres salidas.
-- Ninguna usa RPC protegida por es_admin(), así que no hay riesgo de rollback.

-- ── 1 · ¿El SQL nuevo quedó instalado? ──────────────────────────────────────
-- Ambas filas deben decir tiene_afiliada = true. Si dicen false, el script
-- directorio-diocesano.sql NO se corrió (o se corrió a medias).
select p.proname as funcion,
       pg_get_function_result(p.oid) like '%afiliada%' as tiene_afiliada,
       pg_get_function_arguments(p.oid) as argumentos
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and p.proname in ('buscar_afiliados_texto','buscar_afiliados_cercanos')
 order by 1, 3;

-- ── 2 · ¿Están los datos y tienen coordenada? ───────────────────────────────
-- Esperado: 136 · 136 · 80.  Si activas = 0, las filas están con activo=false.
-- Si la tabla no existe, falta correr sql/01_esquema.sql + sql/02_directorio.sql.
select count(*)                                            as total,
       count(*) filter (where activo)                      as activas,
       count(*) filter (where activo and lat is not null)  as con_coordenada,
       count(*) filter (where parroquia_id is not null)    as ya_ligadas_a_afiliada
  from public.directorio_parroquias;

-- ── 3 · ¿Qué devuelve REALMENTE el buscador? ────────────────────────────────
-- Esta es la prueba que decide. Esperado: una fila afiliada=false con
-- con_coordenada = 80, más las afiliadas que ya tenías.
-- Si NO aparece la fila afiliada=false, el problema está en la consulta 1 o 2.
select afiliada,
       count(*)                                  as filas,
       count(*) filter (where lat is not null)   as con_coordenada
  from public.buscar_afiliados_texto(null, null, null, null, null, 500)
 group by afiliada
 order by afiliada desc nulls last;
