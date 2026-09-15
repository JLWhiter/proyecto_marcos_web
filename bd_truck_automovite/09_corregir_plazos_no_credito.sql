-- 09_corregir_plazos_no_credito.sql
-- Establece plazos=0 para todos los medios de pago que no sean Credito.

UPDATE venta
   SET plazos = 0
 WHERE medio_pago != 'Credito'
   AND plazos > 0;
