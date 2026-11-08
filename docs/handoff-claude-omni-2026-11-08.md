# Traspaso para claude-omni — 2026-11-08

Resumen de lo que hizo otra sesión de Claude Code entre el 2026-11-07 y el 2026-11-08. **Todo está fusionado en `main`** (PRs #14 a #18). Lee esto antes de tocar `server/`, porque esa sesión también creó y modificó archivos del servidor.

Las memorias completas están en `C:\Users\chris\.claude\projects\C--Users-chris-Documents-PintaPatitas\memory\` (empieza por `MEMORY.md` y `produccion-pendientes.md`).

## 1. Qué se construyó

### Cuadros listos, "Directo a tu pared" (PR #14)
Venta de cuadros ya pintados, únicos (stock 1), con pago total por Mercado Pago.
- **BD:** `cuadros_listos` (el estado es el stock: borrador / disponible / reservado / vendido / oculto; bucket `cuadros`) y `ventas_cuadros` (comprador, RUT, destino Starken, monto, comisión, estado del pago y del envío). Índice único: un cuadro no puede tener dos ventas pagadas. `ventas_cuadros` no tiene acceso anon, y el admin solo puede editar los campos del envío.
- **`POST /api/cuadros/:slug/comprar`** (`server/src/lib/ventasCuadros.js`, `routes/cuadros.js`):
  - reserva el cuadro **20 minutos** con un UPDATE condicional;
  - toma el precio desde la BD;
  - crea la preferencia con `crearPreferenciaVendedor()` (OAuth de la artista) y `marketplace_fee` = `COMISION_PORCENTAJE` (7 %);
  - el link vence con la reserva y excluye ticket, atm y bank_transfer.
  - Si la cuenta vendedora no está lista, responde 503 sin reservar.
- **Webhook** (`routes/webhooks.js`): `metadata.payment_type === "cuadro"` se deriva a `procesarPagoCuadro` antes del flujo de abono y saldo, que **no cambió**. Es idempotente. Si el cuadro ya estaba vendido (por otra venta o por Instagram), la venta queda `requiere_devolucion` y se avisa a la artista.
- **Correos:** `lib/correosCuadros.js` (confirmación al comprador y aviso a la artista).
- **Tests:** `lib/ventasCuadros.test.js`, `routes/webhooksCuadros.test.js`.

### Pedido de retrato: envío Starken, RUT y fotos (PR #16)
- `routes/pedidos.js` valida y guarda `customer_rut`, `delivery_type` (domicilio/sucursal), `starken_branch` y la aceptación del envío por pagar. Tests en `routes/pedidos.test.js`.
- RUT compartido en `server/src/lib/rut.js` (también en `client/src/lib/rut.js`).
- `GET /api/configuracion/cobros` (solo admin, `routes/configuracion.js`) devuelve `COMISION_PORCENTAJE` y `ABONO_PORCENTAJE`, para que el panel no los tenga escritos a mano (antes decía 6,2 %).
- `mailer.js`: el correo de solicitud nueva muestra el RUT y la sucursal.

### Visibilidad, Sobre nosotros, Contacto y Soporte (PRs #17 y #18)
- `robots.txt` con Content-Signal, sitemap generado en el build con lastmod (`client/plugins/sitemap.js`), **404 real vía `client/public/.htaccess`** (hay una lista de rutas: si agregas una página en `routes.jsx`, súmala ahí), HTML inicial con h1 y JSON-LD en `client/index.html`.
- `POST /api/soporte` (`lib/soporte.js`, `routes/soporte.js`) envía a `soporte@pintapatitas.com` (env opcional `SOPORTE_EMAIL`) con replyTo del cliente y le manda una copia al cliente. Tiene campo trampa contra bots y límite de 5 por hora. Tests en `lib/soporte.test.js`.
- `mailer.js` → `enviarCorreo({ to, subject, html, text, replyTo })` (genérico, con BCC de respaldo).
- Datos de contacto en `client/src/lib/contacto.js`.

## 2. Archivos de `server/` que tocó esa sesión
Nuevos:
- `lib/ventasCuadros.js`, `lib/correosCuadros.js`, `lib/rut.js`, `lib/soporte.js`
- `routes/cuadros.js`, `routes/soporte.js`, `routes/configuracion.js`
- tests: `lib/ventasCuadros.test.js`, `lib/soporte.test.js`, `routes/webhooksCuadros.test.js`, `routes/pedidos.test.js`, `routes/configuracion.test.js`

Modificados:
- `index.js`: monta `/api/cuadros`, `/api/soporte` y `/api/configuracion`.
- `routes/webhooks.js`: rama "cuadro".
- `routes/pedidos.js`: RUT y sucursal.
- `lib/mailer.js`: `enviarCorreo` con replyTo; RUT y sucursal en el correo de solicitud.

`npm test` en server: **81 tests en verde** al 2026-11-08.

## 3. Estado de producción (verificado el 2026-11-08)
| Migración | Estado |
|---|---|
| 202611070001_cuadros_listos.sql | aplicada |
| 202611070002_ventas_cuadros.sql | aplicada |
| 202611080001_pedidos_envio_starken.sql | aplicada |
| **202611080002_ajustes_catalogo.sql** | **NO aplicada**: quita el acceso anon a `admin_catalog_items` y desactiva Óleo |

Pendiente fuera del código:
1. Aplicar `202611080002_ajustes_catalogo.sql`.
2. Publicar front y servidor de `main` en Hostinger.
3. Crear la casilla soporte@pintapatitas.com y probar `/soporte`.
4. Comprobar el 404 y las páginas nuevas en producción; volver a correr el análisis de visibilidad.
5. **La artista debe vincular su cuenta de Mercado Pago** (Admin → Mercado Pago, `MP_OAUTH_TEST_TOKEN=false`). Sin eso no se cobran abonos, saldos ni cuadros.
6. Agregar `SOPORTE_EMAIL=` a `server/.env.example`.
7. Compra de prueba de un cuadro con cuentas de prueba de Mercado Pago.

## 4. Decisiones que no hay que revertir
- Todas las ventas de cuadros pasan por la web, sin respaldo a Instagram (lo pidió el usuario para tener el historial).
- Envío Starken **por pagar**: la comisión es solo sobre el precio del cuadro o retrato.
- Cotización de la tarifa Starken: no implementada. No hay API pública oficial; hay que pedir acceso a Starken o usar un tercero.
- En textos públicos: la artista es "Fernanda"; las técnicas ofrecidas son acrílico, lápiz y digital (sin óleo). No decir "todo pintado a mano", porque existe la técnica digital.
