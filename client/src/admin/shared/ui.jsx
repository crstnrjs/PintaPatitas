export const STATUS = {
  pendiente_abono: { label: "PENDIENTE DE ABONO", className: "bg-gray-100 text-gray-600" },
  solicitud: { label: "SOLICITUD", className: "bg-blue-50 text-blue-700" },
  en_proceso: { label: "EN PROCESO", className: "bg-amber-50 text-amber-700" },
  finalizado: { label: "FINALIZADO", className: "bg-green-50 text-green-700" },
  rechazado: { label: "RECHAZADO", className: "bg-red-50 text-red-700" },
};

export function StatusBadge({ status }) {
  const s = STATUS[status] ?? { label: status, className: "bg-gray-100 text-gray-600" };
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-[11px] font-bold tracking-wide ${s.className}`}>
      {s.label}
    </span>
  );
}

export const money = (n) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(n ?? 0);

export const formatDate = (d) => new Date(d).toLocaleDateString("es-CL");

export const orderCode = (n) => `#PP-${n}`;