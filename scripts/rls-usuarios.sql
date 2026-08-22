-- scripts/rls-usuarios.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Limpieza de políticas RLS de public.usuarios (deuda de seguridad).
--
-- PROBLEMA: existían políticas con rol `public` (usr_select/usr_insert/usr_update)
-- que dejaban a CUALQUIERA (incluido anon) leer y escribir TODAS las filas.
--
-- SOLUCIÓN: acceso solo a la PROPIA fila para usuarios autenticados. Las
-- escrituras del servidor (edge functions con service-role) IGNORAN RLS, así que
-- no necesitan política.
--
-- REQUISITO CONSERVADO: el registro gratuito/beca inserta su propia fila desde el
-- cliente (PaymentModal.crearCuentaUsuario) justo después de signUp → hace falta
-- una política de INSERT con id = auth.uid(). Los cambios de perfil del Dashboard
-- NO tocan la BD (solo estado local en React), por lo que NO se necesita política
-- de UPDATE ni DELETE para el cliente.
--
-- Idempotente y re-ejecutable. Correr en Supabase → SQL Editor.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.usuarios enable row level security;

-- 1) Quitar las políticas abiertas al público (inseguras).
drop policy if exists usr_select on public.usuarios;
drop policy if exists usr_insert on public.usuarios;
drop policy if exists usr_update on public.usuarios;

-- 2) SELECT: solo la propia fila (el login carga el perfil del usuario).
drop policy if exists usuarios_sel_own on public.usuarios;
create policy usuarios_sel_own on public.usuarios
  for select to authenticated
  using (id = auth.uid());

-- 3) INSERT: solo la propia fila (ruta de registro gratuito/beca desde el cliente).
drop policy if exists usuarios_ins_own on public.usuarios;
create policy usuarios_ins_own on public.usuarios
  for insert to authenticated
  with check (id = auth.uid());

-- NOTA: no se crea política de UPDATE/DELETE para el cliente a propósito.
-- Toda actualización (activar pago, conversión de preinscrito, suspensión,
-- borrado suave/total) la hacen las edge functions con service-role, que no
-- están sujetas a RLS. Si en el futuro el Dashboard llega a guardar el perfil
-- directamente, añadir aquí una política de UPDATE con
--   using (id = auth.uid()) with check (id = auth.uid()).

-- Verificación (opcional, seguro en el editor): lista las políticas resultantes.
-- select policyname, cmd, roles from pg_policies where tablename = 'usuarios';
