import { useNavigate } from "react-router-dom";
import { ChevronRight, CircleAlert, CircleCheck, X } from "lucide-react";

/*
 * Sistema visual del panel admin. Comparte la paleta de la landing (index.css):
 * tinta #13303d · acento-oscuro #1b4458 · acento #2e6a85 · cielo #8abfd0 · bruma #dcecf1 · papel #fbfaf7
 * Superficies: .vidrio (header, filtros, modales) y .arcilla (tarjetas KPI, widgets).
 */

/* ---------- Estados ---------- */

export const STATUS = {
  pendiente_abono: { label: "PENDIENTE DE ABONO", className: "bg-[#ece8f5] text-[#56468a]", dot: "bg-[#8a7bc0]" },
  solicitud: { label: "SOLICITUD", className: "bg-[#e1eef5] text-[#1f5675]", dot: "bg-[#4f8fb0]" },
  en_proceso: { label: "EN PROCESO", className: "bg-[#faefd9] text-[#865710]", dot: "bg-[#d99a37]" },
  finalizado: { label: "FINALIZADO", className: "bg-[#e1f0e6] text-[#2d6844]", dot: "bg-[#5ea67a]" },
  rechazado: { label: "RECHAZADO", className: "bg-[#f7e3e1] text-[#963a31]", dot: "bg-[#cf6b60]" },
};

export function StatusBadge({ status }) {
  const s = STATUS[status] ?? { label: status, className: "bg-bruma text-tinta/70", dot: "bg-tinta/40" };
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ${s.className}`}>
      <span aria-hidden="true" className={`size-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

/* ---------- Formatos ---------- */

export const money = (n) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(n ?? 0);

export const formatDate = (d) => new Date(d).toLocaleDateString("es-CL");

export const orderCode = (n) => `#PP-${n}`;

export const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

/* ---------- Botones (clases para <button> o <Link>) ---------- */

const baseBtn =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100";

export const btn = {
  primary: `${baseBtn} bg-acento text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_8px_18px_-10px_rgb(27_68_88/0.8)] hover:bg-acento-oscuro`,
  secondary: `${baseBtn} border border-tinta/12 bg-white/80 text-acento-oscuro hover:bg-white`,
  ghost: `${baseBtn} text-acento-oscuro hover:bg-white/70`,
  danger: `${baseBtn} border border-[#e9c3bd] bg-white/80 text-[#963a31] hover:bg-[#f7e3e1]`,
  dangerSolid: `${baseBtn} bg-[#b8483c] text-white hover:bg-[#963a31]`,
};

export const inputClass =
  "h-11 w-full rounded-2xl border border-tinta/12 bg-white/85 px-4 text-sm text-tinta outline-none transition placeholder:text-tinta/40 focus:border-acento focus:ring-3 focus:ring-cielo/30";

/* ---------- Estructura ---------- */

export function PageHeader({ title, description, children, eyebrow }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow}
        <h1 className="font-display text-3xl text-tinta md:text-[2.5rem] md:leading-tight">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-tinta/60">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </header>
  );
}

