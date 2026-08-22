-- scripts/actualizar-perfil.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- RPC para que el usuario guarde los cambios de su propia ficha desde "Mi Cuenta".
--
-- Antes, el botón "Guardar cambios" del Dashboard solo actualizaba el estado en
-- memoria (no persistía nada en la BD). Esta RPC persiste los campos editables
-- de la PROPIA fila del usuario.
--
-- Seguridad: SECURITY DEFINER + acotada a auth.uid() y a una lista blanca de
-- columnas (email de perfil, teléfono, código telefónico, parroquia). NO puede
-- tocar otras filas ni columnas sensibles (tipo_usuario, estado_inscripcion,
-- pago, beca, etc.). Compatible con la limpieza de RLS (rls-usuarios.sql): no
-- necesita política de UPDATE para el cliente porque corre como definer.
--
-- La contraseña y el correo de LOGIN (auth) se cambian aparte, desde el cliente
-- con supabase.auth.updateUser(); esta RPC solo toca la tabla `usuarios`.
--
-- Idempotente y re-ejecutable. Correr en Supabase → SQL Editor.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.actualizar_mi_perfil(p_cambios jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'no autorizado';
  end if;

  -- Solo se actualiza una columna si su clave viene en p_cambios; si no viene,
  -- (p_cambios ? 'clave') es false y se conserva el valor actual.
  update public.usuarios set
    email            = case when p_cambios ? 'email'            then nullif(p_cambios->>'email','')            else email            end,
    telefono         = case when p_cambios ? 'telefono'         then nullif(p_cambios->>'telefono','')         else telefono         end,
    codigo_pais_tel  = case when p_cambios ? 'codigo_pais_tel'  then nullif(p_cambios->>'codigo_pais_tel','')  else codigo_pais_tel  end,
    parroquia_nombre = case when p_cambios ? 'parroquia_nombre' then nullif(p_cambios->>'parroquia_nombre','') else parroquia_nombre end
  where id = uid;
end;
$$;

grant execute on function public.actualizar_mi_perfil(jsonb) to authenticated;
