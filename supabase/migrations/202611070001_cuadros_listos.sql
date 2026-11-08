-- Cuadros listos ("Directo a tu pared"): obras ya pintadas, únicas (stock 1).
-- El stock es el estado: un cuadro vendido no se borra ni se mueve de tabla, queda
-- con estado 'vendido' como historial. Las ventas web (tabla ventas_cuadros) se
-- agregan en la fase de pagos, junto con la lógica del servidor que las usa.
-- Esta migración NO se ejecuta automáticamente: aplicarla manualmente tras revisar el SQL.
-- Usa public.is_admin() y public.touch_updated_at(), ya existentes.

create table if not exists public.cuadros_listos (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  titulo text not null check (length(trim(titulo)) between 1 and 120),
  descripcion text check (descripcion is null or length(descripcion) <= 2000),
  technique_id uuid references public.techniques(id) on delete set null,
  ancho_cm numeric(6,1) check (ancho_cm is null or ancho_cm > 0),
  alto_cm numeric(6,1) check (alto_cm is null or alto_cm > 0),
  -- Precio del cuadro en CLP. El envío (Starken por pagar) lo paga el cliente aparte.
  precio integer not null check (precio between 1 and 50000000),
  -- Rutas en el bucket "cuadros"; la primera es la portada.
  fotos text[] not null default '{}',
  estado text not null default 'borrador'
    check (estado in ('borrador', 'disponible', 'reservado', 'vendido', 'oculto')),
  reservado_hasta timestamptz,
  vendido_en timestamptz,
  canal_venta text check (canal_venta is null or canal_venta in ('web', 'instagram', 'otro')),
  -- Datos del paquete para cotizar el envío con Starken en el futuro.
  peso_embalado_kg numeric(6,2) check (peso_embalado_kg is null or peso_embalado_kg > 0),
  embalaje_largo_cm numeric(6,1) check (embalaje_largo_cm is null or embalaje_largo_cm > 0),
  embalaje_ancho_cm numeric(6,1) check (embalaje_ancho_cm is null or embalaje_ancho_cm > 0),
  embalaje_alto_cm numeric(6,1) check (embalaje_alto_cm is null or embalaje_alto_cm > 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- No se publica un cuadro sin foto.
  constraint cuadros_listos_publicado_con_foto
    check (estado in ('borrador', 'oculto') or cardinality(fotos) > 0),
  -- Un cuadro vendido siempre sabe cuándo y por dónde; uno no vendido no lo arrastra.
  constraint cuadros_listos_venta_consistente check (
    (estado = 'vendido' and vendido_en is not null and canal_venta is not null)
    or (estado <> 'vendido' and vendido_en is null and canal_venta is null)
  ),
  constraint cuadros_listos_reserva_consistente
    check (estado = 'reservado' or reservado_hasta is null)
);

create index if not exists cuadros_listos_estado_idx
  on public.cuadros_listos (estado, sort_order, created_at desc);

alter table public.cuadros_listos enable row level security;

drop trigger if exists cuadros_listos_touch on public.cuadros_listos;
create trigger cuadros_listos_touch before update on public.cuadros_listos
  for each row execute function public.touch_updated_at();

-- El público ve lo que está a la venta (los reservados se muestran como "en compra").
drop policy if exists "Cuadros a la venta legibles públicamente" on public.cuadros_listos;
drop policy if exists "Admins administran cuadros listos" on public.cuadros_listos;
create policy "Cuadros a la venta legibles públicamente" on public.cuadros_listos
  for select to anon, authenticated using (estado in ('disponible', 'reservado'));
grant select on public.cuadros_listos to anon, authenticated;
grant insert, update, delete on public.cuadros_listos to authenticated;
create policy "Admins administran cuadros listos" on public.cuadros_listos
  for all to authenticated using (public.is_admin())
  with check (public.is_admin());

-- Bucket propio para no ampliar el alcance de "landing" ni "catalog".
insert into storage.buckets (id, name, public)
values ('cuadros', 'cuadros', true)
on conflict (id) do nothing;

drop policy if exists "Fotos de cuadros legibles públicamente" on storage.objects;
drop policy if exists "Admins gestionan fotos de cuadros" on storage.objects;
create policy "Fotos de cuadros legibles públicamente" on storage.objects
  for select to anon, authenticated using (bucket_id = 'cuadros');
create policy "Admins gestionan fotos de cuadros" on storage.objects
  for all to authenticated using (
    bucket_id = 'cuadros' and public.is_admin()
  ) with check (
    bucket_id = 'cuadros' and public.is_admin()
  );
