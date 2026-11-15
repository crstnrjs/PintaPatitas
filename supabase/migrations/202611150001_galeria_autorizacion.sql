-- Autorización para publicar obras en la landing (galería y pares "foto → obra").
-- Esta migración NO se ejecuta automáticamente: aplicarla manualmente en Supabase
-- ANTES de fusionar el PR que la acompaña (Hostinger despliega al fusionar en main).
--
-- Los Términos (§6 y §7) y la Política de privacidad prometen que las obras encargadas y
-- las fotos de los clientes solo se publican con una autorización expresa y separada.
-- Los testimonios ya lo exigían; aquí se aplica lo mismo a la galería y a los pares:
--   - consent_confirmed: la artista confirma que la obra es propia o que el cliente autorizó
--     publicarla (en los pares, también su foto).
--   - Lectura pública solo de lo visible Y autorizado (las filas sin autorización no salen
--     en la landing aunque estén marcadas como visibles).
--   - Restricción: no se puede marcar como visible algo sin autorización.
--     Va como NOT VALID para no fallar si ya hay filas visibles sin autorización: esas filas
--     dejan de verse en la landing (por la política de lectura) hasta que la artista confirme
--     la autorización desde el panel (Contenido). Las filas nuevas o editadas sí se validan.

alter table public.gallery_items
  add column if not exists consent_confirmed boolean not null default false;
alter table public.before_after_items
  add column if not exists consent_confirmed boolean not null default false;

alter table public.gallery_items drop constraint if exists gallery_visible_requires_consent;
alter table public.gallery_items
  add constraint gallery_visible_requires_consent check (not is_visible or consent_confirmed) not valid;

alter table public.before_after_items drop constraint if exists before_after_visible_requires_consent;
alter table public.before_after_items
  add constraint before_after_visible_requires_consent check (not is_visible or consent_confirmed) not valid;

drop policy if exists "Contenido visible legible públicamente" on public.gallery_items;
create policy "Contenido visible legible públicamente" on public.gallery_items
  for select to anon, authenticated using (is_visible and consent_confirmed);

drop policy if exists "Pares visibles legibles públicamente" on public.before_after_items;
create policy "Pares visibles legibles públicamente" on public.before_after_items
  for select to anon, authenticated using (is_visible and consent_confirmed);

-- Para revisar después de aplicarla: obras marcadas como visibles que esperan autorización.
-- select 'galería' as tabla, id, alt from public.gallery_items where is_visible and not consent_confirmed
-- union all
-- select 'foto → obra', id, alt from public.before_after_items where is_visible and not consent_confirmed;
