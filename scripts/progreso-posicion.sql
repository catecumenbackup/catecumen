-- scripts/progreso-posicion.sql
-- Guarda la POSICIÓN de reproducción (segundos) para que el alumno retome el
-- video donde lo dejó. Se suma a `visto`/`aprobado` en progreso_videos.
-- El cliente (VideoModal → persistProgreso) hace upsert de esta columna sin tocar
-- visto/aprobado. Idempotente.

alter table public.progreso_videos
  add column if not exists posicion_seg integer default 0;

-- El cliente hace upsert de posicion_seg; etapa4_rls.sql concede UPDATE solo por
-- columna, así que hay que añadir posicion_seg a las columnas actualizables (si
-- no, el upsert falla con "permission denied for column posicion_seg").
grant update (posicion_seg) on public.progreso_videos to authenticated;
