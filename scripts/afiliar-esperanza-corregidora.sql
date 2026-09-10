-- scripts/afiliar-esperanza-corregidora.sql
--
-- Da de alta la PRIMERA parroquia afiliada de Catecumen:
-- Parroquia de Nuestra Señora de la Esperanza, Corregidora, Qro.
-- Párroco: Pbro. Mtro. Jorge Ramírez Casas.
--
-- NADA se teclea a mano. Todos los datos se copian de la ficha que ya está
-- verificada en `directorio_parroquias` (id 'parroquia-de-nuestra-senora-de-
-- la-esperanza'), así que la ficha afiliada nace idéntica a la del directorio
-- y no se introduce ninguna variante nueva del nombre ni de la dirección.
--
-- Hace DOS cosas, y la segunda es la que evita un problema real:
--   1) Inserta la parroquia en `public.parroquias` con aprobada = true.
--   2) Apunta `directorio_parroquias.parroquia_id` a la ficha recién creada.
--      Sin ese enlace la parroquia saldría DOS VECES en el mapa —en verde la
--      afiliada y en rojo la del directorio— exactamente como pasaba con la
--      parroquia de ejemplo que borramos. Las funciones de búsqueda excluyen
--      del directorio toda ficha cuyo parroquia_id ya esté aprobado.
--
-- Idempotente: si ya se corrió, no vuelve a insertar.

begin;

-- ── 0 · Seguro: la ficha de origen tiene que existir y estar completa ───────
do $$
declare r record;
begin
  select dp.nombre, dp.parroco, dp.direccion, dp.email, dp.telefono, dp.lat, dp.lng
    into r
    from public.directorio_parroquias dp
   where dp.id = 'parroquia-de-nuestra-senora-de-la-esperanza';

  if not found then
    raise exception 'No existe la ficha de origen en directorio_parroquias. ¿Corriste directorio-diocesano.sql?';
  end if;
  if r.lat is null or r.lng is null then
    raise exception 'La ficha de origen no tiene coordenada: la parroquia afiliada no aparecería en el mapa.';
  end if;
  if coalesce(r.email, '') = '' then
    raise exception
      'La ficha de origen no tiene correo. Una parroquia afiliada sin correo de contacto no sirve de nada en el directorio. Escríbelo primero con:  update public.directorio_parroquias set email = ''<correo>'' where id = ''parroquia-de-nuestra-senora-de-la-esperanza'';';
  end if;
  if coalesce(r.parroco, '') = '' then
    raise exception 'La ficha de origen no tiene párroco. ¿Corriste correccion-parrocos.sql?';
  end if;
end $$;

-- ── 1 · Alta de la parroquia afiliada ───────────────────────────────────────
--
-- El registro_id sigue el mismo esquema que le pusimos a la diócesis
-- (MX-DIO-2026-000001). Es el código que los catequistas de esta parroquia
-- escribirán al registrarse, así que se ve en pantalla: conviene que diga algo.
with nueva as (
  insert into public.parroquias
    (registro_id, nombre, pais, codigo_iso, nombre_contacto, email_contacto,
     codigo_pais_tel, telefono, direccion, nombre_pastor, estado, municipio,
     aprobada, lat, lng)
  select 'MX-PAR-2026-000001',
         dp.nombre,
         coalesce(dp.pais, 'México'),
         'MX',
         'Despacho Parroquial',
         dp.email,
         '+52',
         dp.telefono,
         dp.direccion,
         dp.parroco,
         'Querétaro',
         dp.municipio,
         true,              -- aprobada: sale en verde en el mapa desde ya
         dp.lat,
         dp.lng
    from public.directorio_parroquias dp
   where dp.id = 'parroquia-de-nuestra-senora-de-la-esperanza'
     and not exists (select 1 from public.parroquias p
                      where p.registro_id = 'MX-PAR-2026-000001')
  returning id
)
-- ── 2 · Enlaza la ficha del directorio con la afiliada ─────────────────────
update public.directorio_parroquias d
   set parroquia_id = nueva.id,
       estado_dato  = 'parroquia afiliada a Catecumen el 2026-09-10; su ficha pública es la de public.parroquias',
       updated_at   = now()
  from nueva
 where d.id = 'parroquia-de-nuestra-senora-de-la-esperanza';

-- ── 3 · Comprobación ────────────────────────────────────────────────────────
-- Esperado: una fila, con el enlace resuelto y aprobada = true.
select p.registro_id,
       p.nombre,
       p.nombre_pastor,
       p.municipio,
       p.email_contacto,
       concat_ws(' ', p.codigo_pais_tel, p.telefono) as telefono,
       p.aprobada,
       p.lat, p.lng,
       (d.parroquia_id = p.id) as enlazada_al_directorio
  from public.parroquias p
  left join public.directorio_parroquias d
         on d.id = 'parroquia-de-nuestra-senora-de-la-esperanza'
 where p.registro_id = 'MX-PAR-2026-000001';

commit;

-- ═══════════════════════════════════════════════════════════════════════════
-- DESPUÉS DE CORRER ESTO
--
-- 1 · Recarga el buscador. La Esperanza de Corregidora debe salir UNA sola vez,
--     en VERDE. Si sale dos veces, el enlace del paso 2 no se aplicó: avísame.
--     Comprobación rápida:
--
--       select count(*) from public.parroquias where aprobada;          -- 1
--       select parroquia_id from public.directorio_parroquias
--        where id = 'parroquia-de-nuestra-senora-de-la-esperanza';      -- no nulo
--
-- 2 · El código de registro de esta parroquia es MX-PAR-2026-000001. Es lo que
--     sus catequistas escriben al darse de alta. Pásaselo al párroco.
--
-- 3 · Lo que este script NO hace, a propósito: no crea ninguna cuenta de
--     usuario ni contraseña. El alta de la parroquia en el directorio y el
--     acceso de sus catequistas son cosas distintas; el segundo pasa por el
--     registro normal de la plataforma, con el código de arriba.
