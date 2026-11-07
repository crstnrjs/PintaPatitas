import { supabaseAdmin as supabase } from "../lib/supabase.js";

let db = supabase;
export function configurarDbPagos(database) {
  db = database;
}

export function restablecerDbPagos() {
  db = supabase;
}

/**
 * Reserva el único registro de pago esperado para una orden y tipo.
 * Requiere UNIQUE(order_id, type) en payments. Devuelve null si otro proceso
 * ya reservó el cobro, evitando crear otra preferencia ante peticiones paralelas.
 */
export async function reservarPago({ orderId, type, amount, commissionRate = null, commissionAmount = null }) {
  const row = {
    order_id: orderId,
    type,
    status: "creando",
    amount,
    ...(commissionRate === null ? {} : { commission_rate: commissionRate }),
    ...(commissionAmount === null ? {} : { commission_amount: commissionAmount }),
  };
  const { data, error } = await db.from("payments").insert(row).select("id").maybeSingle();
  if (error?.code === "23505") return null;
  if (error) throw error;
  return data?.id ?? null;
}

/**
 * Deja la reserva lista para cobrar. No guarda mp_payment_id: ese campo es el
 * ID del pago real de Mercado Pago y solo lo escribe el webhook al aprobarse.
 * Guardar aquí el ID de la preferencia hacía que el webhook rechazara (409)
 * todos los pagos reales, porque nunca coincide con el ID del pago.
 */
export async function completarReservaPago(id, { paymentUrl }) {
  const { data, error } = await db.from("payments").update({
    status: "pendiente",
    payment_url: paymentUrl,
  }).eq("id", id).eq("status", "creando").select("id").maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("La reserva de pago ya no está disponible.");
}

export async function eliminarReservaPago(id) {
  const { error } = await db.from("payments").delete().eq("id", id).eq("status", "creando");
  if (error) throw error;
}
