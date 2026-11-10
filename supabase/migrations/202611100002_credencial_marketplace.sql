-- Credencial OAuth de la cuenta vendedora (artista) de Mercado Pago.
-- Antes vivía en un archivo del servidor (server/.private/mercadopago-marketplace.enc),
-- que un despliegue podía borrar. Ahora se guarda aquí, cifrada en el servidor con
-- AES-256-GCM (MP_TOKEN_ENCRYPTION_KEY): la base nunca ve los tokens en claro.
-- Solo la service role (el servidor) puede leerla o escribirla.

create table if not exists public.marketplace_credentials (
  id text primary key check (id = 'vendedor'),
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.marketplace_credentials enable row level security;
-- Sin políticas: anon y authenticated no pueden acceder; la service role ignora RLS.
revoke all on public.marketplace_credentials from anon, authenticated;
