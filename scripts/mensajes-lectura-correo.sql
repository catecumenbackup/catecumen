-- Confirmacion de lectura en mensajeria interna + ajuste del correo remitente.
-- Correr en el SQL Editor de Supabase. Idempotente.

-- Ver una conversacion con los flags de lectura (leido_usuario / leido_admin).
create or replace function public.admin_ver_conversacion_v2(p_conv uuid)
returns table (id text, remitente text, cuerpo text, creado timestamptz,
               leido_usuario boolean, leido_admin boolean)
language plpgsql security definer set search_path = public as $$
begin
  if not es_admin() then raise exception 'no autorizado'; end if;
  return query
    select m.id::text, m.remitente, m.cuerpo, m.creado, m.leido_usuario, m.leido_admin
      from mensajes m
     where m.conversacion_id = p_conv
     order by m.creado asc;
end $$;

-- Correo remitente de la plataforma (editable desde el panel admin).
insert into public.ajustes (clave, valor)
  values ('correo_remitente', '{"from":"Catecumen <noreply@catecumen.com>"}'::jsonb)
on conflict (clave) do nothing;
