-- Ventas web de cuadros listos (pago total con Mercado Pago, split con comisión).
-- Requiere 202611070001_cuadros_listos.sql aplicada antes.
-- Esta migración NO se ejecuta automáticamente: aplicarla manualmente tras revisar el SQL.
-- Solo el servidor (service role) crea y aprueba ventas; el panel admin lee y gestiona el envío.

create table if not exists public.ventas_cuadros (
  id uuid primary key default gen_random_uuid(),
  numero integer generated always as identity unique,
  -- Cascade para que los intentos de compra abandonados no impidan borrar un cuadro;
  -- el trigger de más abajo impide borrar uno con ventas pagadas.
  cuadro_id uuid not null references public.cuadros_listos(id) on delete cascade,
  -- Copia del cuadro al momento de la compra (el admin puede editarlo después).
  cuadro_titulo text not null,
  comprador_nombre text not null,
  comprador_rut text not null,
  comprador_email text not null,
  comprador_telefono text not null,
  entrega_tipo text not null check (entrega_tipo in ('domicilio', 'sucursal')),
  region text not null,
  comuna text not null,
  -- Calle, número y depto (domicilio) o nombre de la sucursal Starken (sucursal).
  direccion text not null,
  monto integer not null check (monto > 0),
  comision_porcentaje numeric(5,2) not null check (comision_porcentaje between 0 and 100),
  comision_monto integer not null check (comision_monto >= 0 and comision_monto <= monto),
  -- creando: reservando el cobro · pendiente: link de pago entregado · aprobado: pagado
  -- error: no se pudo crear el cobro · requiere_devolucion: se pagó un cuadro que ya estaba vendido
  estado text not null default 'creando'
    check (estado in ('creando', 'pendiente', 'aprobado', 'error', 'requiere_devolucion')),
  reservado_hasta timestamptz not null,
  payment_url text,
  mp_payment_id text unique,
  pagado_en timestamptz,
  estado_envio text not null default 'por_enviar'
    check (estado_envio in ('por_enviar', 'enviado', 'entregado')),
  seguimiento_starken text check (seguimiento_starken is null or length(seguimiento_starken) <= 60),
  enviado_en timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Un cuadro nunca puede tener dos ventas pagadas.
create unique index if not exists ventas_cuadros_una_aprobada_por_cuadro
  on public.ventas_cuadros (cuadro_id) where estado = 'aprobado';

create index if not exists ventas_cuadros_cuadro_idx on public.ventas_cuadros (cuadro_id, estado);
create index if not exists ventas_cuadros_creado_idx on public.ventas_cuadros (created_at desc);

create or replace function public.impedir_borrar_cuadro_pagado()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from public.ventas_cuadros
    where cuadro_id = old.id and estado in ('aprobado', 'requiere_devolucion')
  ) then
    raise exception 'No se puede eliminar un cuadro que tiene una venta pagada.';
  end if;
  return old;
end;
$$;

drop trigger if exists cuadros_listos_no_borrar_pagado on public.cuadros_listos;
create trigger cuadros_listos_no_borrar_pagado before delete on public.cuadros_listos
  for each row execute function public.impedir_borrar_cuadro_pagado();

alter table public.ventas_cuadros enable row level security;

drop trigger if exists ventas_cuadros_touch on public.ventas_cuadros;
create trigger ventas_cuadros_touch before update on public.ventas_cuadros
  for each row execute function public.touch_updated_at();

-- Sin acceso público: tiene datos personales del comprador.
drop policy if exists "Admins leen ventas de cuadros" on public.ventas_cuadros;
drop policy if exists "Admins gestionan envío de ventas de cuadros" on public.ventas_cuadros;
revoke all on public.ventas_cuadros from anon;
grant select, update on public.ventas_cuadros to authenticated;
create policy "Admins leen ventas de cuadros" on public.ventas_cuadros
  for select to authenticated using (public.is_admin());
create policy "Admins gestionan envío de ventas de cuadros" on public.ventas_cuadros
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- El panel solo puede cambiar los datos del envío; montos, estado del pago y comprador
-- quedan fuera de su alcance aunque la policy permita update.
revoke update on public.ventas_cuadros from authenticated;
grant update (estado_envio, seguimiento_starken, enviado_en) on public.ventas_cuadros to authenticated;
