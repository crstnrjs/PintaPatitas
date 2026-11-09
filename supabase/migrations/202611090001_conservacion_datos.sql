-- Conservación de datos personales (Términos y condiciones, sección 5).
-- Esta migración NO se ejecuta automáticamente: aplicarla manualmente tras revisar el SQL.
--
-- Pasados 6 meses desde la solicitud, en los pedidos cerrados (finalizado, rechazado) o
-- abandonados (solicitud, pendiente_abono) se eliminan los datos de contacto, envío y
-- las fotos. Se conservan número, fechas, producto y montos como respaldo contable.
-- Los pedidos "en_proceso" nunca se tocan.
-- En ventas de cuadros listos: las pagadas se anonimizan; los intentos de compra sin pago
-- se eliminan. Las que requieren devolución se conservan hasta resolverse.
--
-- Las fotos viven en Storage (bucket pet-photos) y Supabase no permite borrarlas con SQL,
-- así que el servidor (server/src/lib/conservacion.js) corre esto una vez al día:
--   1. pedidos_para_anonimizar() → ids y rutas de fotos
--   2. borra las fotos con la API de Storage
--   3. anonimizar_pedidos(ids) y anonimizar_ventas_cuadros()

alter table public.orders add column if not exists datos_eliminados_en timestamptz;
alter table public.ventas_cuadros add column if not exists datos_eliminados_en timestamptz;

create index if not exists orders_conservacion_idx
  on public.orders (created_at) where datos_eliminados_en is null;

-- 1. Pedidos vencidos y sus fotos. No modifica nada.
create or replace function public.pedidos_para_anonimizar(p_meses integer default 6, p_limite integer default 100)
returns table (order_id uuid, fotos text[])
language sql
stable
security definer
set search_path = public
as $$
  select o.id,
         coalesce(array_agg(p.storage_path) filter (where p.storage_path is not null), '{}')
  from public.orders o
  left join public.order_photos p on p.order_id = o.id
  where o.datos_eliminados_en is null
    and o.status in ('finalizado', 'rechazado', 'solicitud', 'pendiente_abono')
    and o.created_at < now() - make_interval(months => greatest(p_meses, 6))
  group by o.id, o.created_at
  order by o.created_at
  limit least(greatest(p_limite, 1), 500);
$$;

-- 3a. Anonimiza los pedidos indicados (vuelve a revisar el plazo y el estado).
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

-- 3b. Ventas de cuadros listos.
create or replace function public.anonimizar_ventas_cuadros(p_meses integer default 6)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  limite timestamptz := now() - make_interval(months => greatest(p_meses, 6));
  borradas integer;
  anonimizadas integer;
begin
  -- Intentos de compra que nunca se pagaron: no hay nada que respaldar.
  delete from public.ventas_cuadros
  where estado in ('creando', 'pendiente', 'error')
    and created_at < limite;
  get diagnostics borradas = row_count;

  update public.ventas_cuadros set
    comprador_nombre   = 'Datos eliminados',
    comprador_rut      = 'eliminado',
    comprador_email    = 'eliminado@pintapatitas.invalid',
    comprador_telefono = 'eliminado',
    region             = 'Datos eliminados',
    comuna             = 'Datos eliminados',
    direccion          = 'Datos eliminados',
    datos_eliminados_en = now()
  where estado = 'aprobado'
    and datos_eliminados_en is null
    and coalesce(enviado_en, pagado_en, created_at) < limite;
  get diagnostics anonimizadas = row_count;

  return borradas + anonimizadas;
end;
$$;

-- Solo el servidor (service role) puede ejecutarlas.
revoke all on function public.pedidos_para_anonimizar(integer, integer) from public, anon, authenticated;
revoke all on function public.anonimizar_pedidos(uuid[], integer) from public, anon, authenticated;
revoke all on function public.anonimizar_ventas_cuadros(integer) from public, anon, authenticated;
grant execute on function public.pedidos_para_anonimizar(integer, integer) to service_role;
grant execute on function public.anonimizar_pedidos(uuid[], integer) to service_role;
grant execute on function public.anonimizar_ventas_cuadros(integer) to service_role;
