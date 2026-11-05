-- Contenido administrable de la landing. Usa la función public.is_admin() ya existente.
-- Esta migración NO se ejecuta automáticamente: aplicarla manualmente tras revisar el SQL.
create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  image_path text not null,
  width integer,
  height integer,
  alt text not null,
  technique_id uuid references public.techniques(id) on delete set null,
  sort_order integer not null default 0,
  is_visible boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.before_after_items (
  id uuid primary key default gen_random_uuid(),
  photo_path text not null,
  artwork_path text not null,
  width integer,
  height integer,
  alt text not null,
  technique_id uuid references public.techniques(id) on delete set null,
  sort_order integer not null default 0,
  is_visible boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  quote text not null,
  author_name text,
  pet_name text,
  image_path text,
  consent_confirmed boolean not null default false,
  sort_order integer not null default 0,
  is_visible boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Reparable si la tabla ya existía sin esta protección; la validación falla si hay
-- filas publicadas sin consentimiento y muestra el problema en lugar de dejarlo pasar.
alter table public.testimonials
  drop constraint if exists testimonials_visible_requires_consent;
alter table public.testimonials
  add constraint testimonials_visible_requires_consent check (not is_visible or consent_confirmed);

create table if not exists public.site_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

alter table public.gallery_items enable row level security;
alter table public.before_after_items enable row level security;
alter table public.testimonials enable row level security;
alter table public.site_settings enable row level security;

-- Mantiene updated_at al modificar contenido o ajustes, igual que price_list.
drop trigger if exists gallery_items_touch on public.gallery_items;
create trigger gallery_items_touch before update on public.gallery_items
  for each row execute function public.touch_updated_at();
drop trigger if exists before_after_items_touch on public.before_after_items;
create trigger before_after_items_touch before update on public.before_after_items
  for each row execute function public.touch_updated_at();
drop trigger if exists testimonials_touch on public.testimonials;
create trigger testimonials_touch before update on public.testimonials
  for each row execute function public.touch_updated_at();
drop trigger if exists site_settings_touch on public.site_settings;
create trigger site_settings_touch before update on public.site_settings
  for each row execute function public.touch_updated_at();

drop policy if exists "Contenido visible legible públicamente" on public.gallery_items;
drop policy if exists "Admins administran galería" on public.gallery_items;
create policy "Contenido visible legible públicamente" on public.gallery_items
  for select to anon, authenticated using (is_visible);
grant select on public.gallery_items to anon, authenticated;
grant insert, update, delete on public.gallery_items to authenticated;
create policy "Admins administran galería" on public.gallery_items
  for all to authenticated using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Pares visibles legibles públicamente" on public.before_after_items;
drop policy if exists "Admins administran pares" on public.before_after_items;
create policy "Pares visibles legibles públicamente" on public.before_after_items
  for select to anon, authenticated using (is_visible);
grant select on public.before_after_items to anon, authenticated;
grant insert, update, delete on public.before_after_items to authenticated;
create policy "Admins administran pares" on public.before_after_items
  for all to authenticated using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Testimonios visibles legibles públicamente" on public.testimonials;
drop policy if exists "Admins administran testimonios" on public.testimonials;
create policy "Testimonios visibles legibles públicamente" on public.testimonials
  for select to anon, authenticated using (is_visible and consent_confirmed);
grant select on public.testimonials to anon, authenticated;
grant insert, update, delete on public.testimonials to authenticated;
create policy "Admins administran testimonios" on public.testimonials
  for all to authenticated using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Ajustes legibles públicamente" on public.site_settings;
drop policy if exists "Admins administran ajustes" on public.site_settings;
create policy "Ajustes legibles públicamente" on public.site_settings
  for select to anon, authenticated using (true);
grant select on public.site_settings to anon, authenticated;
grant insert, update, delete on public.site_settings to authenticated;
create policy "Admins administran ajustes" on public.site_settings
  for all to authenticated using (public.is_admin())
  with check (public.is_admin());

insert into storage.buckets (id, name, public)
values ('landing', 'landing', true)
on conflict (id) do nothing;

-- Si el bucket landing ya existe, verificar manualmente que su configuración "public"
-- sea true en Storage > Buckets antes de habilitar la lectura pública de sus objetos.
-- El proyecto ya tiene un bucket site-images con policy admin global; no se reutiliza
-- para no ampliar su acceso público ni alterar su alcance.
drop policy if exists "Medios landing legibles públicamente" on storage.objects;
drop policy if exists "Admins suben medios landing" on storage.objects;
drop policy if exists "Admins actualizan medios landing" on storage.objects;
drop policy if exists "Admins eliminan medios landing" on storage.objects;
drop policy if exists "admins gestionan imagenes del sitio" on storage.objects;
create policy "Medios landing legibles públicamente" on storage.objects
  for select to anon, authenticated using (bucket_id = 'landing');
create policy "Admins gestionan medios landing" on storage.objects
  for all to authenticated using (
    bucket_id = 'landing' and public.is_admin()
  ) with check (
    bucket_id = 'landing' and public.is_admin()
  );
