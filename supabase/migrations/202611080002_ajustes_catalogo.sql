-- Ajustes del catálogo.
-- Esta migración NO se ejecuta automáticamente: aplicarla manualmente tras revisar el SQL.

-- 1. La vista admin_catalog_items es solo para el panel (usuarios autenticados), pero hoy se
--    puede leer con la anon key, sin iniciar sesión. El sitio público usa price_list, así que
--    basta con quitar el acceso a anon. El panel sigue funcionando con su sesión (authenticated).
revoke all on public.admin_catalog_items from anon;
revoke all on public.admin_catalog_items from public;

-- 2. Óleo no se ofrece por ahora: no tiene productos, pero seguía apareciendo como opción al
--    crear productos y cuadros en el panel. Para volver a ofrecerlo: set is_active = true.
update public.techniques set is_active = false where slug = 'oleo';
