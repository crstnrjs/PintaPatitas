import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Brush, CircleCheck, CircleX, Inbox, Wallet } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Aviso, EmptyState, OrderList, PageHeader, Panel, Skeleton, StatCard, btn, formatDate, money, orderCode } from "@/admin/shared/ui";

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function load() {
      const [ordersRes, paymentsRes] = await Promise.all([
        supabase
          .from("orders")
          .select("id, order_number, customer_name, pet_name, product, style, status, total_amount, created_at, updated_at")
          .neq("status", "pendiente_abono")
          .order("created_at", { ascending: false })
          .limit(500),
        supabase
          .from("payments")
          .select("order_id, amount, created_at")
          .eq("status", "aprobado")
          .limit(1000),
      ]);
      if (ignore) return;

      if (ordersRes.error || paymentsRes.error) {
        setError("No se pudieron cargar los datos");
      } else {
        setOrders(ordersRes.data);
        setPayments(paymentsRes.data);
      }
      setLoading(false);
    }

    load();
    return () => {
      ignore = true;
    };
  }, []);

  // Cálculos
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const paidByOrder = {};
  payments.forEach((p) => {
    paidByOrder[p.order_id] = (paidByOrder[p.order_id] ?? 0) + p.amount;
  });

  const nuevas = orders.filter((o) => o.status === "solicitud").length;
  const rechazado = orders.filter((o) => o.status === "rechazado").length;
  const enProceso = orders.filter((o) => o.status === "en_proceso").length;
  const completadasMes = orders.filter(
    (o) => o.status === "finalizado" && new Date(o.updated_at) >= monthStart
  ).length;
  const porCobrar = orders
    .filter((o) => ["solicitud", "en_proceso"].includes(o.status))
    .reduce((acc, o) => acc + Math.max(o.total_amount - (paidByOrder[o.id] ?? 0), 0), 0);
  const cobradoMes = payments
    .filter((p) => new Date(p.created_at) >= monthStart)
    .reduce((acc, p) => acc + p.amount, 0);


  const stats = [
    { label: "Solicitudes nuevas", value: nuevas, meta: "Por revisar", icon: Inbox, tono: "azul", destacado: true },
    { label: "En proceso", value: enProceso, meta: "Pinturas en curso", icon: Brush, tono: "ambar" },
    { label: "Saldo por cobrar", value: money(porCobrar), meta: "Pedidos abiertos", icon: Wallet, tono: "morado" },
    { label: "Finalizadas", value: completadasMes, meta: "Este mes", icon: CircleCheck, tono: "verde" },
    { label: "Rechazadas", value: rechazado, meta: "Solicitudes rechazadas", icon: CircleX, tono: "rojo" },
  ];

  const recientes = orders.slice(0, 5);
  const porRevisar = orders.filter((o) => o.status === "solicitud").slice(0, 4);

  return (
    <div>
      <PageHeader title="Dashboard" description="Una vista general de tu taller: lo que llegó, lo que estás pintando y lo que falta cobrar.">
        <Link to="/admin/solicitudes" className={btn.primary}>
          Ver solicitudes <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </PageHeader>

      {error && (
        <div className="mb-5">
          <Aviso>No pudimos cargar los datos del panel. Recarga la página en unos segundos.</Aviso>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} loading={loading} />
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Panel
          title="Solicitudes recientes"
          description="Las últimas recibidas"
          bodyClass="pt-3 pb-2"
          action={
            <Link to="/admin/solicitudes" className={btn.ghost}>
              Ver todas <ArrowRight size={16} aria-hidden="true" />
            </Link>
          }
        >
          <OrderList
            orders={recientes}
            loading={loading}
            empty={<EmptyState title="Aún no hay solicitudes" text="Cuando un cliente envíe su pedido desde el sitio, aparecerá aquí." />}
          />
        </Panel>

        <div className="space-y-6">
          <article className="arcilla relative overflow-hidden rounded-[26px] p-6">
            <svg aria-hidden="true" viewBox="0 0 200 60" className="absolute right-0 bottom-0 h-16 w-48 text-cielo/40">
              <path d="M0 50c40-30 110-40 200-14" stroke="currentColor" strokeWidth="14" strokeLinecap="round" fill="none" />
            </svg>
            <span className="text-sm font-medium text-tinta/60">Cobrado este mes</span>
            <strong className="mt-2 block font-display text-4xl text-tinta">
              {loading ? <Skeleton className="h-10 w-40" /> : money(cobradoMes)}
            </strong>
            <small className="relative mt-2 block text-xs text-tinta/50">Abonos y saldos aprobados</small>
          </article>

          <Panel title="Por revisar" description="Solicitudes esperando tu respuesta" bodyClass="px-3 pt-3 pb-3">
            {loading ? (
              <div className="space-y-2 px-2">
                {[0, 1].map((i) => <Skeleton key={i} className="h-14" />)}
              </div>
            ) : porRevisar.length === 0 ? (
              <EmptyState compact title="No tienes solicitudes nuevas" text="Todo al día por ahora." />
            ) : (
              <ul>
                {porRevisar.map((o) => (
                  <li key={o.id}>
                    <Link
                      to={`/admin/solicitudes/${o.id}`}
                      className="flex items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-bruma/50 focus-visible:bg-bruma/50 focus-visible:outline-none"
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#e1eef5] text-[#1f5675]">
                        <Inbox size={17} aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-tinta">
                          {o.pet_name ?? "Sin nombre"} · {o.customer_name}
                        </span>
                        <span className="block truncate text-xs text-tinta/50">
                          {orderCode(o.order_number)} · {formatDate(o.created_at)}
                        </span>
                      </span>
                      <ArrowRight size={15} className="shrink-0 text-tinta/30" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
