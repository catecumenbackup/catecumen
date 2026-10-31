-- limite-temas-dia.sql — Cupo de TEMAS NUEVOS por día (pedido por Enyoria, oct-2026).
-- Regla: un alumno puede ABRIR como máximo N temas NUEVOS por día calendario
-- (por defecto 2). NO se acumula: si hoy abre 1, mañana sigue con tope N (no N+1).
-- Continuar un tema abierto en un día anterior NO consume cupo (puede terminar lo
-- empezado). Un "tema" = grupo de 4 bloques (A/B/C/D) → se deriva de `orden`:
-- grupo = (orden-1)/4. Se mide con `accesos_video.primer_acceso` (cuándo abrió cada
-- bloque por primera vez). Zona horaria configurable (default America/Mexico_City).
-- Idempotente. Ajuste en tabla `ajustes` clave 'temas_limite_dia' = {"n":2,"tz":"America/Mexico_City"}.

insert into public.ajustes (clave, valor)
  values ('temas_limite_dia', jsonb_build_object('n', 2, 'tz', 'America/Mexico_City'))
  on conflict (clave) do nothing;

create or replace function public.puedo_abrir_tema(p_video_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  v_sac uuid; v_orden int; v_idioma text;
  v_lim int; v_tz text; v_today date;
  g_start int; g_first timestamptz; v_hoy int; v_this_today boolean;
begin
  if uid is null then return jsonb_build_object('permitido', true, 'sin_sesion', true); end if;
  select sacramento_id, orden, idioma into v_sac, v_orden, v_idioma
    from videos where id = p_video_id;
  if v_sac is null then return jsonb_build_object('permitido', true); end if; -- sin puente: no gatear

  v_lim := coalesce((select (valor->>'n')::int  from ajustes where clave = 'temas_limite_dia'), 2);
  v_tz  := coalesce((select (valor->>'tz')      from ajustes where clave = 'temas_limite_dia'), 'America/Mexico_City');
  v_today := (now() at time zone v_tz)::date;
  g_start := ((v_orden - 1) / 4) * 4 + 1;  -- primer orden del grupo de 4 (el tema)

  -- Primer acceso del usuario a CUALQUIER bloque de este tema (mismo sacramento e idioma).
  select min(a.primer_acceso) into g_first
    from accesos_video a join videos vv on vv.id = a.video_id
   where a.usuario_id = uid and vv.sacramento_id = v_sac and vv.idioma = v_idioma
     and vv.orden between g_start and g_start + 3;

  -- Tema abierto en un día ANTERIOR → continuación, siempre permitido.
  if g_first is not null and (g_first at time zone v_tz)::date < v_today then
    return jsonb_build_object('permitido', true, 'continuacion', true, 'limite', v_lim);
  end if;

  v_this_today := g_first is not null and (g_first at time zone v_tz)::date = v_today;

  -- Nº de temas DISTINTOS cuyo primer acceso (del grupo) cae HOY.
  select count(*) into v_hoy from (
    select vv.sacramento_id, ((vv.orden - 1) / 4) as grupo
      from accesos_video a join videos vv on vv.id = a.video_id
     where a.usuario_id = uid
     group by vv.sacramento_id, ((vv.orden - 1) / 4)
    having (min(a.primer_acceso) at time zone v_tz)::date = v_today
  ) t;

  if v_this_today then
    -- Ya cuenta entre los de hoy: continuar/rever ese mismo tema, permitido.
    return jsonb_build_object('permitido', true, 'temas_hoy', v_hoy, 'limite', v_lim);
  elsif v_hoy < v_lim then
    -- Tema nuevo y aún hay cupo (no se cuenta a sí mismo: primer_acceso lo pone el modal al abrir).
    return jsonb_build_object('permitido', true, 'temas_hoy', v_hoy, 'limite', v_lim, 'nuevo', true);
  else
    return jsonb_build_object('permitido', false, 'motivo', 'limite_temas_dia',
                              'temas_hoy', v_hoy, 'limite', v_lim);
  end if;
end $$;
grant execute on function public.puedo_abrir_tema(uuid) to authenticated;
