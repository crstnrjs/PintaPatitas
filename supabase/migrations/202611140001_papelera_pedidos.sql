-- Papelera de solicitudes en el panel de administración.
-- Esta migración NO se ejecuta automáticamente: aplicarla manualmente tras revisar el SQL.
--
-- La artista puede mover a la papelera los pedidos cerrados (finalizado, rechazado) para
-- limpiar las secciones del panel, y restaurarlos cuando quiera. No se borra nada:
--   - deleted_at marca el pedido como "en papelera"; el estado (status) no cambia, así que al
--     restaurarlo (deleted_at = null) vuelve solo a su sección original.
--   - Los pagos (payments), las fotos (order_photos y bucket pet-photos) se conservan.
--   - La conservación de datos (anonimizar_pedidos a los 6 meses) sigue aplicándose igual.
-- Los listados, contadores y métricas del admin excluyen los pedidos con deleted_at.
-- Mover y restaurar se hace desde el servidor: POST /api/orders/:id/trash y /:id/restore.

alter table public.orders add column if not exists deleted_at timestamptz;

-- Solo los pedidos cerrados pueden estar en la papelera: protege los pedidos activos.
alter table public.orders drop constraint if exists orders_papelera_estado_chk;
alter table public.orders add constraint orders_papelera_estado_chk
  check (deleted_at is null or status in ('finalizado', 'rechazado'));

create index if not exists orders_papelera_idx
  on public.orders (deleted_at desc) where deleted_at is not null;
