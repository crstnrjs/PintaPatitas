-- Motivo de rechazo de una solicitud.
-- Esta migración NO se ejecuta automáticamente: aplicarla manualmente tras revisar el SQL.
--
-- La artista escribe el motivo al rechazar (POST /api/orders/:id/reject) y se envía al cliente
-- por correo. Como puede contener datos personales, la anonimización de pedidos (política de
-- conservación a 6 meses) también lo borra: se reemplaza anonimizar_pedidos() con la misma
-- lógica de 202611090001_conservacion_datos.sql más "rejection_reason = null".

alter table public.orders add column if not exists rejection_reason text;

create or replace function public.anonimizar_pedidos(p_ids uuid[], p_meses integer default 6)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  ids uuid[];
begin
  select coalesce(array_agg(o.id), '{}') into ids
  from public.orders o
  where o.id = any(p_ids)
    and o.datos_eliminados_en is null
    and o.status in ('finalizado', 'rechazado', 'solicitud', 'pendiente_abono')
    and o.created_at < now() - make_interval(months => greatest(p_meses, 6));

  if cardinality(ids) = 0 then
    return 0;
  end if;

  delete from public.order_photos where order_id = any(ids);

  update public.orders set
    customer_name   = 'Datos eliminados',
    customer_email  = 'eliminado@pintapatitas.invalid',
    customer_phone  = 'eliminado',
    customer_rut    = null,
    description     = null,
    pet_name        = null,
    rejection_reason = null,
    region          = 'Datos eliminados',
    commune         = 'Datos eliminados',
    -- La restricción de destino exige calle (domicilio) o sucursal (retiro): se reemplazan.
    street          = case when street is null then null else 'Datos eliminados' end,
    street_number   = case when street_number is null then null else '—' end,
    apartment       = null,
    starken_branch  = case when starken_branch is null then null else 'Datos eliminados' end,
    datos_eliminados_en = now()
  where id = any(ids);

  return cardinality(ids);
end;
$$;

-- Al reemplazar la función se conservan los permisos, pero se reafirman por seguridad.
revoke all on function public.anonimizar_pedidos(uuid[], integer) from public, anon, authenticated;
grant execute on function public.anonimizar_pedidos(uuid[], integer) to service_role;
