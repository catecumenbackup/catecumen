-- cron-recordatorios.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Programa el envío diario de recordatorios de vencimiento de plazo.
-- Requiere: scripts/recordatorios-plazo.sql ya ejecutado y la edge function
-- `recordar-plazo` desplegada (JWT OFF).
--
-- Antes de correr:
--   1) En Supabase → Database → Extensions, habilita  pg_cron  y  pg_net.
--   2) Sustituye el marcador <CRON_SECRET> por el MISMO valor que pusiste en el
--      secret RECORDATORIOS_SECRET de la función (puedes generar uno largo al
--      azar). Si NO definiste ese secret, borra la línea de la cabecera
--      "x-cron-secret" (no recomendado: deja el endpoint sin protección).
--
-- NO pegues aquí ninguna clave de Supabase: con "Enforce JWT" en OFF la función
-- es pública y solo necesita la cabecera x-cron-secret.
-- Correr en el SQL Editor de Supabase.
-- ─────────────────────────────────────────────────────────────────────────────

-- Quita una programación anterior con el mismo nombre (idempotente).
select cron.unschedule('recordatorios-plazo')
where exists (select 1 from cron.job where jobname = 'recordatorios-plazo');

-- Todos los días a las 15:00 UTC (≈ 9:00 en el centro de México).
select cron.schedule(
  'recordatorios-plazo',
  '0 15 * * *',
  $$
  select net.http_post(
    url     := 'https://jqlfjfamraavsbhdusuq.supabase.co/functions/v1/recordar-plazo',
    headers := jsonb_build_object(
                 'Content-Type',  'application/json',
                 'x-cron-secret', '<CRON_SECRET>'),
    body    := '{}'::jsonb
  );
  $$
);

-- Ver las programaciones activas:
--   select jobid, jobname, schedule, active from cron.job order by jobid;
-- Ver las últimas corridas:
--   select * from cron.job_run_details order by start_time desc limit 10;
