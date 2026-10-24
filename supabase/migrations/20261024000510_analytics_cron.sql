-- Limpieza diaria de analítica antigua (3:30 a. m. hora de Colombia = 08:30 UTC).
create extension if not exists pg_cron;
select cron.schedule(
  'purge-old-analytics',
  '30 8 * * *',
  $$select public.purge_old_analytics()$$
);
