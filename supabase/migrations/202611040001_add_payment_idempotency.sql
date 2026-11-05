-- Evita múltiples cobros del mismo tipo para una orden.
-- La creación debe abortar si ya existen duplicados; resolverlos manualmente
-- (y verificar el estado real en Mercado Pago) antes de aplicar esta migración.
create unique index if not exists payments_order_id_type_unique
  on public.payments (order_id, type);
