import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { StatusBadge, formatDate, money, orderCode } from "@/admin/shared/ui";

export default function Dashboard() {
  const navigate = useNavigate();
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
    { label: "Solicitudes nuevas", value: nuevas, meta: "Por revisar" },
    { label: "En proceso", value: enProceso, meta: "Pinturas en curso" },
    { label: "Saldo por cobrar", value: money(porCobrar), meta: "Pedidos abiertos" },
    { label: "Finalizadas", value: completadasMes, meta: "Este mes" },
    { label: "Rechazadas", value: rechazado, meta: "Solicitudes rechazadas" },
  ];



  if (stats.label === nuevas){
    statsColor = "border-l-4 border-l-blue-300"
  };

  const recientes = orders.slice(0, 5);

  return (
    <div>
      <header className="mb-8">
        <span className="text-[11px] font-extrabold tracking-[.12em] text-(--blue) uppercase">
          Administración
        </span>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-(--deep)">Resumen</h1>
      </header>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((s) => {
          let statsColor = "";
          if (s.label === "Solicitudes nuevas"){
            statsColor = "border-l-5 border-l-blue-500"
          }
          if (s.label === "En proceso"){
            statsColor = "border-l-5 border-l-yellow-500"
          }
          if (s.label === "Saldo por cobrar"){
            statsColor = "border-l-5 border-l-violet-500"
          }
          if (s.label === "Finalizadas"){
            statsColor = "border-l-5 border-l-green-500"
          }
          if (s.label === "Rechazadas"){
            statsColor = "border-l-5 border-l-red-500"
          }
          return(
          <article key={s.label} className={`rounded-2xl ${statsColor} border border-line   shadow-lg  bg-white  p-5 `}>
            <span className="text-sm text-muted-foreground">{s.label}</span>
            <strong className="mt-2 block text-3xl font-bold text-(--deep)">
              {loading ? "—" : s.value}
            </strong>
            <small className="text-xs text-muted-foreground">{s.meta}</small>
          </article>
      )})}
      </div>

      <article className="mt-4 rounded-2xl border border-line bg-white shadow-lg  p-5">
        <span className="text-sm text-muted-foreground">Cobrado este mes</span>
        <strong className="mt-2 block text-3xl font-bold text-(--deep)">
          {loading ? "—" : money(cobradoMes)}
        </strong>
        <small className="text-xs text-muted-foreground">Abonos y saldos aprobados</small>
      </article>

      <section className="mt-6 rounded-2xl border border-line bg-white">
        <div className="flex items-center justify-between p-5">
          <div>
            <h2 className="font-bold text-(--deep)">Solicitudes recientes</h2>
            <p className="text-sm text-muted-foreground">Las últimas recibidas</p>
          </div>
          <Link
            to="/admin/solicitudes"
            className="inline-flex items-center gap-1 text-sm font-semibold text-(--blue)"
          >
            Ver todas <ArrowRight size={16} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-150 text-left text-sm">
            <thead className="border-y border-line text-xs text-muted-foreground uppercase">
              <tr>
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3">Cliente</th>
                <th className="px-5 py-3">Mascota</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3">Total</th>
                <th className="px-5 py-3">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {recientes.map((o) => (
                <tr
                  key={o.id}
                  onClick={() => navigate(`/admin/solicitudes/${o.id}`)}
                  className="cursor-pointer border-b border-line last:border-0 hover:bg-black/2"
                >
                  <td className="px-5 py-4 font-semibold text-(--deep)">{orderCode(o.order_number)}</td>
                  <td className="px-5 py-4">{o.customer_name}</td>
                  <td className="px-5 py-4">{o.pet_name ?? "—"}</td>
                  <td className="px-5 py-4"><StatusBadge status={o.status} /></td>
                  <td className="px-5 py-4">{money(o.total_amount)}</td>
                  <td className="px-5 py-4 text-muted-foreground">{formatDate(o.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && recientes.length === 0 && (
            <p className="p-8 text-center text-sm text-muted-foreground">Aún no hay solicitudes.</p>
          )}
        </div>
      </section>
    </div>
  );
}