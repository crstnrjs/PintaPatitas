-- El servidor reserva cada cobro insertando en payments con status = 'creando'
-- antes de pedir el link a Mercado Pago (server/src/routes/paymentIdempotency.js).
-- El enum payment_status se creó a mano sin ese valor, así que aceptar una
-- solicitud o cobrar un saldo fallaba con 500 ("No se pudo reservar el pago").
alter type public.payment_status add value if not exists 'creando';
