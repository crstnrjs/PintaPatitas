-- Nombre opcional para los productos del catálogo (formulario de admin → Catálogo).
-- Si queda vacío, el panel muestra "Retrato de N mascotas" como hasta ahora.
-- Aplicar en el SQL Editor de Supabase ANTES de publicar el front de este cambio.

alter table public.price_list
  add column if not exists name text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'price_list_name_largo'
      and conrelid = 'public.price_list'::regclass
  ) then
    alter table public.price_list
      add constraint price_list_name_largo
      check (name is null or char_length(name) between 1 and 80);
  end if;
end $$;

-- No hace falta tocar la vista admin_catalog_items: el panel lee el nombre directo de price_list.
-- Las políticas RLS existentes de price_list (escritura solo para admins) cubren la columna nueva.
