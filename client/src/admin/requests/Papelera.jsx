import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, RotateCcw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { apiUrl } from "@/lib/api";
import { Aviso, EmptyState, PageHeader, Panel, Skeleton, StatusBadge, Toast, btn, formatDate, money, orderCode } from "@/admin/shared/ui";

const SECCION = { finalizado: "Finalizados", rechazado: "Rechazados" };

export default function Papelera() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [restaurando, setRestaurando] = useState(null); // id del pedido que se está restaurando
  const [aviso, setAviso] = useState(null); // { tipo, texto }

  useEffect(() => {
    let ignore = false;

    async function load() {
      const { data, error: loadError } = await supabase
        .from("orders")
        .select("id, order_number, customer_name, pet_name, product, style, status, total_amount, created_at, deleted_at")
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false })
        .limit(500);
      if (ignore) return;

      if (loadError) setError("No se pudo cargar la papelera");
      else setOrders(data ?? []);
      setLoading(false);
    }

    load();
    return () => {
      ignore = true;
    };
  }, []);

  async function restaurar(order) {
    setRestaurando(order.id);
    setAviso(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch(apiUrl(`/api/orders/${order.id}/restore`), {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "No se pudo restaurar la solicitud.");
      setOrders((list) => list.filter((o) => o.id !== order.id));
      setAviso({ tipo: "ok", texto: `${orderCode(order.order_number)} volvió a ${SECCION[order.status] ?? "Solicitudes"}.` });
    } catch (err) {
      setAviso({
        tipo: "error",
        texto: err instanceof TypeError ? "No se pudo conectar con el servidor. Revisa que esté activo." : err.message,
      });
    }
    setRestaurando(null);
  }

  return (
    <div>
      <PageHeader
        title="Papelera"
        description="Solicitudes finalizadas o rechazadas que sacaste del panel. No se borra nada: puedes restaurarlas a su sección cuando quieras."
      />

      {error && (
        <div className="mb-5">
          <Aviso>No pudimos cargar la papelera. Revisa tu conexión y vuelve a intentarlo.</Aviso>
        </div>
      )}

      <Panel
        bodyClass="pt-3 pb-2"
        title="En la papelera"
        action={
          <span className="rounded-full bg-bruma px-3 py-1 text-xs font-semibold text-acento-oscuro tabular-nums">
            {loading ? "…" : orders.length}
          </span>
        }
      >
        {loading ? (
          <div className="space-y-2 px-5 py-4 md:px-6" aria-label="Cargando papelera">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <EmptyState compact title="La papelera está vacía" text="Desde la ficha de una solicitud finalizada o rechazada puedes moverla aquí." />
        ) : (
          <ul className="divide-y divide-tinta/8">
            {orders.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center gap-3 px-5 py-4 md:px-6">
                <Link
                  to={`/admin/solicitudes/${o.id}`}
                  className="group flex min-w-0 flex-1 items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-acento-oscuro">{orderCode(o.order_number)}</span>
                      <span className="truncate font-medium text-tinta">{o.customer_name}</span>
                      <StatusBadge status={o.status} />
                    </span>
                    <span className="mt-1 block truncate text-xs text-tinta/55">
                      {[o.pet_name, o.product, money(o.total_amount)].filter(Boolean).join(" · ")} · En la papelera desde el{" "}
                      {formatDate(o.deleted_at)}
                    </span>
                  </span>
                  <ChevronRight size={17} className="shrink-0 text-tinta/30 transition group-hover:text-acento" aria-hidden="true" />
                </Link>
                <button
                  type="button"
                  disabled={restaurando !== null}
                  onClick={() => restaurar(o)}
                  className={`${btn.secondary} disabled:cursor-not-allowed disabled:opacity-60`}
                  aria-label={`Restaurar ${orderCode(o.order_number)} a ${SECCION[o.status] ?? "Solicitudes"}`}
                >
                  <RotateCcw size={16} aria-hidden="true" />
                  {restaurando === o.id ? "Restaurando…" : "Restaurar"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {aviso && (
        <Toast tipo={aviso.tipo} onClose={() => setAviso(null)}>
          {aviso.texto}
        </Toast>
      )}
    </div>
  );
}
