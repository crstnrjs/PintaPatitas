import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Aviso, EmptyState, OrderList, PageHeader, Panel, STATUS, inputClass } from "@/admin/shared/ui";

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
    dot: "bg-[#4f8fb0]",
    vacio: "No tienes solicitudes nuevas",
  },
  { status: "en_proceso", title: "En proceso", description: "Pinturas en curso", dot: "bg-[#d99a37]", vacio: "No hay pinturas en curso" },
  { status: "finalizado", title: "Finalizados", description: "Pedidos enviados", dot: "bg-[#5ea67a]", vacio: "Aún no hay pedidos finalizados" },
  { status: "rechazado", title: "Rechazados", dot: "bg-[#cf6b60]", vacio: "No hay solicitudes rechazadas" },
];

function OrderSection({ orders, loading, section }) {
  return (
    <Panel
      bodyClass="pt-3 pb-2"
      title={
        <span className="flex items-center gap-2.5">
          <span aria-hidden="true" className={`size-2.5 rounded-full ${section.dot}`} />
          {section.title}
        </span>
      }
      description={section.description}
      action={
        <span className="rounded-full bg-bruma px-3 py-1 text-xs font-semibold text-acento-oscuro tabular-nums">
          {loading ? "…" : orders.length}
        </span>
      }
    >
      <OrderList orders={orders} loading={loading} showProduct empty={<EmptyState compact title={section.vacio} />} />
    </Panel>
  );
}

export default function Requests() {

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

  const chip = (activo) =>
    `min-h-10 shrink-0 rounded-full px-4 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento ${
      activo ? "bg-acento-oscuro text-white shadow-sm" : "text-tinta/65 hover:bg-white hover:text-tinta"
    }`;

  return (
    <div>
      <PageHeader title="Solicitudes" description="Todos los pedidos, ordenados por etapa. Toca uno para ver su ficha." />

      <div className="vidrio mb-6 flex flex-col gap-3 rounded-[24px] p-2.5 lg:flex-row lg:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Buscar solicitudes</span>
          <Search size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-tinta/40" aria-hidden="true" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nombre, correo, mascota o ID"
            className={`${inputClass} pl-11`}
          />
        </label>

        <div role="group" aria-label="Filtrar por estado" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-0.5">
          <button type="button" aria-pressed={status === ""} onClick={() => setStatus("")} className={chip(status === "")}>
            Todas
          </button>
          {FILTERS.map((value) => (
            <button key={value} type="button" aria-pressed={status === value} onClick={() => setStatus(value)} className={chip(status === value)}>
              {STATUS[value].label.charAt(0) + STATUS[value].label.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-5">
          <Aviso>No pudimos cargar las solicitudes. Revisa tu conexión y vuelve a intentarlo.</Aviso>
        </div>
      )}

      <div className="space-y-6">
        {visibleSections.map((section) => (
          <OrderSection
            key={section.status ?? section.statuses.join("-")}
            orders={orders.filter((order) =>
              section.statuses?.includes(order.status) || order.status === section.status,
            )}
            loading={loading}
            section={section}
          />
        ))}
      </div>
    </div>
  );
}
