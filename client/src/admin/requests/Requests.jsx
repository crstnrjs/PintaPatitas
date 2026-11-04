import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  STATUS,
  StatusBadge,
  formatDate,
  money,
  orderCode,
} from "@/admin/shared/ui";

const FILTERS = [
  "solicitud",
  "pendiente_abono",
  "en_proceso",
  "finalizado",
  "rechazado",
];

const SECTIONS = [
  {
    statuses: ["solicitud", "pendiente_abono"],
    title: "Solicitudes",
    description: "Por revisar o esperando el abono",
    border: "border-blue-500",
    heading: "text-blue-700",
    tint: "bg-blue-50/70",
  },
  {
    status: "en_proceso",
    title: "En proceso",
    border: "border-yellow-500",
    heading: "text-yellow-700",
    tint: "bg-yellow-50/70",
  },
  {
    status: "finalizado",
    title: "Finalizados",
    border: "border-green-500",
    heading: "text-green-700",
    tint: "bg-green-50/70",
  },
  {
    status: "rechazado",
    title: "Rechazados",
    border: "border-red-500",
    heading: "text-red-700",
    tint: "bg-red-50/70",
  },
];

function OrderTable({ orders, loading, section, navigate }) {
  return (
    <section className={`overflow-hidden rounded-2xl border border-line border-l-5 ${section.border} bg-white shadow-sm`}>
      <div className={`flex items-center justify-between gap-3 border-b border-line px-5 py-4 ${section.tint}`}>
        <div className="flex items-center gap-3">
          <span className={`h-8 w-1 rounded-full ${section.border.replace("border-", "bg-")}`} aria-hidden="true" />
          <div>
            <h2 className={`text-lg font-bold ${section.heading}`}>{section.title}</h2>
            {section.description && (
              <p className="text-xs text-muted-foreground">{section.description}</p>
            )}
          </div>
        </div>
        <span className={`rounded-full bg-white px-3 py-1 text-xs font-bold ${section.heading}`}>
          {loading ? "…" : orders.length}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-175 text-left text-sm">
          <thead className="border-b border-line text-xs text-muted-foreground uppercase">
            <tr>
              <th className="px-5 py-4">ID</th>
              <th className="px-5 py-4">Cliente</th>
              <th className="px-5 py-4">Mascota</th>
              <th className="px-5 py-4">Producto</th>
              <th className="px-5 py-4">Estado</th>
              <th className="px-5 py-4">Total</th>
              <th className="px-5 py-4">Fecha</th>
              <th className="px-5 py-4" />
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr
                key={order.id}
                onClick={() => navigate(`/admin/solicitudes/${order.id}`)}
                className="cursor-pointer border-b border-line last:border-0 hover:bg-black/2"
              >
                <td className="px-5 py-4 font-semibold text-(--deep)">
                  {orderCode(order.order_number)}
                </td>
                <td className="px-5 py-4">{order.customer_name}</td>
                <td className="px-5 py-4">{order.pet_name ?? "—"}</td>
                <td className="px-5 py-4">
                  {order.product ?? "—"}
                  {order.style && (
                    <span className="text-muted-foreground"> · {order.style}</span>
                  )}
                </td>
                <td className="px-5 py-4">
                  <StatusBadge status={order.status} />
                </td>
                <td className="px-5 py-4">{money(order.total_amount)}</td>
                <td className="px-5 py-4 text-muted-foreground">
                  {formatDate(order.created_at)}
                </td>
                <td className="px-5 py-4 text-muted-foreground">
                  <ChevronRight size={17} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && orders.length === 0 && (
          <p className="p-7 text-center text-sm text-muted-foreground">
            No hay pedidos en esta sección.
          </p>
        )}
        {loading && (
          <p className="p-7 text-center text-sm text-muted-foreground">Cargando pedidos…</p>
        )}
      </div>
    </section>
  );
}

export default function Requests() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");

  // Espera 300 ms después de escribir antes de buscar.
  useEffect(() => {
    const timeout = setTimeout(
      () => setQuery(search.trim().replace(/[,()%]/g, "")),
      300,
    );
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);

      let request = supabase
        .from("orders")
        .select(
          "id, order_number, customer_name, customer_email, pet_name, product, style, status, total_amount, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(500);

      if (status) request = request.eq("status", status);

      if (query) {
        const filters = [
          `customer_name.ilike.%${query}%`,
          `customer_email.ilike.%${query}%`,
          `pet_name.ilike.%${query}%`,
          `product.ilike.%${query}%`,
          `style.ilike.%${query}%`,
        ];
        const numberMatch = query.match(/^#?(?:pp-?)?(\d+)$/i);
        if (numberMatch) filters.push(`order_number.eq.${numberMatch[1]}`);
        request = request.or(filters.join(","));
      }

      const { data, error: loadError } = await request;
      if (ignore) return;

      if (loadError) {
        setError("No se pudieron cargar las solicitudes");
      } else {
        setError("");
        setOrders(data ?? []);
      }
      setLoading(false);
    }

    load();
    return () => {
      ignore = true;
    };
  }, [status, query]);

  const visibleSections = status
    ? SECTIONS.filter((section) => section.statuses?.includes(status) || section.status === status)
    : SECTIONS;

  return (
    <div>
      <header className="mb-8">
        <span className="text-[11px] font-extrabold tracking-[.12em] text-(--blue) uppercase">
          Administración
        </span>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-(--deep)">
          Solicitudes
        </h1>
      </header>

      <div className="mb-6 flex flex-wrap gap-3">
        <label className="flex h-11 min-w-64 flex-1 items-center gap-2 rounded-xl border border-line bg-white px-4 text-muted-foreground focus-within:border-mid">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nombre, correo, mascota o ID"
            className="h-full min-w-0 flex-1 bg-transparent text-sm text-(--ink) outline-none"
          />
        </label>

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="h-11 rounded-xl border border-line bg-white px-4 text-sm text-(--ink) outline-none"
        >
          <option value="">Todas las tablas</option>
          {FILTERS.map((value) => (
            <option key={value} value={value}>
              {STATUS[value].label}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="space-y-6">
        {visibleSections.map((section) => (
          <OrderTable
            key={section.status ?? section.statuses.join("-")}
            orders={orders.filter((order) =>
              section.statuses?.includes(order.status) || order.status === section.status,
            )}
            loading={loading}
            section={section}
            navigate={navigate}
          />
        ))}
      </div>
    </div>
  );
}