export function Panel({ title, description, action, children, className = "", bodyClass = "p-5 md:p-6" }) {
  return (
    <section className={`overflow-hidden rounded-[26px] border border-white/80 bg-white/80 shadow-[0_18px_40px_-30px_rgb(19_48_61/0.5)] ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 px-5 pt-5 md:px-6">
          <div className="min-w-0">
            {title && <h2 className="text-lg font-semibold text-tinta">{title}</h2>}
            {description && <p className="text-sm text-tinta/55">{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={bodyClass}>{children}</div>
    </section>
  );
}

const tonos = {
  azul: "bg-[#e1eef5] text-[#1f5675]",
  ambar: "bg-[#faefd9] text-[#865710]",
  morado: "bg-[#ece8f5] text-[#56468a]",
  verde: "bg-[#e1f0e6] text-[#2d6844]",
  rojo: "bg-[#f7e3e1] text-[#963a31]",
};

/* Tarjeta KPI. destacado = versión azul profundo para la métrica principal. */
export function StatCard({ label, value, meta, icon: Icon, tono = "azul", destacado = false, loading = false }) {
  return (
    <article
      className={`relative overflow-hidden rounded-[24px] p-5 ${
        destacado
          ? "bg-gradient-to-br from-acento to-acento-oscuro text-white shadow-[0_22px_40px_-24px_rgb(19_48_61/0.9)]"
          : "arcilla"
      }`}
    >
      {destacado && (
        <svg aria-hidden="true" viewBox="0 0 200 200" className="absolute -right-10 -bottom-12 size-40 text-white/8">
          <path fill="currentColor" d="M44 30c26-22 74-26 106-6s46 60 36 96-44 64-84 70-74-14-88-48S18 52 44 30z" />
        </svg>
      )}
      <div className="relative flex items-start justify-between gap-3">
        <span className={`text-sm font-medium ${destacado ? "text-white/80" : "text-tinta/60"}`}>{label}</span>
        {Icon && (
          <span className={`grid size-9 shrink-0 place-items-center rounded-full ${destacado ? "bg-white/15 text-white" : tonos[tono]}`}>
            <Icon size={17} aria-hidden="true" />
          </span>
        )}
      </div>
      <strong className={`relative mt-3 block font-display text-[2rem] leading-none ${destacado ? "text-white" : "text-tinta"}`}>
        {loading ? <span className={`inline-block h-8 w-16 animate-pulse rounded-lg ${destacado ? "bg-white/20" : "bg-bruma"}`} /> : value}
      </strong>
      {meta && <small className={`relative mt-2 block text-xs ${destacado ? "text-white/70" : "text-tinta/50"}`}>{meta}</small>}
    </article>
  );
}

/* Estado vacío con una pincelada + huellita muy sutil. */
export function EmptyState({ title, text, children, compact = false }) {
  return (
    <div className={`flex flex-col items-center text-center ${compact ? "px-6 py-8" : "px-6 py-14"}`}>
      <svg aria-hidden="true" viewBox="0 0 120 64" className="h-12 w-24 text-cielo">
        <path d="M8 44c26-22 70-28 104-12" stroke="currentColor" strokeWidth="10" strokeLinecap="round" fill="none" opacity=".45" />
        <g fill="var(--color-acento)" opacity=".7" transform="translate(48 8) scale(.38)">
          <ellipse cx="32" cy="44" rx="14" ry="11" />
          <ellipse cx="14" cy="28" rx="6" ry="8" />
          <ellipse cx="25" cy="16" rx="6" ry="8" />
          <ellipse cx="39" cy="16" rx="6" ry="8" />
          <ellipse cx="50" cy="28" rx="6" ry="8" />
        </g>
      </svg>
      <p className="mt-3 font-medium text-tinta">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-tinta/55">{text}</p>}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}

export function Skeleton({ className = "" }) {
  return <span aria-hidden="true" className={`block animate-pulse rounded-xl bg-bruma/80 ${className}`} />;
}

/* Mensaje de error o éxito dentro de la página. */
export function Aviso({ tipo = "error", children, onClose }) {
  const ok = tipo === "ok";
  const Icon = ok ? CircleCheck : CircleAlert;
  return (
    <div
      role={ok ? "status" : "alert"}
      className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${
        ok ? "border-[#c6e2cf] bg-[#eef7f1] text-[#2d6844]" : "border-[#ecc8c2] bg-[#fbefed] text-[#963a31]"
      }`}
    >
      <Icon size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
      <p className="min-w-0 flex-1">{children}</p>
      {onClose && (
        <button type="button" onClick={onClose} aria-label="Cerrar mensaje" className="-m-1 grid size-7 shrink-0 place-items-center rounded-full hover:bg-black/5">
          <X size={15} />
        </button>
      )}
    </div>
  );
}

/* Toast flotante (abajo a la derecha). */
export function Toast({ tipo = "ok", children, onClose }) {
  return (
    <div className="fixed right-4 bottom-4 left-4 z-50 sm:left-auto sm:w-96 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3">
      <div className="vidrio rounded-2xl p-1">
        <Aviso tipo={tipo} onClose={onClose}>
          {children}
        </Aviso>
      </div>
    </div>
  );
}

/* Overlay y panel de modal compartidos. */
export const modalOverlay =
  "fixed inset-0 z-40 flex items-end justify-center bg-tinta/35 backdrop-blur-[3px] sm:items-center sm:p-4 motion-safe:animate-in motion-safe:fade-in";
