# PintaPatitas

Plataforma para pedir retratos personalizados de mascotas (Chile). Monorepo sin workspaces:
`client/` (React 19 + Vite 8 + Tailwind 4 + shadcn/base-ui) y `server/` (Express 5, Node, ESM).
Datos, Storage y Auth en Supabase (PostgreSQL). Pagos con Mercado Pago. Correos con Nodemailer (Gmail SMTP).
Deploy en Hostinger: front en pintapatitas.com, API en api.pintapatitas.com.

## Comandos (ejecutar dentro de cada carpeta)
- client: `npm run dev` (puerto 5173, proxy `/api` → localhost:3001), `npm run build`, `npm run lint` (oxlint)
- server: `npm run dev` (node --watch, puerto 3001), `npm start`
- No hay tests ni typecheck: verifica con `npm run lint` + `npm run build` en client y probando el endpoint.

## Convenciones
- JavaScript/JSX, NO TypeScript. Imports con alias `@/` → `client/src`.
- Componentes UI en `client/src/components/ui` (shadcn, estilo base-nova, iconos lucide).
- Llamadas a la API siempre con `apiUrl()` de `client/src/lib/api.js`.
- Textos de UI, mensajes de error y commits en español. Commits estilo Conventional Commits (`feat:`, `fix(scope):`).
- Rutas del front en `client/src/routes.jsx`; rutas de API en `server/src/routes/*` montadas en `server/src/index.js`.

## Reglas importantes
- Los precios y comisiones se calculan en el servidor (`server/src/pricing.js`, env `ABONO_PORCENTAJE`, `COMISION_PORCENTAJE`). Nunca confiar en montos del cliente.
- Endpoints de admin protegidos con `requireAdmin` (token de Supabase + tabla `admins`).
- `SUPABASE_SERVICE_ROLE_KEY` solo en server. En client solo la anon key (`VITE_*`).
- Mercado Pago: producción usa `init_point` (cobros reales). Cuidado al tocar `server/src/lib/mercadopago.js`, `routes/webhooks.js` y el OAuth de marketplace (tokens cifrados con `MP_TOKEN_ENCRYPTION_KEY`).
- No leer ni editar archivos `.env`; usar `.env.example` como referencia y actualizarlo si agregas variables.
- `client/public/.htaccess` es necesario para que React Router funcione en Hostinger; no borrarlo.
- `server/index.js` solo reexporta `src/index.js` (entrada para el hosting).
