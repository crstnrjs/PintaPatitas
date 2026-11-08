-- Datos de envío Starken en los pedidos de retratos personalizados:
-- RUT del destinatario y retiro en sucursal como alternativa al domicilio.
-- Esta migración NO se ejecuta automáticamente: aplicarla manualmente tras revisar el SQL.
-- Los pedidos anteriores quedan como "domicilio" y sin RUT (no se exige para ellos).

alter table public.orders add column if not exists customer_rut text;
alter table public.orders add column if not exists delivery_type text not null default 'domicilio';
alter table public.orders add column if not exists starken_branch text;

alter table public.orders drop constraint if exists orders_delivery_type_check;
alter table public.orders add constraint orders_delivery_type_check
  check (delivery_type in ('domicilio', 'sucursal'));

-- Retiro en sucursal: no hay calle ni número, pero sí el nombre de la sucursal.
alter table public.orders alter column street drop not null;
alter table public.orders alter column street_number drop not null;

alter table public.orders drop constraint if exists orders_destino_starken_check;
alter table public.orders add constraint orders_destino_starken_check check (
  (delivery_type = 'sucursal' and starken_branch is not null)
  or (delivery_type = 'domicilio' and street is not null and street_number is not null)
) not valid; -- not valid: no revisa pedidos antiguos, sí todos los nuevos