export const modalPanel =
  "w-full rounded-t-[28px] border border-white/80 bg-papel shadow-[0_40px_80px_-30px_rgb(19_48_61/0.6)] sm:rounded-[28px] motion-safe:animate-in motion-safe:zoom-in-95 motion-safe:slide-in-from-bottom-4";

/* ---------- Lista de pedidos: tabla en escritorio, tarjetas en móvil ---------- */

export function OrderList({ orders, loading, showProduct = false, empty }) {
  const navigate = useNavigate();
  const abrir = (o) => navigate(`/admin/solicitudes/${o.id}`);
  const teclado = (e, o) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      abrir(o);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2 px-5 py-4 md:px-6" aria-label="Cargando pedidos">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </div>
    );
  }
  if (orders.length === 0) return empty ?? <EmptyState compact title="No hay pedidos aquí" />;

  return (
    <>
      {/* Móvil */}
      <ul className="divide-y divide-tinta/8 md:hidden">
        {orders.map((o) => (
          <li key={o.id}>
            <button
              type="button"
              onClick={() => abrir(o)}
              className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-bruma/40 focus-visible:bg-bruma/40 focus-visible:outline-none"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-bruma font-semibold text-acento-oscuro">
                {initials(o.pet_name || o.customer_name) || "?"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium text-tinta">{o.customer_name}</span>
                  <span className="shrink-0 text-sm font-semibold text-tinta">{money(o.total_amount)}</span>
                </span>
                <span className="mt-0.5 block truncate text-xs text-tinta/55">
                  {orderCode(o.order_number)} · {o.pet_name ?? "Sin nombre"} · {formatDate(o.created_at)}
                </span>
                <span className="mt-2 block">
                  <StatusBadge status={o.status} />
                </span>
              </span>
              <ChevronRight size={17} className="shrink-0 text-tinta/30" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>

      {/* Escritorio */}
      <div className="hidden md:block">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-tinta/50">
            <tr className="border-b border-tinta/8">
              <th className="px-6 py-3 font-medium">ID</th>
              <th className="px-3 py-3 font-medium">Cliente</th>
              <th className="px-3 py-3 font-medium">Mascota</th>
              {showProduct && <th className="px-3 py-3 font-medium">Producto</th>}
              <th className="px-3 py-3 font-medium">Estado</th>
              <th className="px-3 py-3 text-right font-medium">Total</th>
              <th className="px-3 py-3 font-medium">Fecha</th>
              <th className="w-10 px-3 py-3"><span className="sr-only">Abrir</span></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr
                key={o.id}
                tabIndex={0}
                aria-label={`Abrir solicitud ${orderCode(o.order_number)} de ${o.customer_name}`}
                onClick={() => abrir(o)}
                onKeyDown={(e) => teclado(e, o)}
                className="group cursor-pointer border-b border-tinta/6 transition-colors last:border-0 hover:bg-bruma/40 focus-visible:bg-bruma/50 focus-visible:outline-none"
              >
                <td className="px-6 py-3.5 font-semibold text-acento-oscuro">{orderCode(o.order_number)}</td>
                <td className="px-3 py-3.5 text-tinta">
                  <span className="flex items-center gap-2.5">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-bruma text-xs font-semibold text-acento-oscuro">
                      {initials(o.customer_name)}
                    </span>
                    <span className="truncate">{o.customer_name}</span>
                  </span>
                </td>
                <td className="px-3 py-3.5 text-tinta/80">{o.pet_name ?? "—"}</td>
                {showProduct && (
                  <td className="px-3 py-3.5 text-tinta/80">
                    {o.product ?? "—"}
                    {o.style && <span className="text-tinta/50"> · {o.style}</span>}
                  </td>
                )}
                <td className="px-3 py-3.5"><StatusBadge status={o.status} /></td>
                <td className="px-3 py-3.5 text-right font-medium tabular-nums text-tinta">{money(o.total_amount)}</td>
                <td className="px-3 py-3.5 text-tinta/55">{formatDate(o.created_at)}</td>
                <td className="px-3 py-3.5 text-tinta/30 transition group-hover:translate-x-0.5 group-hover:text-acento">
                  <ChevronRight size={17} aria-hidden="true" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
