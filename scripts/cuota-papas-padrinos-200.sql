-- cuota-papas-padrinos-200.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Baja la cuota de papás (prebautismal) y padrinos a la MITAD: México queda en
-- $200 MXN (antes 400) y los demás países bajan proporcionalmente (factor 0.5),
-- con el redondeo "amigable" del sistema (redondearCuota). Solo toca las columnas
-- prebautismal y padrino; NO cambia catecúmeno ni catequista.
--
-- Nota: el frontend solo usa la tabla para países activo=true (hoy solo México);
-- los demás usan el cálculo local de pricing.js (RATIO_PRE/PAD, que se bajó a 0.30
-- en el mismo cambio). Esta actualización deja la tabla coherente para cuando se
-- activen otros países. Idempotente NO: re-ejecutarla volvería a halvear. Correr una vez.
-- ─────────────────────────────────────────────────────────────────────────────

update public.cuotasporpais
set prebautismal = case
      when prebautismal*0.5 >= 10000 then round(prebautismal*0.5/100)*100
      when prebautismal*0.5 >= 1000  then round(prebautismal*0.5/10)*10
      when prebautismal*0.5 >= 100   then round(prebautismal*0.5/5)*5
      else round(prebautismal*0.5) end,
    padrino = case
      when padrino*0.5 >= 10000 then round(padrino*0.5/100)*100
      when padrino*0.5 >= 1000  then round(padrino*0.5/10)*10
      when padrino*0.5 >= 100   then round(padrino*0.5/5)*5
      else round(padrino*0.5) end
where prebautismal is not null or padrino is not null;

select pais, moneda, prebautismal as papas_padrinos
from public.cuotasporpais order by pais;
