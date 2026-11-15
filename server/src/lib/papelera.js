// Papelera de solicitudes: mover y restaurar pedidos cerrados (migración 202611140001).
// Nunca borra datos: solo marca o desmarca orders.deleted_at. El estado no cambia, así que al
// restaurar el pedido vuelve a su sección original (Finalizados o Rechazados).

export const ESTADOS_PAPELERA = ["finalizado", "rechazado"];

async function leerPedido(db, id) {
  return db.from("orders").select("id, status, deleted_at").eq("id", id).maybeSingle();
}

// Devuelve { status, body } para responder directamente desde la ruta.
export async function moverAPapelera(db, id, ahora = new Date()) {
  const { data: pedido, error } = await leerPedido(db, id);
  if (error) {
    console.error("Error consultando el pedido para la papelera:", error);
    return { status: 500, body: { error: "No se pudo consultar la solicitud." } };
  }
  if (!pedido) return { status: 404, body: { error: "La solicitud no existe." } };
  if (pedido.deleted_at) return { status: 409, body: { error: "Esta solicitud ya está en la papelera." } };
  if (!ESTADOS_PAPELERA.includes(pedido.status)) {
    return { status: 409, body: { error: "Solo puedes mover a la papelera solicitudes finalizadas o rechazadas." } };
  }

  // Las condiciones evitan pisar un cambio simultáneo.
  const { data: actualizado, error: errUpdate } = await db
    .from("orders")
    .update({ deleted_at: ahora.toISOString() })
    .eq("id", id)
    .in("status", ESTADOS_PAPELERA)
    .is("deleted_at", null)
    .select("id, status, deleted_at")
    .maybeSingle();
  if (errUpdate) {
    console.error("Error moviendo el pedido a la papelera:", errUpdate);
    return { status: 500, body: { error: "No se pudo mover la solicitud a la papelera." } };
  }
  if (!actualizado) return { status: 409, body: { error: "La solicitud cambió. Recarga la página." } };
  return { status: 200, body: { ok: true, ...actualizado } };
}

export async function restaurarDePapelera(db, id) {
  const { data: pedido, error } = await leerPedido(db, id);
  if (error) {
    console.error("Error consultando el pedido para restaurarlo:", error);
    return { status: 500, body: { error: "No se pudo consultar la solicitud." } };
  }
  if (!pedido) return { status: 404, body: { error: "La solicitud no existe." } };
  if (!pedido.deleted_at) return { status: 409, body: { error: "Esta solicitud no está en la papelera." } };

  const { data: actualizado, error: errUpdate } = await db
    .from("orders")
    .update({ deleted_at: null })
    .eq("id", id)
    .not("deleted_at", "is", null)
    .select("id, status, deleted_at")
    .maybeSingle();
  if (errUpdate) {
    console.error("Error restaurando el pedido de la papelera:", errUpdate);
    return { status: 500, body: { error: "No se pudo restaurar la solicitud." } };
  }
  if (!actualizado) return { status: 409, body: { error: "La solicitud cambió. Recarga la página." } };
  return { status: 200, body: { ok: true, ...actualizado } };
}
